'use client';

import { useState, useEffect, useCallback } from 'react';
import { gql } from '@apollo/client';
import { useUserData } from '@nhost/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

// Note: Subscriptions are kept but not currently used to avoid restricted access
const GET_NOTIFICATIONS_SUB = gql`
  subscription GetNotifications($userId: uuid!) {
    notification_recipients(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      is_read
      created_at
      notifications {
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

function NotificationBellContent() {
  const user = useUserData();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const uid = user?.id;
    if (!uid || typeof uid !== 'string') return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uid)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/nhost/get-notifications?userId=${uid}`);
      if (!res.ok) {
        if (res.status === 401) {
          const Cookies = (await import('js-cookie')).default;
          Cookies.remove('nhostRefreshToken');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch notifications: ${res.status}`);
      }
      const data = await res.json();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      console.error('[NotificationBell] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return; // Don't start polling until user is authenticated
    fetchNotifications();
    // Poll every 60 seconds as a simpler alternative to subscriptions since they are restricted
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, user?.id]);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const handleNotificationClick = async (recipient: any) => {
    if (!recipient.is_read) {
      try {
        const res = await fetch('/api/v1/nhost/mark-notification-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: recipient.id })
        });
        
        if (!res.ok) throw new Error('Failed to mark as read');
        
        // Optimistically update local state
        setNotifications(prev => prev.map(n => n.id === recipient.id ? { ...n, is_read: true } : n));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    
    setIsOpen(false);
    if (recipient.notification?.link) {
      router.push(recipient.notification.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" style={{ zIndex: 9999 }}>
      {/* Bell Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('[NotificationBell] Toggling dropdown. Current state:', !isOpen);
          setIsOpen(!isOpen);
        }}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <Bell className="w-6 h-6 text-gray-300" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"
          />
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              key="notification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-transparent cursor-default" 
              style={{ zIndex: 9998 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[NotificationBell] Closing via backdrop click');
                setIsOpen(false);
              }} 
            />
            <motion.div
              key="notification-dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 mb-4 w-80 sm:w-96 bg-gray-900 border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden text-white"
              style={{ zIndex: 9999 }}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-800/80">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 text-xs py-0.5 px-2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {loading && (
                  <div className="p-8 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                    <p className="text-sm">Loading notifications...</p>
                  </div>
                )}
                
                {error && (
                  <div className="p-4 text-center text-red-400 text-sm">
                    Failed to load notifications.
                  </div>
                )}

                {!loading && !error && notifications.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                    <p className="text-sm">You have no notifications yet.</p>
                  </div>
                )}

                {!loading && !error && notifications.map((recipient: any) => {
                  // Support both singular and plural relationship naming from different API versions or Hasura tracking
                  const notification = recipient.notification || 
                                     (recipient.notifications && Array.isArray(recipient.notifications) ? recipient.notifications[0] : null);
                  
                  if (!notification) return null; // Fallback if data is missing

                  return (
                    <div
                      key={recipient.id}
                      onClick={() => handleNotificationClick(recipient)}
                      className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-4 ${!recipient.is_read ? 'bg-cyan-900/10' : ''}`}
                    >
                      {/* Status Indicator / Icon */}
                      <div className="pt-1 flex-shrink-0">
                        {!recipient.is_read ? (
                          <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full mt-1.5" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-500 mt-1" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!recipient.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(recipient.created_at), { addSuffix: true })}
                          </p>
                          {notification.link && (
                            <ExternalLink className="w-3 h-3 text-cyan-500 opacity-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NotificationBell() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="p-2">
        <Bell className="w-6 h-6 text-gray-500" />
      </div>
    );
  }

  return <NotificationBellContent />;
}
