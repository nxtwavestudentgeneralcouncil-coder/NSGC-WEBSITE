import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure we have an ID to update
        if (!body.id) {
            return NextResponse.json({ message: 'Missing announcement ID' }, { status: 400 });
        }

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const mutation = `
            mutation UpdateAnnouncement($id: uuid!, $title: String, $content: String, $category: String) {
                update_announcements_by_pk(pk_columns: {id: $id}, _set: {
                    title: $title,
                    content: $content,
                    category: $category
                }) {
                    id
                    title
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            id: body.id,
            title: body.title,
            content: body.content,
            category: body.category
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
