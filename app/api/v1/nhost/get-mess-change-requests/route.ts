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
            query GetMessChangeRequests {
                mess_change_requests(order_by: { created_at: desc }) {
                    id student_name student_email day meal_type
                    current_item suggested_item status admin_notes
                    created_at updated_at
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(query);

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[get-mess-change-requests] Error:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json(data?.mess_change_requests ?? [], { status: 200 });
    } catch (err: any) {
        console.error('[get-mess-change-requests] Exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
