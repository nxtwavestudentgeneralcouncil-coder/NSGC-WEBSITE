import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function GET() {
    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    const query = `
        query GetSystemStatus {
            system_settings_by_pk(key: "lockdown") {
                value
            }
        }
    `;

    try {
        const result = await nhost.graphql.request(query);
        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ active: false, error: 'Failed to fetch status' }, { status: 500 });
        }

        const active = data?.system_settings_by_pk?.value?.active || false;
        return NextResponse.json({ active }, { status: 200 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ active: false }, { status: 500 });
    }
}
