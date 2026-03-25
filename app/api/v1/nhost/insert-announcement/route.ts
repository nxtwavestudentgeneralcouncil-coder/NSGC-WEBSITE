import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication & Authorization
        const session = await verifySession(req, ['president', 'admin', 'developer', 'council']);
        if (!session) {
            const basicSession = await verifySession(req);
            if (!basicSession) {
                return unauthorizedResponse('Authentication required to post announcements');
            }
            return forbiddenResponse('You do not have permission to post announcements');
        }

        const body = await req.json();

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
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

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const payload = {
            title: body.title,
            content: body.content,
            category: body.category || 'General',
            priority: body.priority || 'Low',
            link: body.link || null,
            created_by: (body.created_by && isValidUUID(body.created_by)) ? body.created_by : null,
            added_by_role: body.added_by_role || 'Council'
        };

        console.log("[insert-announcement] Payload:", payload);

        let result = await nhost.graphql.request(mutation, payload);
        let { data, error } = result;

        // Resiliency: If Foreign Key Violation occurs (often due to user id sync issues),
        // retry once with created_by = null to ensure the data is at least added.
        if (error && payload.created_by !== null) {
            const errorMsg = Array.isArray(error) ? error[0]?.message : (error as any).message;
            if (errorMsg?.toLowerCase().includes('foreign key violation') || errorMsg?.toLowerCase().includes('violates foreign key constraint')) {
                console.warn("[insert-announcement] Foreign key violation for created_by. Retrying with null...");
                const fallbackPayload = { ...payload, created_by: null };
                const retry = await nhost.graphql.request(mutation, fallbackPayload);
                data = retry.data;
                error = retry.error;
            }
        }

        if (error) {
            console.error("[insert-announcement] GraphQL Error:", error);
            const errMsg = Array.isArray(error) ? error[0]?.message : (error as any).message;
            return NextResponse.json({ message: errMsg, error: error }, { status: 400 });
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
