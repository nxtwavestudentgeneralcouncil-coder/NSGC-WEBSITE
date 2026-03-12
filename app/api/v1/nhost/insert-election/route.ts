import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const fs = require('fs');
        fs.appendFileSync('C:/Users/vuppa/OneDrive/Desktop/Project/NSGC/payload.log', 'INSERT PAYLOAD: ' + JSON.stringify(body) + '\n');

        // Build candidates data array for nested insert
        const candidatesData = (body.candidates || []).map((c: any) => ({
            name: c.name,
            image: c.image || null,
            votes: 0
        }));

        const mutation = `
            mutation InsertElection($title: String!, $date: timestamptz!, $description: String!, $candidates: [election_candidates_insert_input!]!) {
                insert_elections_one(object: {
                    title: $title,
                    date: $date,
                    description: $description,
                    candidates: {
                        data: $candidates
                    }
                }) {
                    id
                    title
                    candidates {
                        id
                        name
                    }
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
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
