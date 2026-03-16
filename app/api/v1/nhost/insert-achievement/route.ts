import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const mutation = `
            mutation InsertAchievement($title: String!, $category: String!, $tier: String, $achievement_date: date!, $description: String!, $image_url: String, $student_id: uuid, $created_by: uuid, $added_by_role: String) {
                insert_achievements_one(object: {
                    title: $title,
                    category: $category,
                    tier: $tier,
                    achievement_date: $achievement_date,
                    description: $description,
                    image_url: $image_url,
                    student_id: $student_id,
                    created_by: $created_by,
                    added_by_role: $added_by_role
                }) {
                    id
                }
            }
        `;
 
        const { data, error } = await nhost.graphql.request(mutation, {
            title: body.title,
            category: (body.category || 'general').toLowerCase(),
            tier: body.tier || null,
            achievement_date: body.date || new Date().toISOString().split('T')[0],
            description: body.description || '',
            image_url: body.image || null,
            student_id: body.student_id || null,
            created_by: body.created_by || null,
            added_by_role: body.added_by_role || 'Council'
        });

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // Send push notifications
        sendPushNotifications({
            title: `🏆 New Achievement: ${body.title}`,
            message: body.description?.substring(0, 120) || 'A new achievement has been added!',
            type: 'achievement',
            link: '/achievements',
        }).catch(err => console.error('[insert-achievement] Notification error:', err));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
