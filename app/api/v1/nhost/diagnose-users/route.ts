import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== 'check_my_data_123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret,
        });

        // 1. Fetch all auth users
        const { data: authData, error: authError } = await nhost.graphql.request(`
            query { users { id displayName email defaultRole avatarUrl createdAt roles { role } } }
        `);
        if (authError) return NextResponse.json({ error: authError }, { status: 400 });

        const authUsers = (authData as any).users || [];
        const results: any[] = [];

        // 2. Upsert each user into public_users_any (constraint: users_pkey)
        for (const user of authUsers) {
            const allRoles = user.roles?.map((r: any) => r.role) || [];
            const roleString = allRoles.join(',') || user.defaultRole || 'student';

            const { data, error } = await nhost.graphql.request(`
                mutation UpsertPublicUser($id: uuid!, $name: String!, $email: String!, $role: String!, $avatar_url: String, $created_at: timestamptz) {
                    insert_public_users_any_one(
                        object: { id: $id, name: $name, email: $email, role: $role, avatar_url: $avatar_url, created_at: $created_at },
                        on_conflict: { constraint: users_pkey, update_columns: [name, email, role, avatar_url] }
                    ) { id name email role }
                }
            `, {
                id: user.id,
                name: user.displayName || user.email || 'Unknown',
                email: user.email,
                role: roleString,
                avatar_url: user.avatarUrl || null,
                created_at: user.createdAt || new Date().toISOString()
            });

            results.push({
                user: user.displayName,
                success: !error,
                error: error ? (Array.isArray(error) ? error[0]?.message : (error as any)?.message) : null
            });
        }

        return NextResponse.json({
            message: `Synced ${results.filter(r => r.success).length}/${authUsers.length} users`,
            results
        });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
