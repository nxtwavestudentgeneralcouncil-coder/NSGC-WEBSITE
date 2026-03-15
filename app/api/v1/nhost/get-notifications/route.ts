import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export const dynamic = 'force-dynamic';

const NOTIFICATIONS_QUERY = `
  query GetUserNotifications($userId: uuid!) {
    notification_recipients(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      is_read
      created_at
      notification {
        id
        title
        message
        type
        link
        created_at
      }
    }
  }
`;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const nhost = new NhostClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
        adminSecret: process.env.NHOST_ADMIN_SECRET || ''
    });

    try {
        const { data, error } = await nhost.graphql.request(NOTIFICATIONS_QUERY, { userId });

        if (error) {
            const errorMessage = Array.isArray(error)
                ? error.map((e: any) => e?.message).join('; ')
                : (error as any).message || String(error);

            console.error('[get-notifications] Query failed:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json(data?.notification_recipients || [], { status: 200 });
    } catch (err: any) {
        console.error('[get-notifications] Request threw exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
