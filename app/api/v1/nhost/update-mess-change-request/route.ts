import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

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

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const mutation = `
            mutation UpdateChangeRequest($id: uuid!, $status: String!, $admin_notes: String, $updated_at: timestamptz!) {
                update_mess_change_requests_by_pk(
                    pk_columns: { id: $id },
                    _set: { status: $status, admin_notes: $admin_notes, updated_at: $updated_at }
                ) {
                    id status admin_notes updated_at
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            id,
            status,
            admin_notes: admin_notes || null,
            updated_at: new Date().toISOString()
        });

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[update-mess-change-request] Error:', errorMessage);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error('[update-mess-change-request] Exception:', err?.message);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
