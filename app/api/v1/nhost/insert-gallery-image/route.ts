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
            mutation InsertGalleryImage($src: String!, $alt: String!, $span: String!, $added_by_role: String!, $date_added: date!) {
                insert_gallery_images_one(object: {
                    src: $src,
                    alt: $alt,
                    span: $span,
                    added_by_role: $added_by_role,
                    date_added: $date_added
                }) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            src: body.src,
            alt: body.alt || '',
            span: body.span || 'col-span-1 row-span-1',
            added_by_role: body.added_by_role || 'President',
            date_added: body.date_added || new Date().toISOString().split('T')[0]
        });

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
