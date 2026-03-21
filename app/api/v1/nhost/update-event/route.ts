import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure we have an ID to update
        if (!body.id) {
            return NextResponse.json({ message: 'Missing event ID' }, { status: 400 });
        }

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isValidUUID(body.id)) {
            return NextResponse.json({ message: `Invalid event ID format: ${body.id}` }, { status: 400 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        const isClubEvent = !!body.is_club_event;
        const mutation = isClubEvent ? `
            mutation UpdateClubEvent($id: uuid!, $title: String, $description: String, $event_date: timestamptz, $image_url: String) {
                update_club_events_by_pk(pk_columns: {id: $id}, _set: {
                    title: $title,
                    description: $description,
                    event_date: $event_date,
                    image_url: $image_url
                }) {
                    id
                    title
                }
            }
        ` : `
            mutation UpdateEvent($id: uuid!, $title: String, $description: String, $event_date: timestamptz, $venue: String, $registration_link: String, $added_by_role: String, $organizer_type: String) {
                update_events_by_pk(pk_columns: {id: $id}, _set: {
                    title: $title,
                    description: $description,
                    event_date: $event_date,
                    venue: $venue,
                    registration_link: $registration_link,
                    added_by_role: $added_by_role,
                    organizer_type: $organizer_type
                }) {
                    id
                    title
                }
            }
        `;

        const payload: any = isClubEvent ? {
            id: body.id,
            title: body.title,
            description: body.description,
            event_date: body.event_date,
            image_url: body.image_url
        } : {
            id: body.id,
            title: body.title,
            description: body.description,
            event_date: body.event_date,
            venue: body.venue,
            registration_link: body.registration_link,
            added_by_role: body.added_by_role || 'Council',
            organizer_type: (body.added_by_role?.toLowerCase().includes('council') || body.organizer_type === 'council') ? 'council' : 'club'
        };

        const result = await nhost.graphql.request({
            document: mutation,
            variables: payload
        });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message;
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
