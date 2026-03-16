import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = new NhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
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

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const payload = {
            title: body.title,
            description: body.description || '',
            event_date: body.event_date || new Date().toISOString(),
            venue: body.venue || 'TBA',
            organizer_type: body.organizer_type || 'council',
            registration_link: body.registration_link || null,
            created_by: (body.created_by && isValidUUID(body.created_by)) ? body.created_by : null,
            added_by_role: body.added_by_role || 'Council'
        };

        console.log("[insert-event] Payload:", payload);

        let { data, error } = await nhost.graphql.request(mutation, payload);

        // Resiliency: Fallback to null created_by on FK violation
        if (error && payload.created_by !== null) {
            const errorMsg = Array.isArray(error) ? error[0]?.message : (error as any).message;
            if (errorMsg?.toLowerCase().includes('foreign key violation') || errorMsg?.toLowerCase().includes('violates foreign key constraint')) {
                console.warn("[insert-event] Foreign key violation for created_by. Retrying with null...");
                const fallbackPayload = { ...payload, created_by: null };
                const retry = await nhost.graphql.request(mutation, fallbackPayload);
                data = retry.data;
                error = retry.error;
            }
        }

        if (error) {
            console.error("[insert-event] GraphQL Error:", error);
            const errMsg = Array.isArray(error) ? error[0]?.message : (error as any).message;
            return NextResponse.json({ message: errMsg, error: error }, { status: 400 });
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
