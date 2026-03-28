import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // 1. Fetch overdue tickets that are not resolved
        const now = new Date().toISOString();
        const fetchOverdueQuery = `
            query GetOverdueTickets($now: timestamp!) {
                tickets(
                    where: {
                        status: { _nin: ["Completed", "Rejected"] },
                        due_at: { _lt: $now },
                        is_escalated: { _neq: true }
                    }
                ) {
                    id
                    subject
                    type
                    assigned_to
                    due_at
                    priority
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(fetchOverdueQuery, { now });
        if (error) {
            return NextResponse.json({ success: false, message: 'Failed to fetch tickets' }, { status: 500 });
        }

        const overdueTickets = (data as any)?.tickets || [];
        const processed = [];

        for (const ticket of overdueTickets) {
            // 2. Mark as escalated
            const escalateMutation = `
                mutation EscalateTicket($id: uuid!) {
                    update_tickets_by_pk(
                        pk_columns: { id: $id },
                        _set: { is_escalated: true }
                    ) {
                        id
                    }
                }
            `;
            await nhost.graphql.request(escalateMutation, { id: ticket.id });

            // 3. Send Notification to assigned staff (if any) or generic alert
            const notificationTitle = `⚠️ OVERDUE: ${ticket.subject || 'Complaint'}`;
            const notificationMessage = `The ${ticket.priority} priority complaint for ${ticket.type} has exceeded its SLA. Please resolve immediately.`;

            await sendPushNotifications({
                title: notificationTitle,
                message: notificationMessage,
                type: 'escalation',
                targetUserId: ticket.assigned_to, // Notify the person who failed the SLA
                link: `/dashboard/hostel-complaints?id=${ticket.id}`
            }).catch(err => console.error(`[check-overdue] Failed to notify for ${ticket.id}:`, err));

            // Also log to activity
            const logMutation = `
                mutation InsertEscalationLog($id: uuid!) {
                    insert_complaint_logs_one(object: {
                        complaint_id: $id,
                        action: "escalated",
                        description: "SLA breached. Ticket automatically escalated."
                    }) { id }
                }
            `;
            await nhost.graphql.request(logMutation, { id: ticket.id });

            processed.push(ticket.id);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${processed.length} overdue tickets`,
            processed_ids: processed
        });

    } catch (error: any) {
        console.error('[check-overdue] Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
