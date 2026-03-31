import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify session to get the current user's ID
        const session = await verifySession(request);
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // Fetch ratings for the current user
        // We filter by user_id and day (current day or last few days)
        // For simplicity and since students only see "Today" in the mess menu for rating,
        // we'll fetch all their ratings but we could optimize it later.
        const fetchMyRatingsQuery = `
            query GetMyMealRatings($userId: uuid!) {
                meal_ratings(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {
                    id
                    day
                    meal_type
                    rating
                    feedback
                    created_at
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(fetchMyRatingsQuery, { userId });
        
        if (error) {
            console.error('[get-my-meal-ratings] GraphQL Error:', error);
            return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: (data as any)?.meal_ratings || [] });

    } catch (error: any) {
        console.error('[get-my-meal-ratings] Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
