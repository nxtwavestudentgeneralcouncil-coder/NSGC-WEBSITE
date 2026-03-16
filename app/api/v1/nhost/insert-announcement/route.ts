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
            mutation InsertAnnouncement($title: String!, $content: String!, $category: String!, $priority: String, $link: String, $created_by: uuid, $added_by_role: String) {
                insert_announcements_one(object: {
                    title: $title,
                    content: $content,
                    category: $category,
                    priority: $priority,
                    link: $link,
                    is_active: true,
                    created_by: $created_by,
                    added_by_role: $added_by_role
                }) {
                    id
                    title
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            title: body.title,
            content: body.content,
            category: body.category || 'General',
            priority: body.priority || 'Low',
            link: body.link || null,
            created_by: body.created_by || null,
            added_by_role: body.added_by_role || 'Council'
        });

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // Send push notifications
        sendPushNotifications({
            title: `📢 New Announcement: ${body.title}`,
            message: body.content?.substring(0, 120) || 'A new announcement has been posted.',
            type: 'announcement',
            link: '/announcements',
        }).catch(err => console.error('[insert-announcement] Notification error:', err));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
