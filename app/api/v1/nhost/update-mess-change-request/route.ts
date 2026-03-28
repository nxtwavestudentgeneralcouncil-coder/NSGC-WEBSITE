import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, status, admin_notes } = body;

        if (!id || !status) {
            return NextResponse.json({ message: 'Missing required fields: id, status' }, { status: 400 });
        }

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status. Must be: pending, approved, rejected' }, { status: 400 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret
        });

        const mutation = `
            mutation UpdateChangeRequest($id: uuid!, $status: String!, $admin_notes: String, $updated_at: timestamptz!) {
                update_mess_change_requests_by_pk(
                    pk_columns: { id: $id },
                    _set: { status: $status, admin_notes: $admin_notes, updated_at: $updated_at }
                ) {
                    id status admin_notes updated_at student_email suggested_item
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
                id,
                status,
                admin_notes: admin_notes || null,
                updated_at: new Date().toISOString()
            });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[update-mess-change-request] Error:', errorMessage);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        // Notify the student who submitted the request
        const updatedRecord = (data as any)?.update_mess_change_requests_by_pk;
        const studentEmail = updatedRecord?.student_email;
        const suggestedItem = updatedRecord?.suggested_item || 'your request';

        if ((status === 'approved' || status === 'rejected') && studentEmail) {
            const userLookupQuery = `
                query GetUserByEmail($email: citext!) {
                    users(where: { email: { _eq: $email } }, limit: 1) {
                        id
                    }
                }
            `;
            const userResult = await nhost.graphql.request(userLookupQuery, { email: studentEmail });
            const submitterUserId = (userResult.data as any)?.users?.[0]?.id;

            if (submitterUserId) {
                const emoji = status === 'approved' ? '✅' : '❌';
                const statusLabel = status === 'approved' ? 'Approved' : 'Rejected';
                sendPushNotifications({
                    title: `${emoji} Mess Change Request ${statusLabel}`,
                    message: `Your request for "${suggestedItem}" has been ${status}`,
                    type: 'mess_change',
                    link: '/complaints',
                    targetUserId: submitterUserId,
                }).catch(err => console.error('[update-mess-change-request] Notification error:', err));
            }
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error('[update-mess-change-request] Exception:', err?.message);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
