import { NhostClient } from '@nhost/nhost-js';
import { NextRequest, NextResponse } from 'next/server';

const nhost = new NhostClient({
    subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '').trim(),
    region: (process.env.NEXT_PUBLIC_NHOST_REGION || '').trim(),
    adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
});

const INSERT_CLUB_MEMBER = `
    mutation InsertClubMember($club_id: uuid!, $user_id: uuid!, $role: String!) {
        insert_club_members_one(object: {
            club_id: $club_id,
            user_id: $user_id,
            role: $role
        }) {
            id
        }
    }
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { club_id, user_id, role } = body;

        if (!club_id || !user_id || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await nhost.graphql.request(INSERT_CLUB_MEMBER, {
            club_id,
            user_id,
            role
        });

        if (error) {
            console.error('Error inserting club member:', error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any)?.message || 'Failed to insert club member';
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json(data.insert_club_members_one);
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
