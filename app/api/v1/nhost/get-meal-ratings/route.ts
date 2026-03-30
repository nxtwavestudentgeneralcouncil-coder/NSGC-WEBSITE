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

        // Fetch all meal ratings
        const fetchRatingsQuery = `
            query GetMealRatings {
                meal_ratings(order_by: { created_at: desc }) {
                    id
                    day
                    meal_type
                    rating
                    feedback
                    created_at
                    user {
                        displayName
                        email
                    }
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(fetchRatingsQuery);
        if (error) {
            console.error('[get-meal-ratings] GraphQL Error:', error);
            return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: (data as any)?.meal_ratings || [] });

    } catch (error: any) {
        console.error('[get-meal-ratings] Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
