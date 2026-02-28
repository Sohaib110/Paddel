import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Build base URL for SSE (EventSource cannot use axios)
const getSSEBaseURL = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL;
  if (rawApiUrl) {
    const trimmed = rawApiUrl.replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return 'http://localhost:5000/api';
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const navigate = useNavigate();
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // ── Fetch full list (on mount + after marking read) ───────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.error('[NotificationBell] Fetch error:', err);
    }
  }, []);

  // ── Prepend a single new notification received via SSE ────────────────────
  const handleSSENotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    toast(`🔔 ${notification.title}`, {
      duration: 5000,
      style: { background: '#1e293b', color: '#fff', fontWeight: 700 },
    });
  }, []);

  // ── Start fallback polling (30s) ──────────────────────────────────────────
  const startFallbackPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(fetchNotifications, 30000);
  }, [fetchNotifications]);

  // ── Open SSE connection ───────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (!user) return;
    if (eventSourceRef.current) eventSourceRef.current.close();

    const token = localStorage.getItem('token');
    if (!token) return;

    const url = `${getSSEBaseURL()}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'connected') {
          setSseConnected(true);
          // SSE confirmed — cancel fallback polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (payload.type === 'new_notification') {
          handleSSENotification(payload.notification);
        }
      } catch (_) { /* ignore parse errors */ }
    };

    es.onerror = () => {
      setSseConnected(false);
      es.close();
      eventSourceRef.current = null;
      startFallbackPolling();
      // Reconnect after 10 seconds
      setTimeout(connectSSE, 10000);
    };

    eventSourceRef.current = es;
  }, [user, handleSSENotification, startFallbackPolling]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bootstrap on login, teardown on logout ───────────────────────────────
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    connectSSE();
    startFallbackPolling(); // safety net — cancelled by connectSSE on success

    return () => {
      if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
      setSseConnected(false);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark one read ─────────────────────────────────────────────────────────
  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationBell] Mark read error:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) handleMarkAsRead(notification._id);
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationBell] Mark all read error:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        title={sseConnected ? 'Notifications (live ✓)' : 'Notifications (polling)'}
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {/* Small green dot = SSE live */}
        {sseConnected && (
          <span className="absolute bottom-1 right-1 w-2 h-2 bg-padel-green rounded-full border border-white" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
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
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-primary">Notifications</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sseConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {sseConnected ? '● Live' : '○ Polling'}
                  </span>
                </div>
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
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
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
