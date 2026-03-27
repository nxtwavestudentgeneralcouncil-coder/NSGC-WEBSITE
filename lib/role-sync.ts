import { createNhostClient } from '@nhost/nhost-js';

/**
 * Synchronizes a user's role across auth.users, auth.user_roles, and public_users_any
 * Finds the user by email before updating.
 * 
 * @param email The email of the user to update
 * @param targetRole The primary role to assign (e.g., 'council', 'club_manager')
 * @param extraRoles Optional additional roles to append (e.g., ['council_member'])
 */
export async function syncUserRoleByEmail(email: string, targetRole: string, extraRoles: string[] = []) {
    if (!email) return;
    
    const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret
    });

    const query = `
        query GetUserByEmail($email: citext!) {
            users(where: { email: { _eq: $email } }) {
                id
                defaultRole
                roles {
                    role
                }
            }
        }
    `;

    try {
        const result = await nhost.graphql.request(query, { email });
        const { data, error } = result;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (error || !data || !(data as any).users || (data as any).users.length === 0) {
            console.log(`[RoleSync] User with email ${email} not found. Could not sync role.`);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (data as any).users[0];
        const userId = user.id;

        // Ensure user retains base permissions, their new primary role, and any extra roles
        // We use a Set to automatically deduplicate roles
        const rolesToSet = Array.from(new Set(['user', 'student', targetRole, ...extraRoles]));
        
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
                update_public_users_any_by_pk(pk_columns: { id: $userId }, _set: { role: $defaultRole }) {
                    id
                }
            }
        `;

        const userRolesToInsert = rolesToSet.map((role: string) => ({
            userId,
            role
        }));

        const updateResult = await nhost.graphql.request(mutation, {
            userId,
            defaultRole: targetRole,
            userRoles: userRolesToInsert
        });
        
        if (updateResult.error) {
            console.error(`[RoleSync] GraphQL error syncing roles for ${email}:`, updateResult.error);
        } else {
            console.log(`[RoleSync] Successfully synced roles for ${email} to ${targetRole}`);
        }
    } catch (e) {
        console.error(`[RoleSync] Network/Server Error syncing roles for ${email}:`, e);
    }
}
