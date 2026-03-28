import * as webPush from 'web-push';
import { createNhostClient } from '@nhost/nhost-js';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:nsgc@nxtwave.co.in';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('[notifications] VAPID keys are missing. Browser push notifications will not be sent.');
}

function createNhostAdmin(): any {
  const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
  return createNhostClient({
    subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
    region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
    adminSecret,
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface PushPayload {
  title: string;
  body: string;
  url?: string;
  type?: string;
  icon?: string;
  tag?: string;
}

interface NotificationOptions {
  title: string;
  message: string;
  type?: string;
  link?: string;
  /** If provided, only notify this specific user (e.g., for complaint status updates) */
  targetUserId?: string;
  /** If provided, notify all these users (e.g., all mess admins) */
  targetUserIds?: string[];
}

// ─── Fetch All Push Subscriptions ────────────────────────────────────────────
async function getAllPushSubscriptions(targetUserId?: string, targetUserIds?: string[]): Promise<any[]> {
  const nhost = createNhostAdmin();
  
  const query = `
    query GetPushSubscriptions($where: push_subscriptions_bool_exp) {
      push_subscriptions(where: $where) {
        id
        user_id
        endpoint
        keys_p256dh
        keys_auth
      }
    }
  `;

  const variables = {
    where: targetUserId 
      ? { user_id: { _eq: targetUserId } } 
      : Array.isArray(targetUserIds) && targetUserIds.length > 0
        ? { user_id: { _in: targetUserIds } }
        : {}
  };

  try {
    const result = await nhost.graphql.request(query, variables);
    const { data, error } = result;

    if (error) {
      console.error('[notifications] Failed to fetch push subscriptions:', error);
      return [];
    }
    return (data as any)?.push_subscriptions || [];
  } catch (err) {
    console.error('[notifications] Error fetching push subscriptions:', err);
    return [];
  }
}

// ─── Insert In-App Notification ──────────────────────────────────────────────
async function createInAppNotification(options: NotificationOptions): Promise<void> {
  const nhost = createNhostAdmin();

  try {
    // Step 1: Insert the notification record
    const insertNotif = `
      mutation InsertNotification($title: String!, $message: String!, $type: String, $link: String) {
        insert_notifications_one(object: {
          title: $title,
          message: $message,
          type: $type,
          link: $link
        }) {
          id
        }
      }
    `;

    const result = await nhost.graphql.request(
      insertNotif,
      {
        title: options.title,
        message: options.message,
        type: options.type || 'general',
        link: options.link || null,
      }
    );

    const { data: notifData, error: notifError } = result;

    if (notifError) {
      console.error('[notifications] Failed to insert notification:', notifError);
      return;
    }

    const notificationId = (notifData as any)?.insert_notifications_one?.id;
    if (!notificationId) return;

    // Step 2: Create notification_recipients for target users
    // Collect all target user IDs
    const allTargetIds: string[] = [];
    if (options.targetUserId) allTargetIds.push(options.targetUserId);
    if (options.targetUserIds) allTargetIds.push(...options.targetUserIds);
    // Deduplicate
    const uniqueTargetIds = [...new Set(allTargetIds)];

    if (uniqueTargetIds.length > 0) {
      // Targeted notification — specific users
      const recipientObjects = uniqueTargetIds.map(uid => ({
        notification_id: notificationId,
        user_id: uid,
        is_read: false,
      }));

      const insertManyRecipients = `
        mutation InsertManyRecipients($objects: [notification_recipients_insert_input!]!) {
          insert_notification_recipients(objects: $objects) {
            affected_rows
          }
        }
      `;
      await nhost.graphql.request(
        insertManyRecipients,
        { objects: recipientObjects }
      );
    } else {
      // Broadcast — get all users and create recipients
      const getUsersQuery = `
        query GetAllUsers {
          users {
            id
          }
        }
      `;
      const usersResult = await nhost.graphql.request(getUsersQuery);
      const { data: usersData } = usersResult;
      const users = (usersData as any)?.users || [];

      if (users.length > 0) {
        const recipientObjects = users.map((u: any) => ({
          notification_id: notificationId,
          user_id: u.id,
          is_read: false,
        }));

        const insertManyRecipients = `
          mutation InsertManyRecipients($objects: [notification_recipients_insert_input!]!) {
            insert_notification_recipients(objects: $objects) {
              affected_rows
            }
          }
        `;
        await nhost.graphql.request(
          insertManyRecipients,
          { objects: recipientObjects }
        );
      }
    }
  } catch (err) {
    console.error('[notifications] Error creating in-app notification:', err);
  }
}

// ─── Send Push Notifications ─────────────────────────────────────────────────
export async function sendPushNotifications(options: NotificationOptions): Promise<void> {
  console.log(`[notifications] Sending notification: "${options.title}"`);

  // Run both in-app and push in parallel, don't let either block the response
  const tasks: Promise<void>[] = [];

  // 1. Create in-app notification (stored in DB, shown in NotificationBell)
  tasks.push(createInAppNotification(options));

  // 2. Send browser push notifications
  if (vapidPublicKey && vapidPrivateKey) {
    tasks.push(
      (async () => {
        try {
          const allIds: string[] = [];
          if (options.targetUserId) allIds.push(options.targetUserId);
          if (options.targetUserIds) allIds.push(...options.targetUserIds);
          const subscriptions = allIds.length === 1
            ? await getAllPushSubscriptions(allIds[0])
            : allIds.length > 1
              ? await getAllPushSubscriptions(undefined, allIds)
              : await getAllPushSubscriptions();
          console.log(`[notifications] Found ${subscriptions.length} push subscription(s) for ${options.targetUserId || 'all users'}`);

          if (subscriptions.length === 0) return;

        const payload: PushPayload = {
          title: options.title,
          body: options.message,
          url: options.link || '/',
          type: options.type || 'general',
          icon: '/images/nsgc_logo_transparent.png',
          tag: options.type || 'nsgc-notification',
        };

        const pushPromises = subscriptions.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth,
            },
          };

          try {
            await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
          } catch (err: any) {
            console.error(`[notifications] Push failed for ${sub.endpoint}:`, err.statusCode || err.message);
            // If subscription is expired (410 Gone) or invalid (404), remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await removeExpiredSubscription(sub.id);
            }
          }
        });

        await Promise.allSettled(pushPromises);
        } catch (err) {
          console.error('[notifications] Push notification task failed:', err);
        }
      })()
    );
  }

  // Fire and forget — don't block the API response
  await Promise.allSettled(tasks);
}

// ─── Remove Expired Subscription ─────────────────────────────────────────────
async function removeExpiredSubscription(subscriptionId: string): Promise<void> {
  const nhost = createNhostAdmin();
  try {
    await nhost.graphql.request(
      `mutation DeleteSub($id: uuid!) {
        delete_push_subscriptions_by_pk(id: $id) { id }
      }`,
      { id: subscriptionId }
    );
    console.log(`[notifications] Removed expired subscription: ${subscriptionId}`);
  } catch (err) {
    console.error('[notifications] Failed to remove expired subscription:', err);
  }
}

// ─── Get User IDs by Role ────────────────────────────────────────────────────
/**
 * Look up all user IDs that have a specific role (e.g., 'mess_admin', 'hostel_complaints').
 * Queries Nhost's authUserRoles table.
 */
export async function getUserIdsByRole(role: string): Promise<string[]> {
  const nhost = createNhostAdmin();
  try {
    const query = `
      query GetUsersByRole($role: String!) {
        authUserRoles(where: { role: { _eq: $role } }) {
          userId
        }
      }
    `;
    const result = await nhost.graphql.request(query, { role });
    const { data, error } = result;

    if (error) {
      console.error(`[notifications] Failed to fetch users with role "${role}":`, error);
      return [];
    }

    const userRoles = (data as any)?.authUserRoles || [];
    const userIds = userRoles.map((ur: any) => ur.userId).filter(Boolean);
    console.log(`[notifications] Found ${userIds.length} user(s) with role "${role}"`);
    return userIds;
  } catch (err) {
    console.error(`[notifications] Error fetching users by role "${role}":`, err);
    return [];
  }
}

/**
 * Look up all user IDs that have ANY of the specified roles.
 * Returns deduplicated user IDs.
 */
export async function getUserIdsByRoles(roles: string[]): Promise<string[]> {
  const nhost = createNhostAdmin();
  try {
    const query = `
      query GetUsersByRoles($roles: [String!]!) {
        authUserRoles(where: { role: { _in: $roles } }) {
          userId
        }
      }
    `;
    const result = await nhost.graphql.request(query, { roles });
    const { data, error } = result;

    if (error) {
      console.error(`[notifications] Failed to fetch users with roles [${roles.join(', ')}]:`, error);
      return [];
    }

    const userRoles = (data as any)?.authUserRoles || [];
    const userIds = [...new Set(userRoles.map((ur: any) => ur.userId).filter(Boolean))] as string[];
    console.log(`[notifications] Found ${userIds.length} unique user(s) with roles [${roles.join(', ')}]`);
    return userIds;
  } catch (err) {
    console.error(`[notifications] Error fetching users by roles [${roles.join(', ')}]:`, err);
    return [];
  }
}
