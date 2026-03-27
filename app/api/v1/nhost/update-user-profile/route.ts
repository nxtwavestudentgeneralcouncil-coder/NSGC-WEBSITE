import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication
        const session = await verifySession(req);
        if (!session || !session.user) {
            return unauthorizedResponse('Authentication required');
        }

        const body = await req.json();
        const { userId, displayName, metadata } = body;

        // 2. Authorization: Current user can only update their own profile
        // Unless they have an admin/president/developer role (optional extension)
        const currentUserId = (session.user as any).id;
        
        if (userId && userId !== currentUserId) {
            const roles = (session.user as any).roles || [];
            const defaultRole = (session.user as any).defaultRole;
            const allRoles = [defaultRole, ...roles];
            const isAdmin = allRoles.some(role => ['admin', 'president', 'developer'].includes(role));
            
            if (!isAdmin) {
                return NextResponse.json({ message: 'You can only update your own profile.' }, { status: 403 });
            }
        }

        const targetUserId = userId || currentUserId;

        // 3. Setup Nhost Admin Client
        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret,
        });

        // 4. Update the user
        // Note: 'updateUser' GraphQL mutation on the 'auth.users' table
        const mutation = `
            mutation UpdateProfile($id: uuid!, $displayName: String!, $metadata: jsonb!) {
                updateUser(pk_columns: { id: $id }, _set: { displayName: $displayName, metadata: $metadata }) {
                    id
                    displayName
                    metadata
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
            id: targetUserId,
            displayName: displayName || (session.user as any).displayName || 'Student',
            metadata: {
                ...((session.user as any).metadata || {}),
                ...metadata
            }
        });

        const { data, error } = result;

        if (error) {
            console.error("[ProfileUpdate] GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        // 5. Also sync to public_users_any table (with roles)
        try {
            // Fetch user roles
            const rolesResult = await nhost.graphql.request(`
                query GetUserRoles($id: uuid!) {
                    user(id: $id) { defaultRole roles { role } email displayName avatarUrl }
                }
            `, { id: targetUserId });

            const userData = (rolesResult.data as any)?.user;
            if (userData) {
                const allRoles = userData.roles?.map((r: any) => r.role) || [];
                const roleString = allRoles.join(',') || userData.defaultRole || 'student';

                await nhost.graphql.request(`
                    mutation SyncPublicUser($id: uuid!, $name: String!, $email: String!, $role: String!, $avatar_url: String) {
                        insert_public_users_any_one(
                            object: { id: $id, name: $name, email: $email, role: $role, avatar_url: $avatar_url },
                            on_conflict: { constraint: users_pkey, update_columns: [name, email, role, avatar_url] }
                        ) { id }
                    }
                `, {
                    id: targetUserId,
                    name: displayName || userData.displayName || userData.email,
                    email: userData.email,
                    role: roleString,
                    avatar_url: userData.avatarUrl || null
                });
            }
        } catch (syncErr) {
            console.error("[ProfileUpdate] public_users_any sync error (non-fatal):", syncErr);
        }

        return NextResponse.json({ success: true, user: (data as any).updateUser }, { status: 200 });
    } catch (err: any) {
        console.error("[ProfileUpdate] Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
