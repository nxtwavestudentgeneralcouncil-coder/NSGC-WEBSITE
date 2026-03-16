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
            mutation InsertEvent($title: String!, $description: String!, $event_date: timestamptz!, $venue: String!, $organizer_type: String!, $registration_link: String, $created_by: uuid, $added_by_role: String) {
                insert_events_one(object: {
                    title: $title,
                    description: $description,
                    event_date: $event_date,
                    venue: $venue,
                    organizer_type: $organizer_type,
                    registration_link: $registration_link,
                    created_by: $created_by,
                    added_by_role: $added_by_role
                }) {
                    id
                    title
                    event_date
                    venue
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            title: body.title,
            description: body.description || '',
            event_date: body.event_date || new Date().toISOString(),
            venue: body.venue || 'TBA',
            organizer_type: body.organizer_type || 'council',
            registration_link: body.registration_link || null,
            created_by: body.created_by || null,
            added_by_role: body.added_by_role || 'Council'
        });

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // Send push notifications (fire and forget — don't block the response)
        sendPushNotifications({
            title: `📅 New Event: ${body.title}`,
            message: `${body.description?.substring(0, 100) || 'A new event has been added.'} — ${body.venue || 'TBA'}`,
            type: 'event',
            link: '/events',
        }).catch(err => console.error('[insert-event] Notification error:', err));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
