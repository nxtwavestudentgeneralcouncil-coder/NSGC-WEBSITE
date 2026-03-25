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
                return unauthorizedResponse('Authentication required to create events');
            }
            return forbiddenResponse('You do not have permission to create events');
        }

        const body = await req.json();

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        const isClubEvent = !!body.club_id;
        const insertMutation = isClubEvent ? `
            mutation InsertClubEvent($title: String!, $description: String!, $event_date: timestamptz!, $created_by: uuid, $club_id: uuid!, $image_url: String) {
                insert_club_events_one(object: {
                    club_id: $club_id,
                    title: $title,
                    description: $description,
                    event_date: $event_date,
                    created_by: $created_by,
                    image_url: $image_url
                }) {
                    id
                    title
                }
            }
        ` : `
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
                }
            }
        `;

        const payload: any = isClubEvent ? {
            title: body.title,
            description: body.description || '',
            event_date: body.event_date || new Date().toISOString(),
            club_id: body.club_id,
            image_url: body.image_url || null,
            created_by: (body.created_by && isValidUUID(body.created_by)) ? body.created_by : null
        } : {
            title: body.title,
            description: body.description || '',
            event_date: body.event_date || new Date().toISOString(),
            venue: body.venue || 'TBA',
            organizer_type: (body.added_by_role?.toLowerCase().includes('council') || body.organizer_type === 'council') ? 'council' : 'club',
            registration_link: body.registration_link || null,
            created_by: (body.created_by && isValidUUID(body.created_by)) ? body.created_by : null,
            added_by_role: body.added_by_role || 'Council'
        };

        console.log("[insert-event] Payload:", payload);

        let result = await nhost.graphql.request(insertMutation, payload);
        let { data, error } = result;

        // Resiliency: Fallback to null created_by on FK violation
        if (error && payload.created_by !== null) {
            const errorMsg = Array.isArray(error) ? error[0]?.message : (error as any).message;
            if (errorMsg?.toLowerCase().includes('foreign key violation') || errorMsg?.toLowerCase().includes('violates foreign key constraint')) {
                console.warn("[insert-event] Foreign key violation for created_by. Retrying with null...");
                const fallbackPayload = { ...payload, created_by: null };
                const retry = await nhost.graphql.request(insertMutation, fallbackPayload);
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
