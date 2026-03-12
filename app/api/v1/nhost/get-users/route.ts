import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST() {
    // Initialize Nhost client using environment variables
    const nhost = new NhostClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
        adminSecret: process.env.NHOST_ADMIN_SECRET || ''
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
        // Use the admin secret to bypass all Hasura permissions
        const { data, error } = await nhost.graphql.request(query, undefined, {
            headers: {
                'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET || ''
            }
        });

        if (error) {
            console.error(error);
            // Nhost GraphQL errors are often arrays of objects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        // Format data for test expectations (TestSprite TC001 expects allowedRoles)
        if (data && data.users) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.users = data.users.map((user: any) => ({
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
