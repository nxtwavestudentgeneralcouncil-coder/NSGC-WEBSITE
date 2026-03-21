import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation InsertCouncilMember($name: String!, $role: String!, $email: String!, $status: String!, $image: String) {
                insert_council_members_one(object: {
                    name: $name,
                    role: $role,
                    email: $email,
                    status: $status,
                    image: $image
                }) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request({
            document: mutation,
            variables: {
                name: body.name,
                role: body.role,
                email: body.email,
                status: body.status || 'Active',
                image: body.image || null
            }
        });

        const { data, error } = result;

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
