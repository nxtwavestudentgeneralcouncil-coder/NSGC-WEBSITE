import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';
import { verifySession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { day, meal_type, rating, feedback } = body;

        if (!day || !meal_type || !rating) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Verify session
        const session = await verifySession(request);
        const userId = session?.user?.id;

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // Check if user already rated this meal
        const checkExistingQuery = `
            query CheckExistingRating($userId: uuid!, $day: String!, $mealType: String!) {
                meal_ratings(where: {
                    user_id: { _eq: $userId },
                    day: { _eq: $day },
                    meal_type: { _eq: $mealType }
                }) {
                    id
                }
            }
        `;

        const checkResult = await nhost.graphql.request(checkExistingQuery, { userId, day, meal_type });
        if ((checkResult.data as any)?.meal_ratings?.length > 0) {
            return NextResponse.json({ success: false, message: 'You have already rated this meal' }, { status: 400 });
        }

        // Insert rating
        const mutation = `
            mutation InsertMealRating($object: meal_ratings_insert_input!) {
                insert_meal_ratings_one(object: $object) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
            object: {
                day,
                meal_type,
                rating,
                feedback,
                user_id: userId
            }
        });

        if (result.error) {
            console.error('[insert-meal-rating] GraphQL Error:', result.error);
            return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
        }

        // Trigger alert for low rating (< 2.5)
        if (rating < 2.5) {
            // Find mess admin to notify
            const messAdminQuery = `
                query GetMessAdmins {
                    users(where: { _or: [
                        { roles: { role: { _eq: "mess_admin" } } },
                        { roles: { role: { _eq: "mess-admin" } } }
                    ]}) {
                        id
                    }
                }
            `;
            const adminResult = await nhost.graphql.request(messAdminQuery);
            const admins = adminResult.data?.users || [];

            for (const admin of admins) {
                await sendPushNotifications({
                    title: `⚠️ Alert: Low Meal Rating`,
                    message: `Low rating (${rating}/5) received for ${day} ${meal_type}. Feedback: ${feedback || 'None'}`,
                    type: 'alert',
                    targetUserId: admin.id,
                    link: '/dashboard/mess-admin'
                }).catch(err => console.error('[insert-meal-rating] Notification error:', err));
            }
        }

        return NextResponse.json({ success: true, data: result.data.insert_meal_ratings_one });

    } catch (error: any) {
        console.error('[insert-meal-rating] API Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
