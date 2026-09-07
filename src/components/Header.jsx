import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut, ChevronDown, Settings, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { resolveNotificationLink } from '../utils/notificationLinks';
import { notificationPriorityMeta } from '../utils/notificationPriority';
import { UserAvatar } from './UserAvatar';

export const Header = ({ onMenuClick, sidebarCollapsed = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    unreadCount,
    urgentUnreadCount,
    highUnreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
  } = useNotifications();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return undefined;
    fetchNotifications().catch(() => {});
    const onDocClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen, fetchNotifications]);

  const recentNotifications = (notifications || []).slice(0, 8);
  const alertCount = urgentUnreadCount || highUnreadCount;
  const badgeUrgent = urgentUnreadCount > 0;

  return (
    <header className="bg-white">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 rounded-md text-[#2f5d31] hover:text-white hover:bg-[#2f5d31]"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={24} />
            </button>
            <p className="hidden sm:block text-sm font-semibold text-gray-700">RWVCA Platform</p>
            {unreadCount > 0 && (
              <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                badgeUrgent
                  ? 'bg-rose-100 text-rose-700 ring-rose-200 animate-pulse'
                  : alertCount
                    ? 'bg-orange-100 text-orange-700 ring-orange-200'
                    : 'bg-[#2f5d31]/10 text-[#2f5d31] ring-[#2f5d31]/20'
              }`}>
                {badgeUrgent ? `${urgentUnreadCount} urgent` : `${unreadCount} unread`}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setNotifOpen((open) => !open);
                }}
                className={`p-2 rounded-lg relative ${
                  badgeUrgent
                    ? 'text-rose-700 hover:text-white hover:bg-rose-600'
                    : unreadCount > 0
                      ? 'text-[#2f5d31] bg-[#2f5d31]/10 hover:text-white hover:bg-[#2f5d31]'
                      : 'text-[#2f5d31] hover:text-white hover:bg-[#2f5d31]'
                }`}
              >
                <Bell size={20} className={badgeUrgent || unreadCount > 0 ? 'animate-pulse' : ''} />
                {unreadCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center ${
                    badgeUrgent ? 'bg-rose-600' : alertCount ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    <div className="flex items-center gap-2 text-xs">
                      {urgentUnreadCount > 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">{urgentUnreadCount} urgent</span>
                      )}
                      {highUnreadCount > 0 && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700">{highUnreadCount} high</span>
                      )}
                      {unreadCount > 0 && <span className="text-[#2f5d31] font-medium">{unreadCount} unread</span>}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <p className="px-4 py-8 text-sm text-gray-500 text-center">No notifications</p>
                    ) : (
                      recentNotifications.map((notification) => {
                        const meta = notificationPriorityMeta(notification.priority);
                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={async () => {
                              if (!notification.isRead) await markAsRead(notification.id);
                              setNotifOpen(false);
                              navigate(notification.href || resolveNotificationLink(notification.link));
                            }}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 border-l-4 hover:bg-gray-50 ${meta.bar} ${
                              !notification.isRead ? (meta.row || 'bg-blue-50') : 'opacity-80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {!notification.isRead && (
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#2f5d31]" title="Unread" />
                                  )}
                                  <p className={`text-sm truncate ${notification.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                                    {notification.title || 'Notification'}
                                  </p>
                                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${meta.className}`}>
                                    {meta.label}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="shrink-0 rounded-full bg-[#2f5d31] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                      Unread
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                              </div>
                              {notification.link && <ExternalLink size={14} className="text-[#2f5d31] shrink-0 mt-1" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-sm font-medium text-[#2f5d31] hover:bg-gray-50"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/dashboard/notifications');
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(false);
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center space-x-2 p-2 text-[#2f5d31] hover:text-white hover:bg-[#2f5d31] rounded-lg"
              >
                <UserAvatar name={user?.names || 'User'} size="md" />
                <span className="hidden sm:block text-sm font-medium">{user?.names || 'User'}</span>
                <ChevronDown size={16} className="hidden sm:block" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.names}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-[#2f5d31] font-medium">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/dashboard/profile');
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings size={16} className="mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
