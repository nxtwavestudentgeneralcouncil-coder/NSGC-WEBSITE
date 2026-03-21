import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

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
    // The uuidRegex variable is removed, and the regex is inlined.
    // The console.warn message is slightly modified to include quotes around userId.
    // The error message in the NextResponse.json is changed.
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.warn(`[get-notifications] Invalid or missing userId: "${userId}"`);
        return NextResponse.json({ error: 'Invalid or missing user ID' }, { status: 400 });
    }

    const nhost = createNhostClient({
        subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
        region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
        adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
    });

    try {
        const result = await nhost.graphql.request({
            document: NOTIFICATIONS_QUERY,
            variables: { userId }
        });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error)
                ? error.map((e: any) => e?.message).join('; ')
                : (error as any).message || String(error);

            console.error('[get-notifications] Query failed:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json((data as any)?.notification_recipients ?? [], { status: 200 });
    } catch (err: any) {
        console.error('[get-notifications] Request threw exception:', err?.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
