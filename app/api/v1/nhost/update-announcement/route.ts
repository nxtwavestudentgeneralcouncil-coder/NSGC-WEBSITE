import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure we have an ID to update
        if (!body.id) {
            return NextResponse.json({ message: 'Missing announcement ID' }, { status: 400 });
        }

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isValidUUID(body.id)) {
            return NextResponse.json({ message: `Invalid announcement ID format: ${body.id}` }, { status: 400 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        const mutation = `
            mutation UpdateAnnouncement($id: uuid!, $title: String, $content: String, $category: String, $priority: String, $link: String, $added_by_role: String) {
                update_announcements_by_pk(pk_columns: {id: $id}, _set: {
                    title: $title,
                    content: $content,
                    category: $category,
                    priority: $priority,
                    link: $link,
                    added_by_role: $added_by_role
                }) {
                    id
                    title
                }
            }
        `;
 
        const result = await nhost.graphql.request({
            document: mutation,
            variables: {
                id: body.id,
                title: body.title,
                content: body.content,
                category: body.category,
                priority: body.priority,
                link: body.link,
                added_by_role: body.added_by_role || 'Council'
            }
        });

        const { data, error } = result;

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
