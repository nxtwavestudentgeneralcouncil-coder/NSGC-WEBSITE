import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ message: 'Missing notification recipient ID' }, { status: 400 });
        }

        const nhost = new NhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation MarkNotificationRead($id: uuid!) {
                update_notification_recipients_by_pk(
                    pk_columns: { id: $id }
                    _set: { is_read: true }
                ) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, { id });

        if (error) {
            console.error("[mark-notification-read] GraphQL Error:", error);
            return NextResponse.json({ error: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("[mark-notification-read] Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
