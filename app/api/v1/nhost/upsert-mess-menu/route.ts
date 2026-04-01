import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { day, meal_type, items, image_url, items_json, updated_by } = body;

        if (!day || !meal_type || !items) {
            return NextResponse.json({ message: 'Missing required fields: day, meal_type, items' }, { status: 400 });
        }

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret
        });

        const mutation = `
            mutation UpsertMessMenu($object: mess_menu_insert_input!, $update_columns: [mess_menu_update_column!]!) {
                insert_mess_menu_one(
                    object: $object,
                    on_conflict: { constraint: mess_menu_day_meal_type_key, update_columns: $update_columns }
                ) {
                    id day meal_type items image_url items_json updated_at
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
                object: {
                    day,
                    meal_type,
                    items,
                    image_url: image_url || null,
                    items_json: items_json || [],
                    updated_by: updated_by || null,
                    updated_at: new Date().toISOString()
                },
                update_columns: ['items', 'image_url', 'items_json', 'updated_at', 'updated_by']
            });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error('[upsert-mess-menu] Error:', errorMessage);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error('[upsert-mess-menu] Exception:', err?.message);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
