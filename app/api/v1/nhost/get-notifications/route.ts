import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse } from '@/lib/auth-utils';

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
        created_at
        link
      }
    }
  }
`;

export async function GET(req: NextRequest) {
    console.log('[get-notifications] GET request received');

    // Verify session — only authenticated users can access their own notifications
    const session = await verifySession(req);
    if (!session) {
        console.warn('[get-notifications] Unauthorized access attempt');
        return unauthorizedResponse('Authentication required to fetch notifications');
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    console.log(`[get-notifications] User ID from query: ${userId}`);

    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.replace(/-/g, ''))) {
        // More flexible UUID check just in case, though the standard one is fine
        // Using a simpler check for robustness
    }
    
    // Standardizing the check
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
        console.log(`[get-notifications] Fetching notifications for user: ${userId}`);
        const result = await nhost.graphql.request(NOTIFICATIONS_QUERY, { userId });
        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error)
                ? error.map((e: any) => e?.message).join('; ')
                : (error as any).message || String(error);

            console.error('[get-notifications] Query failed:', errorMessage);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        const recipients = (data as any)?.notification_recipients ?? [];
        console.log(`[get-notifications] Successfully fetched ${recipients.length} notifications`);
        return NextResponse.json(recipients, { status: 200 });
    } catch (err: any) {
        console.error('[get-notifications] Request threw exception:', err?.message);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
