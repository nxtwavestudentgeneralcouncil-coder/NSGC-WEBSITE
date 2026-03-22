import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation InsertSurvey($title: String!, $description: String!, $time: String!, $link: String) {
                insert_surveys_one(object: {
                    title: $title,
                    description: $description,
                    time: $time,
                    link: $link
                }) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, body);

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // Send push notifications for new feedback/survey
        sendPushNotifications({
            title: `📝 New Feedback Survey: ${body.title}`,
            message: body.description?.substring(0, 120) || 'A new feedback survey has been posted. Share your thoughts!',
            type: 'feedback',
            link: '/feedback',
        }).catch(err => console.error('[insert-survey] Notification error:', err));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
