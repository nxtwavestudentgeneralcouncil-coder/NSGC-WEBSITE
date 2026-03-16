import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Election ID is required' }, { status: 400 });
        }

        const nhost = new NhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const fs = require('fs');
        fs.appendFileSync('C:/Users/vuppa/OneDrive/Desktop/Project/NSGC/payload.log', 'UPDATE PAYLOAD: ' + JSON.stringify(body) + '\n');

        // Build candidates data array for insert
        const candidatesData = (body.candidates || []).map((c: any) => ({
            election_id: body.id,
            name: c.name,
            image: c.image || null,
            votes: c.votes || 0
        }));

        const mutation = `
            mutation UpdateElection($id: uuid!, $title: String!, $date: timestamptz!, $description: String!, $candidates: [election_candidates_insert_input!]!) {
                update_elections_by_pk(pk_columns: {id: $id}, _set: {title: $title, date: $date, description: $description}) {
                    id
                }
                delete_election_candidates(where: {election_id: {_eq: $id}}) {
                    affected_rows
                }
                insert_election_candidates(objects: $candidates) {
                    affected_rows
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            id: body.id,
            title: body.title,
            date: body.date,
            description: body.description || '',
            candidates: candidatesData
        });

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
