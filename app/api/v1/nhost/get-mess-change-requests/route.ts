import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify session — any authenticated user can access this endpoint.
    // Filtering is done client-side based on the user's email.
    const session = await verifySession(req);
    if (!session) {
        return unauthorizedResponse('Authentication required to access mess change requests');
    }

    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    try {
        // Primary query with all known columns
        const query = `
            query GetMessChangeRequests {
                mess_change_requests(order_by: { created_at: desc }) {
                    id, student_name, student_email, day, meal_type,
                    current_item, suggested_item, status, admin_notes,
                    created_at, updated_at
                }
            }
        `;

        const result = await nhost.graphql.request(query);
        const { data, error } = result;

        if (error) {
            // Fallback: some columns may not exist in DB
            console.warn('[get-mess-change-requests] Primary query failed, trying fallback...');
            const safeQuery = `
                query GetMessChangeRequestsSafe {
                    mess_change_requests(order_by: { id: desc }) {
                        id, student_name, student_email, day, meal_type,
                        current_item, suggested_item, status
                    }
                }
            `;
            const safeResult = await nhost.graphql.request(safeQuery);
            if (safeResult.error) {
                const errorMessage = Array.isArray(safeResult.error)
                    ? safeResult.error[0]?.message
                    : (safeResult.error as any).message || String(safeResult.error);
                console.error('[get-mess-change-requests] Fallback also failed:', errorMessage);
                return NextResponse.json({ error: errorMessage }, { status: 500 });
            }
            const requests = (safeResult.data as any)?.mess_change_requests ?? [];
            console.log(`[get-mess-change-requests] Fallback returned ${requests.length} records`);
            return NextResponse.json(requests, { status: 200 });
        }

        const requests = (data as any)?.mess_change_requests ?? [];
        console.log(`[get-mess-change-requests] Returned ${requests.length} records`);
        return NextResponse.json(requests, { status: 200 });
    } catch (err: any) {
        console.error('[get-mess-change-requests] Exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
