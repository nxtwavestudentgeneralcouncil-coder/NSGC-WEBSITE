import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, endpoint, keys_p256dh, keys_auth } = body;

    if (!userId || !endpoint || !keys_p256dh || !keys_auth) {
      return NextResponse.json(
        { error: 'userId, endpoint, keys_p256dh, and keys_auth are required' },
        { status: 400 }
      );
    }

    const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
    const nhost = createNhostClient({
      subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '',
      region: process.env.NEXT_PUBLIC_NHOST_REGION || '',
      adminSecret,
    });

    // Upsert: if the endpoint already exists for this user, update it
    const mutation = `
      mutation UpsertPushSubscription(
        $user_id: uuid!,
        $endpoint: String!,
        $keys_p256dh: String!,
        $keys_auth: String!
      ) {
        insert_push_subscriptions_one(
          object: {
            user_id: $user_id,
            endpoint: $endpoint,
            keys_p256dh: $keys_p256dh,
            keys_auth: $keys_auth
          },
          on_conflict: {
            constraint: push_subscriptions_endpoint_key,
            update_columns: [keys_p256dh, keys_auth, user_id]
          }
        ) {
          id
        }
      }
    `;

    const result = await nhost.graphql.request({
      document: mutation,
      variables: {
        user_id: userId,
        endpoint,
        keys_p256dh,
        keys_auth,
      }
    });

    const { data, error } = result;

    if (error) {
      const errorMessage = Array.isArray(error)
        ? error.map((e: any) => e?.message).join('; ')
        : (error as any).message || String(error);
      console.error('[subscribe-push] GraphQL error:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error('[subscribe-push] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
    const nhost = createNhostClient({
      subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || '',
      region: process.env.NEXT_PUBLIC_NHOST_REGION || '',
      adminSecret,
    });

    const mutation = `
      mutation DeletePushSubscription($endpoint: String!) {
        delete_push_subscriptions(where: { endpoint: { _eq: $endpoint } }) {
          affected_rows
        }
      }
    `;

    const result = await nhost.graphql.request({
      document: mutation,
      variables: { endpoint }
    });

    const { error } = result;

    if (error) {
      const errorMessage = Array.isArray(error)
        ? error.map((e: any) => e?.message).join('; ')
        : (error as any).message || String(error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
