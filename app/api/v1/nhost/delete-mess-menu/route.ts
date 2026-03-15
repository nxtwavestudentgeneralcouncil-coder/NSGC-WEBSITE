import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ message: 'Missing required field: id' }, { status: 400 });
        }

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const mutation = `
            mutation DeleteMessMenu($id: uuid!) {
                delete_mess_menu_by_pk(id: $id) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, { id });

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[delete-mess-menu] Error:', errorMessage);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error('[delete-mess-menu] Exception:', err?.message);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
