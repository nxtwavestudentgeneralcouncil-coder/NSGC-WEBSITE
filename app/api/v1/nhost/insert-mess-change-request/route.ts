import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { student_id, student_name, student_email, day, meal_type, current_item, suggested_item } = body;

        if (!day || !meal_type || !suggested_item) {
            return NextResponse.json({ message: 'Missing required fields: day, meal_type, suggested_item' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation InsertChangeRequest($object: mess_change_requests_insert_input!) {
                insert_mess_change_requests_one(object: $object) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request({
            document: mutation,
            variables: {
                object: {
                    student_id: student_id || null,
                    student_name: student_name || null,
                    student_email: student_email || null,
                    day,
                    meal_type,
                    current_item: current_item || null,
                    suggested_item,
                    status: 'pending'
                }
            }
        });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[insert-mess-change-request] Error:', errorMessage);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error('[insert-mess-change-request] Exception:', err?.message);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
