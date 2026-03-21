import { createNhostClient } from '@nhost/nhost-js';
import { NextRequest, NextResponse } from 'next/server';

const nhost = createNhostClient({
    subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '').trim(),
    region: (process.env.NEXT_PUBLIC_NHOST_REGION || '').trim(),
    adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
});

const DELETE_CLUB_MEMBER = `
    mutation DeleteClubMember($id: uuid!) {
        delete_club_members_by_pk(id: $id) {
            id
        }
    }
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const result = await nhost.graphql.request({
            document: DELETE_CLUB_MEMBER,
            variables: { id }
        });

        const { data, error } = result;

        if (error) {
            console.error('Error deleting club member:', error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any)?.message || 'Failed to delete club member';
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json((data as any).delete_club_members_by_pk);
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
