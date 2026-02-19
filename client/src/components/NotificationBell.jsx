import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification._id);
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-light-border z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-light-border flex justify-between items-center bg-light-surface">
                <h3 className="font-bold text-text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="text-xs text-padel-green hover:underline font-semibold">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-text-tertiary">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-light-border cursor-pointer transition-colors hover:bg-slate-50 ${!notif.is_read ? 'bg-blue-50' : 'bg-white'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-text-primary mb-1">{notif.title}</h4>
                          <p className="text-xs text-text-secondary line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-text-tertiary mt-1">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!notif.is_read && <div className="w-2 h-2 bg-padel-green rounded-full flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
