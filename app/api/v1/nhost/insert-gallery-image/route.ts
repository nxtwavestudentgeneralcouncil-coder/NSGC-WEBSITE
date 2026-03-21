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
            mutation InsertGalleryImage($src: String!, $alt: String!, $span: String!, $added_by_role: String!, $date_added: date!, $created_by: uuid) {
                insert_gallery_images_one(object: {
                    src: $src,
                    alt: $alt,
                    span: $span,
                    added_by_role: $added_by_role,
                    date_added: $date_added,
                    created_by: $created_by
                }) {
                    id
                }
            }
        `;

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const payload = {
            src: body.src,
            alt: body.alt || '',
            span: body.span || 'col-span-1 row-span-1',
            added_by_role: body.added_by_role || 'President',
            date_added: body.date_added || new Date().toISOString().split('T')[0],
            created_by: (body.created_by && isValidUUID(body.created_by)) ? body.created_by : null
        };

        let result = await nhost.graphql.request({
            document: mutation,
            variables: payload
        });
        let { data, error } = result;

        // Resiliency: Fallback to null created_by on FK violation
        if (error && payload.created_by !== null) {
            const errorMsg = Array.isArray(error) ? error[0]?.message : (error as any).message;
            if (errorMsg?.toLowerCase().includes('foreign key violation') || errorMsg?.toLowerCase().includes('violates foreign key constraint')) {
                console.warn("[insert-gallery-image] Foreign key violation for created_by. Retrying with null...");
                const fallbackPayload = { ...payload, created_by: null };
                const retry = await nhost.graphql.request({
                    document: mutation,
                    variables: fallbackPayload
                });
                data = retry.data;
                error = retry.error;
            }
        }

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
