import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication & Authorization
        const session = await verifySession(req, ['president', 'admin', 'developer']);
        if (!session) {
            const basicSession = await verifySession(req);
            if (!basicSession) {
                return unauthorizedResponse('Authentication required to view users list');
            }
            return forbiddenResponse('Only the President or Administrators can view the complete users list');
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const query = `
            query GetUsers {
                users {
                    id
                    displayName
                    email
                    defaultRole
                    roles {
                        role
                    }
                }
            }
        `;

        const result = await nhost.graphql.request(query);
        const { data, error } = result;

        if (error) {
            console.error(error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        if (data && (data as any).users) {
            (data as any).users = (data as any).users.map((user: any) => ({
                ...user,
                allowedRoles: user.roles ? user.roles.map((r: any) => r.role) : []
            }));
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
