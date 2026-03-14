import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure we have an ID to update
        if (!body.id) {
            return NextResponse.json({ message: 'Missing council member ID' }, { status: 400 });
        }

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const mutation = `
            mutation UpdateCouncilMember($id: uuid!, $name: String, $role: String, $email: String, $status: String, $image: String) {
                update_council_members_by_pk(pk_columns: {id: $id}, _set: {
                    name: $name,
                    role: $role,
                    email: $email,
                    status: $status,
                    image: $image
                }) {
                    id
                    name
                }
            }
        `;
 
        const { data, error } = await nhost.graphql.request(mutation, {
            id: body.id,
            name: body.name,
            role: body.role,
            email: body.email,
            status: body.status || 'Active',
            image: body.image
        });

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
