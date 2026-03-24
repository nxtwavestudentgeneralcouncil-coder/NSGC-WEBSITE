import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Missing survey ID' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation UpdateSurvey($id: uuid!, $title: String!, $description: String, $time: String, $link: String, $is_active: Boolean) {
                update_surveys_by_pk(
                    pk_columns: { id: $id },
                    _set: {
                        title: $title,
                        description: $description,
                        time: $time,
                        link: $link,
                        is_active: $is_active
                    }
                ) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
            id: body.id,
            title: body.title,
            description: body.description || '',
            time: body.time || '5 mins',
            link: body.link || '',
            is_active: body.is_active !== undefined ? body.is_active : true
        });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message;
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error in update-survey:", err);
        return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
    }
}
