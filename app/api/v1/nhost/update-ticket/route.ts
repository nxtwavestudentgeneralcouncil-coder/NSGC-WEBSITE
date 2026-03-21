import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, status, timeline, assigned_to } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Ticket ID is required' }, { status: 400 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // Build the _set object dynamically — only include fields that are provided
        const setFields: Record<string, any> = {};
        if (status !== undefined) setFields.status = status;
        if (timeline !== undefined) setFields.timeline = timeline;
        if (assigned_to !== undefined) setFields.assigned_to = assigned_to;

        if (Object.keys(setFields).length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
        }

        // Build a simple mutation with inline variables
        const mutation = `
            mutation UpdateTicket($id: uuid!, $_set: tickets_set_input!) {
                update_tickets_by_pk(
                    pk_columns: { id: $id },
                    _set: $_set
                ) {
                    id
                    status
                    title
                    timeline
                    assigned_to
                    updated_at
                    submitted_by
                    submitted_by_email
                }
            }
        `;

        const result = await nhost.graphql.request({
            document: mutation,
            variables: {
                id,
                _set: setFields
            }
        });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error)
                ? error.map((e: any) => e?.message).join('; ')
                : (error as any).message || String(error);
            
            console.error('[update-ticket] GraphQL error:', errorMessage);
            
            // Fallback: try with raw fetch and explicit field setting
            const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;
            const region = process.env.NEXT_PUBLIC_NHOST_REGION;
            const adminSecret = process.env.NHOST_ADMIN_SECRET;
            const nhostUrl = `https://${subdomain}.graphql.${region}.nhost.run/v1/graphql`;

            // Build a simpler mutation without the _set input type
            const setClause = Object.entries(setFields)
                .map(([key, _]) => `${key}: $${key}`)
                .join(', ');
            
            const varDefs = Object.entries(setFields)
                .map(([key, val]) => {
                    if (key === 'status') return `$${key}: String`;
                    if (key === 'assigned_to') return `$${key}: String`;
                    if (key === 'timeline') return `$${key}: jsonb`;
                    return `$${key}: String`;
                })
                .join(', ');

            const fallbackMutation = `
                mutation UpdateTicketFallback($id: uuid!, ${varDefs}) {
                    update_tickets_by_pk(
                        pk_columns: { id: $id },
                        _set: { ${setClause} }
                    ) {
                        id
                        status
                        title
                    }
                }
            `;

            const fallbackResponse = await fetch(nhostUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': adminSecret || '',
                },
                body: JSON.stringify({
                    query: fallbackMutation,
                    variables: { id, ...setFields },
                }),
            });

            const fallbackResult = await fallbackResponse.json();

            if (fallbackResult.errors) {
                console.error('[update-ticket] Fallback also failed:', fallbackResult.errors);
                return NextResponse.json({ success: false, errors: fallbackResult.errors }, { status: 500 });
            }

            // Send notification on fallback success too
            if (status) {
                const ticketTitle = fallbackResult.data?.update_tickets_by_pk?.title || 'Your complaint';
                sendPushNotifications({
                    title: `🔔 Complaint Update`,
                    message: `"${ticketTitle}" status changed to ${status}`,
                    type: 'complaint',
                    link: '/complaints',
                }).catch(err => console.error('[update-ticket] Notification error:', err));
            }

            console.log('[update-ticket] Fallback succeeded for ticket:', id);
            return NextResponse.json({ success: true, data: fallbackResult.data?.update_tickets_by_pk });
        }

        // Send push notification for status changes
        if (status) {
            const ticketData = (data as any)?.update_tickets_by_pk;
            const ticketTitle = ticketData?.title || 'Your complaint';
            
            sendPushNotifications({
                title: `🔔 Complaint Update`,
                message: `"${ticketTitle}" status changed to ${status}`,
                type: 'complaint',
                link: '/complaints',
            }).catch(err => console.error('[update-ticket] Notification error:', err));
        }

        console.log('[update-ticket] Updated ticket:', id, 'to status:', status);
        return NextResponse.json({ success: true, data: (data as any)?.update_tickets_by_pk });
    } catch (error: any) {
        console.error('[update-ticket] API Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
