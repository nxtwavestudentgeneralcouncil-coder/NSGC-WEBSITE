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

        const mutation = `
            mutation InsertSurvey($title: String!, $description: String!, $time: String!, $link: String) {
                insert_surveys_one(object: {
                    title: $title,
                    description: $description,
                    time: $time,
                    link: $link
                }) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, body);

        if (error) {
            console.error("GraphQL Error:", error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
