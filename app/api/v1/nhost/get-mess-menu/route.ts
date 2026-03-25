import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify session
    const allowedRoles = ['mess_admin', 'mess-admin', 'admin', 'developer', 'president', 'student', 'user', 'me_user'];
    const session = await verifySession(req, allowedRoles);
    if (!session) {
        return unauthorizedResponse('Authentication required to access mess menu');
    }

    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    try {
        const query = `
            query GetMessMenu {
                mess_menu(order_by: { day: asc, meal_type: asc }) {
                    id day meal_type items updated_at
                }
            }
        `;

        const result = await nhost.graphql.request(query);
        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[get-mess-menu] Error:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json((data as any)?.mess_menu ?? [], { status: 200 });
    } catch (err: any) {
        console.error('[get-mess-menu] Exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
