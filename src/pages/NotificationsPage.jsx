import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { useNotifications } from '../contexts/NotificationsContext';
import { resolveNotificationLink } from '../utils/notificationLinks';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead } = useNotifications();

  useEffect(() => {
    fetchNotifications({ limit: 50 }).catch(() => {});
  }, [fetchNotifications]);

  return (
    <div>
      <PageHeading
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread` : 'All caught up'}
        icon={<Bell className="h-6 w-6" />}
        actions={unreadCount ? [{
          label: 'Mark all read',
          variant: 'secondary',
          onClick: () => markAllRead().catch(() => {}),
        }] : []}
      />
      <div className="bg-white rounded-xl divide-y ring-1 ring-gray-100">
        {notifications.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`w-full text-left p-4 hover:bg-gray-50 ${row.isRead ? '' : 'bg-blue-50'}`}
            onClick={async () => {
              if (!row.isRead) await markAsRead(row.id);
              navigate(row.href || resolveNotificationLink(row.link));
            }}
          >
            <p className="font-medium">{row.title || 'Notification'}</p>
            <p className="text-sm text-gray-600 mt-1">{row.message}</p>
            {row.created_at && <p className="text-xs text-gray-400 mt-2">{new Date(row.created_at).toLocaleString()}</p>}
          </button>
        ))}
        {!notifications.length && <p className="p-8 text-center text-gray-500">No notifications</p>}
      </div>
    </div>
  );
};
