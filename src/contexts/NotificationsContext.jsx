import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import api from '../services/api';
import { resolveNotificationLink } from '../utils/notificationLinks';
import { sortNotificationsByPriority, normalizeNotificationPriority } from '../utils/notificationPriority';
import { toPlainText } from '../utils/sanitize';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

function mapNotification(row) {
  return {
    ...row,
    title: toPlainText(row.title),
    message: toPlainText(row.message),
    priority: normalizeNotificationPriority(row.priority),
    isRead: String(row.status).toLowerCase() === 'read',
    createdAt: row.created_at,
    href: resolveNotificationLink(row.link),
  };
}

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated, dataRefreshTrigger } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentUnreadCount, setUrgentUnreadCount] = useState(0);
  const [highUnreadCount, setHighUnreadCount] = useState(0);
  const [byPriority, setByPriority] = useState({ urgent: 0, high: 0, middle: 0, low: 0 });

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setUrgentUnreadCount(0);
      setHighUnreadCount(0);
      setByPriority({ urgent: 0, high: 0, middle: 0, low: 0 });
      return;
    }
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { limit: params.limit || 50 }),
        api.get('/notifications/unread-count'),
      ]);
      const items = listRes?.data?.items || [];
      setNotifications(sortNotificationsByPriority(items.map(mapNotification)));
      setUnreadCount(countRes?.data?.count || 0);
      setUrgentUnreadCount(countRes?.data?.urgent_count || countRes?.data?.by_priority?.urgent || 0);
      setHighUnreadCount(countRes?.data?.high_count || countRes?.data?.by_priority?.high || 0);
      setByPriority(countRes?.data?.by_priority || { urgent: 0, high: 0, middle: 0, low: 0 });
    } catch {
      // ignore polling errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    if (!isAuthenticated) return undefined;
    const timer = setInterval(fetchNotifications, 60000);
    return () => clearInterval(timer);
  }, [fetchNotifications, dataRefreshTrigger, isAuthenticated]);

  const markAsRead = async (id) => {
    const current = notifications.find((row) => Number(row.id) === Number(id));
    await api.put(`/notifications/${id}/read`);
    setNotifications((rows) => rows.map((row) => (row.id === id ? { ...row, isRead: true, status: 'read' } : row)));
    if (current && !current.isRead) {
      const priority = normalizeNotificationPriority(current.priority);
      setUnreadCount((count) => Math.max(0, count - 1));
      if (priority === 'urgent') setUrgentUnreadCount((count) => Math.max(0, count - 1));
      if (priority === 'high') setHighUnreadCount((count) => Math.max(0, count - 1));
      setByPriority((prev) => ({ ...prev, [priority]: Math.max(0, (prev[priority] || 0) - 1) }));
    }
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((rows) => rows.map((row) => ({ ...row, isRead: true, status: 'read' })));
    setUnreadCount(0);
    setUrgentUnreadCount(0);
    setHighUnreadCount(0);
    setByPriority({ urgent: 0, high: 0, middle: 0, low: 0 });
  };

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    urgentUnreadCount,
    highUnreadCount,
    byPriority,
    fetchNotifications,
    markAsRead,
    markAllRead,
  }), [notifications, unreadCount, urgentUnreadCount, highUnreadCount, byPriority, fetchNotifications]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationsProvider');
  return context;
};
