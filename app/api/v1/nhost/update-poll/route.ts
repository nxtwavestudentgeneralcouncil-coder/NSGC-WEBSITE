import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Missing poll ID' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation UpdatePoll($id: uuid!, $question: String!, $options: jsonb!, $is_active: Boolean) {
                update_polls_by_pk(
                    pk_columns: { id: $id },
                    _set: {
                        question: $question,
                        options: $options,
                        is_active: $is_active
                    }
                ) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
            id: body.id,
            question: body.question,
            options: body.options || [],
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
        console.error("Server error in update-poll:", err);
        return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
    }
}
