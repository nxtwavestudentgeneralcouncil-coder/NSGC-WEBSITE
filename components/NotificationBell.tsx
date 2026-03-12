'use client';

import { useState, useEffect } from 'react';
import { useSubscription, useMutation, gql } from '@apollo/client';
import { useUserData } from '@nhost/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

// GraphQL Queries
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

const MARK_AS_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: uuid!) {
    update_notification_recipients_by_pk(
      pk_columns: { id: $id }
      _set: { is_read: true }
    ) {
      id
    }
  }
`;

function NotificationBellContent() {
  const user = useUserData();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Subscriptions & Mutations
  const { data, loading, error } = useSubscription(GET_NOTIFICATIONS_SUB, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const [markAsRead] = useMutation(MARK_AS_READ_MUTATION);

  const rawRecipients = data?.notification_recipients || [];
  const unreadCount = rawRecipients.filter((n: any) => !n.is_read).length;

  const handleNotificationClick = async (recipient: any) => {
    if (!recipient.is_read) {
      try {
        await markAsRead({ variables: { id: recipient.id } });
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    
    setIsOpen(false);
    if (recipient.notifications?.link) {
      router.push(recipient.notifications.link);
    }
  };

  if (!user) return null;

  return (
    <div className="relative z-50">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          <motion.div 
            key="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
        )}
        {isOpen && (
          <motion.div
            key="notification-dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 text-white"
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

                {!loading && !error && rawRecipients.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                    <p className="text-sm">You have no notifications yet.</p>
                  </div>
                )}

                {!loading && !error && rawRecipients.map((recipient: any) => {
                  const notification = recipient.notifications;
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
