import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const nhost = new NhostClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
        adminSecret: process.env.NHOST_ADMIN_SECRET || ''
    });

    try {
        const query = `
            query GetMessMenu {
                mess_menu(order_by: { day: asc, meal_type: asc }) {
                    id day meal_type items updated_at
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(query);

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[get-mess-menu] Error:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json(data?.mess_menu ?? [], { status: 200 });
    } catch (err: any) {
        console.error('[get-mess-menu] Exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
