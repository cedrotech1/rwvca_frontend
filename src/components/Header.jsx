import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut, ChevronDown, Settings, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { resolveNotificationLink } from '../utils/notificationLinks';
import { UserAvatar } from './UserAvatar';

export const Header = ({ onMenuClick, sidebarCollapsed = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, notifications, fetchNotifications, markAsRead } = useNotifications();
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
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setNotifOpen((open) => !open);
                }}
                className="p-2 text-[#2f5d31] hover:text-white hover:bg-[#2f5d31] rounded-lg relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    {unreadCount > 0 && <span className="text-xs text-[#2f5d31] font-medium">{unreadCount} unread</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <p className="px-4 py-8 text-sm text-gray-500 text-center">No notifications</p>
                    ) : (
                      recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={async () => {
                            if (!notification.isRead) await markAsRead(notification.id);
                            setNotifOpen(false);
                            navigate(notification.href || resolveNotificationLink(notification.link));
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{notification.title || 'Notification'}</p>
                              <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                            </div>
                            {notification.link && <ExternalLink size={14} className="text-[#2f5d31] shrink-0 mt-1" />}
                          </div>
                        </button>
                      ))
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
