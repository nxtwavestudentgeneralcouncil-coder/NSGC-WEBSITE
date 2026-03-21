import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
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

        const result = await nhost.graphql.request({ document: query });
        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[get-mess-change-requests] Error:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json((data as any)?.mess_change_requests ?? [], { status: 200 });
    } catch (err: any) {
        console.error('[get-mess-change-requests] Exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
