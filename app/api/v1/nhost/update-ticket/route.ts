import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';
import { verifySession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, timeline, assigned_to, after_image_url, scheduled_date, time_slot, is_escalated, action_note, due_at } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Ticket ID is required' }, { status: 400 });
        }

        // Verify session to get user ID for logging
        const session = await verifySession(request);
        const userId = session?.user?.id;

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // 1. Update the ticket
        const setFields: Record<string, any> = {};
        if (status !== undefined) setFields.status = status;
        if (timeline !== undefined) setFields.timeline = timeline;
        if (assigned_to !== undefined) setFields.assigned_to = assigned_to;
        if (after_image_url !== undefined) setFields.after_image_url = after_image_url;
        if (scheduled_date !== undefined) setFields.scheduled_date = scheduled_date;
        if (time_slot !== undefined) setFields.time_slot = time_slot;
        if (is_escalated !== undefined) setFields.is_escalated = is_escalated;
        if (due_at !== undefined) setFields.due_at = due_at;

        if (Object.keys(setFields).length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
        }

        const updateMutation = `
            mutation UpdateTicket($id: uuid!, $_set: tickets_set_input!) {
                update_tickets_by_pk(pk_columns: { id: $id }, _set: $_set) {
                    id
                    status
                    title
                    submitted_by_email
                }
            }
        `;

        const updateResult = await nhost.graphql.request(updateMutation, { id, _set: setFields });
        if (updateResult.error) {
            return NextResponse.json({ success: false, message: 'Failed to update ticket' }, { status: 400 });
        }

        // 2. Log the activity if action is significant
        let logAction = '';
        if (assigned_to) logAction = 'assigned';
        else if (status === 'Completed') logAction = 'resolved';
        else if (status) logAction = 'status_changed';
        else if (action_note?.includes('Comment')) logAction = 'comment_added';

        if (logAction) {
            const logMutation = `
                mutation InsertLog($object: complaint_logs_insert_input!) {
                    insert_complaint_logs_one(object: $object) {
                        id
                    }
                }
            `;
            await nhost.graphql.request(logMutation, {
                object: {
                    complaint_id: id,
                    action: logAction,
                    description: action_note || `Ticket ${logAction}`,
                    created_by: userId || null
                }
            });
        }

        // 3. Send Notifications
        const ticketTitle = updateResult.data?.update_tickets_by_pk?.title || 'Your complaint';
        const submittedByEmail = updateResult.data?.update_tickets_by_pk?.submitted_by_email;

        // Notify only the user who submitted the complaint
        if ((status || due_at) && submittedByEmail) {
            // Look up the submitter's user ID from their email
            const userLookupQuery = `
                query GetUserByEmail($email: citext!) {
                    users(where: { email: { _eq: $email } }, limit: 1) {
                        id
                    }
                }
            `;
            const userResult = await nhost.graphql.request(userLookupQuery, { email: submittedByEmail });
            const submitterUserId = userResult.data?.users?.[0]?.id;

            if (submitterUserId) {
                if (status) {
                    sendPushNotifications({
                        title: `🔔 Complaint Update`,
                        message: `"${ticketTitle}" status changed to ${status}`,
                        type: 'complaint',
                        link: '/complaints/history',
                        targetUserId: submitterUserId,
                    }).catch(err => console.error('[update-ticket] Notification error:', err));
                }
                
                if (due_at) {
                    const formattedDate = new Date(due_at).toLocaleDateString();
                    sendPushNotifications({
                        title: `⏰ Complaint Deadline Set`,
                        message: `A resolution deadline of ${formattedDate} has been set for "${ticketTitle}"`,
                        type: 'complaint',
                        link: '/complaints/history',
                        targetUserId: submitterUserId,
                    }).catch(err => console.error('[update-ticket] Deadline notification error:', err));
                }
            } else {
                console.warn(`[update-ticket] Could not find user for email: ${submittedByEmail}, skipping notification`);
            }
        }

        // Notify staff about assignment
        if (assigned_to) {
            sendPushNotifications({
                title: `📋 New Assignment`,
                message: `You have been assigned to: "${ticketTitle}"`,
                type: 'assignment',
                link: '/dashboard/hostel-complaints',
                targetUserId: assigned_to
            }).catch(err => console.error('[update-ticket] Assignment notification error:', err));
        }

        return NextResponse.json({ success: true, data: updateResult.data?.update_tickets_by_pk });
    } catch (error: any) {
        console.error('[update-ticket] API Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
