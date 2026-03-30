import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // 1. Fetch ratings for performance
        const ratingsQuery = `
            query GetAnalyticsData {
                meal_ratings {
                    meal_type
                    rating
                    day
                }
                mess_change_requests {
                    id
                    status
                    suggested_item
                }
                tickets(where: { _or: [ { type: { _eq: "Mess" } }, { department: { _eq: "Mess" } } ] }) {
                    id
                    category
                    priority
                    status
                    due_at
                    created_at
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(ratingsQuery);
        if (error) {
            console.error('[get-mess-analytics] GraphQL Error:', error);
            return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
        }

        const ratings = (data as any)?.meal_ratings || [];
        const suggestions = (data as any)?.mess_change_requests || [];
        const complaints = (data as any)?.tickets || [];

        // Aggregation logic
        // - avg rating per meal
        const mealPerformance: Record<string, { total: number, count: number }> = {};
        ratings.forEach((r: any) => {
            const key = `${r.day} ${r.meal_type}`;
            if (!mealPerformance[key]) mealPerformance[key] = { total: 0, count: 0 };
            mealPerformance[key].total += r.rating;
            mealPerformance[key].count += 1;
        });

        const performanceStats = Object.entries(mealPerformance).map(([meal, stats]) => ({
            meal,
            avgRating: Number((stats.total / stats.count).toFixed(2)),
            count: stats.count
        })).sort((a, b) => b.avgRating - a.avgRating);

        // - Suggestion acceptance rate
        const suggestionStats = {
            total: suggestions.length,
            approved: suggestions.filter((s: any) => s.status === 'approved').length,
            rejected: suggestions.filter((s: any) => s.status === 'rejected').length,
            pending: suggestions.filter((s: any) => s.status === 'pending').length
        };

        // - Complaint patterns
        const complaintPatterns: Record<string, number> = {};
        complaints.forEach((c: any) => {
            const cat = c.category || 'General';
            complaintPatterns[cat] = (complaintPatterns[cat] || 0) + 1;
        });

        // - Overdue summary
        const now = new Date();
        const overdueCount = complaints.filter((c: any) => 
            c.status !== 'Completed' && c.due_at && new Date(c.due_at) < now
        ).length;

        const analytics = {
            performanceStats,
            suggestionStats,
            complaintPatterns,
            overdueCount,
            totalComplaints: complaints.length,
            bestMeal: performanceStats[0] || null,
            worstMeal: performanceStats[performanceStats.length - 1] || null
        };

        return NextResponse.json({ success: true, data: analytics });

    } catch (error: any) {
        console.error('[get-mess-analytics] Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
