import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { candidateId } = body;

        if (!candidateId) {
            return NextResponse.json({ message: 'Candidate ID is required' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation CastVote($candidateId: uuid!) {
                update_election_candidates_by_pk(
                    pk_columns: {id: $candidateId},
                    _inc: {votes: 1}
                ) {
                    id
                    votes
                    election_id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, { candidateId });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error casting vote:", error);
            return NextResponse.json({ 
                message: Array.isArray(error) ? error[0]?.message : (error as any).message 
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server Error casting vote:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
