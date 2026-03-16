import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, defaultRole } = body;
        const roles = body.roles || body.allowedRoles;

        if (!userId || !defaultRole || !roles || !Array.isArray(roles)) {
            return NextResponse.json({ message: 'Missing required body parameters.' }, { status: 400 });
        }

        const validRoles = ['user', 'me', 'student', 'admin', 'council', 'president', 'council_member', 'club_head', 'club_manager', 'member', 'developer', 'hostel_complaints', 'mess_admin'];
        
        if (!validRoles.includes(defaultRole)) {
            return NextResponse.json({ message: 'invalid role: ' + defaultRole }, { status: 400 });
        }
        for (const role of roles) {
            if (!validRoles.includes(role)) {
                return NextResponse.json({ message: 'invalid role: ' + role }, { status: 400 });
            }
        }

        const nhost = new NhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation UpdateUserRoles($userId: uuid!, $defaultRole: String!, $userRoles: [authUserRoles_insert_input!]!) {
                updateUser(pk_columns: { id: $userId }, _set: { defaultRole: $defaultRole }) {
                    id
                }
                deleteAuthUserRoles(where: { userId: { _eq: $userId } }) {
                    affected_rows
                }
                insertAuthUserRoles(objects: $userRoles) {
                    affected_rows
                }
            }
        `;

        const userRolesToInsert = roles.map((role: string) => ({
            userId,
            role
        }));

        const { data, error } = await nhost.graphql.request(mutation, {
            userId,
            defaultRole,
            userRoles: userRolesToInsert
        }, {
            headers: {
                // Must pass the admin secret header securely from the backend to bypass permissions
                'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET || ''
            }
        });

        if (error) {
            console.error("GraphQL Error:", error);
            // Return first error message back to client clearly
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // Return updated user data directly in response format expected by tests
        return NextResponse.json({ 
            success: true, 
            id: userId,
            defaultRole: defaultRole,
            allowedRoles: roles,
            data 
        }, { status: 200 });
    } catch (err: any) {
        console.error("Function Error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
