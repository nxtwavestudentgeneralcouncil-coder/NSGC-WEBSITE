import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication & Authorization (Only high-level admins can delete elections)
        const session = await verifySession(req, ['president', 'admin', 'developer']);
        if (!session) {
            const basicSession = await verifySession(req);
            if (!basicSession) {
                return unauthorizedResponse('Authentication required to delete elections');
            }
            return forbiddenResponse('Only the President or Administrators can delete elections');
        }

        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Missing election ID' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation DeleteElection($id: uuid!) {
                delete_elections_by_pk(id: $id) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, { id: body.id });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message;
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error in delete-election:", err);
        return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
    }
}
