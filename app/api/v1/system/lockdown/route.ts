import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication & Authorization
        const session = await verifySession(req, ['admin', 'developer']);
        if (!session) {
            return forbiddenResponse('Only administrators can toggle system lockdown');
        }

        const body = await req.json();
        const { active } = body;

        if (typeof active !== 'boolean') {
            return NextResponse.json({ message: 'Missing "active" boolean status.' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const mutation = `
            mutation UpdateSystemLockdown($active: jsonb!) {
                insert_system_settings_one(
                    object: { key: "lockdown", value: $active },
                    on_conflict: { constraint: system_settings_pkey, update_columns: [value, updated_at] }
                ) {
                    key
                    value
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
            active: { active }
        });

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : 'Failed to update status' }, { status: 400 });
        }

        return NextResponse.json({ success: true, active: data?.insert_system_settings_one?.value?.active }, { status: 200 });
    } catch (err: any) {
        console.error("Function Error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
