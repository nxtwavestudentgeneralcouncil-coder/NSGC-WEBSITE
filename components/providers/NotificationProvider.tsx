'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUserData } from '@nhost/nextjs';

interface NotificationContextType {
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: 'default',
  isSubscribed: false,
  requestPermission: async () => {},
});

export const useNotificationPermission = () => useContext(NotificationContext);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useUserData();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check initial permission state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Register service worker and subscribe when permission is granted
  const subscribeUser = useCallback(async () => {
    if (!user?.id || !VAPID_PUBLIC_KEY) return;
    if (!('serviceWorker' in navigator)) return;

    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[NotificationProvider] Service Worker registered:', registration.scope);

      // Wait for the service worker to be ready
      const sw = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await sw.pushManager.getSubscription();

      if (!subscription) {
        // Create new push subscription
        subscription = await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
        console.log('[NotificationProvider] Push subscription created');
      }

      // Send subscription to the server
      const subJson = subscription.toJSON();
      const response = await fetch('/api/v1/nhost/subscribe-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          endpoint: subscription.endpoint,
          keys_p256dh: subJson.keys?.p256dh || '',
          keys_auth: subJson.keys?.auth || '',
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        console.log('[NotificationProvider] Push subscription registered with server');
      } else {
        if (response.status === 401) {
          const Cookies = (await import('js-cookie')).default;
          Cookies.remove('nhost-refreshToken');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json();
        console.error('[NotificationProvider] Failed to register subscription with server', errorData);
      }
    } catch (err) {
      console.error('[NotificationProvider] Subscription failed:', err);
    }
  }, [user?.id]);

  // Auto-subscribe when permission is granted
  useEffect(() => {
    if (permission === 'granted' && user?.id) {
      subscribeUser();
    }
  }, [permission, user?.id, subscribeUser]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await subscribeUser();
      }
    } catch (err) {
      console.error('[NotificationProvider] Permission request failed:', err);
    }
  }, [subscribeUser]);

  // Notification permission is now only requested via explicit user action (requestPermission)
  // Auto-prompting removed to avoid jarring UX and potential interaction blocking

  return (
    <NotificationContext.Provider value={{ permission, isSubscribed, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}
