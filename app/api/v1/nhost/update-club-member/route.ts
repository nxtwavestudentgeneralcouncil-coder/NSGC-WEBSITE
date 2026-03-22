import { createNhostClient } from '@nhost/nhost-js';
import { NextRequest, NextResponse } from 'next/server';

const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
const nhost = createNhostClient({
    subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '').trim(),
    region: (process.env.NEXT_PUBLIC_NHOST_REGION || '').trim(),
    adminSecret
});

const UPDATE_CLUB_MEMBER = `
    mutation UpdateClubMember($id: uuid!, $role: String!, $custom_name: String, $custom_email: String) {
        update_club_members_by_pk(
            pk_columns: { id: $id },
            _set: { role: $role, custom_name: $custom_name, custom_email: $custom_email }
        ) {
            id
            role
            custom_name
            custom_email
        }
    }
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, role, custom_name, custom_email } = body;

        if (!id || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const isValidUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
        if (!isValidUUID(id)) {
            console.warn(`[update-club-member] Invalid UUID received: "${id}"`);
            return NextResponse.json({ error: `Invalid ID format: ${id}. Must be a UUID.` }, { status: 400 });
        }

        console.log(`[update-club-member] Updating member ${id} to role ${role}`);

        const result = await nhost.graphql.request(UPDATE_CLUB_MEMBER, {
                id,
                role,
                custom_name: custom_name || null,
                custom_email: custom_email || null
            });

        const { data, error } = result;

        if (error) {
            console.error('Error updating club member:', error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any)?.message || 'Failed to update club member';
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json((data as any).update_club_members_by_pk);
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
