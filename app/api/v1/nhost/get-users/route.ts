import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST() {
    // Initialize Nhost client using environment variables
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

    try {
        // Use the admin secret configured above
        const result = await nhost.graphql.request({ document: query });
        const { data, error } = result;

        if (error) {
            console.error(error);
            // Nhost GraphQL errors are often arrays of objects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        // Format data for test expectations (TestSprite TC001 expects allowedRoles)
        if (data && (data as any).users) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
