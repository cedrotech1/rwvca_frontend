import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import api from '../services/api';
import { resolveNotificationLink } from '../utils/notificationLinks';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

function mapNotification(row) {
  return {
    ...row,
    isRead: String(row.status).toLowerCase() === 'read',
    createdAt: row.created_at,
    href: resolveNotificationLink(row.link),
  };
}

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated, dataRefreshTrigger } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { limit: params.limit || 50 }),
        api.get('/notifications/unread-count'),
      ]);
      const items = listRes?.data?.items || [];
      setNotifications(items.map(mapNotification));
      setUnreadCount(countRes?.data?.count || 0);
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
    await api.put(`/notifications/${id}/read`);
    setNotifications((rows) => rows.map((row) => (row.id === id ? { ...row, isRead: true, status: 'read' } : row)));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications((rows) => rows.map((row) => ({ ...row, isRead: true, status: 'read' })));
    setUnreadCount(0);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationsProvider');
  return context;
};
