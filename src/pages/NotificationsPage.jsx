import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { useNotifications } from '../contexts/NotificationsContext';
import { resolveNotificationLink } from '../utils/notificationLinks';
import {
  NOTIFICATION_PRIORITIES,
  groupNotificationsByPriority,
  notificationPriorityMeta,
} from '../utils/notificationPriority';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notifications, unreadCount, byPriority, fetchNotifications, markAsRead, markAllRead } = useNotifications();
  const initialFilter = NOTIFICATION_PRIORITIES.some((item) => item.value === searchParams.get('priority'))
    ? searchParams.get('priority')
    : 'all';
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const next = searchParams.get('priority');
    if (NOTIFICATION_PRIORITIES.some((item) => item.value === next)) {
      setFilter(next);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchNotifications({ limit: 100 }).catch(() => {});
  }, [fetchNotifications]);

  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((row) => String(row.priority) === filter);
  }, [notifications, filter]);

  const groups = useMemo(() => groupNotificationsByPriority(visible), [visible]);

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

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-sm ${filter === 'all' ? 'bg-[#2f5d31] text-white' : 'bg-white ring-1 ring-gray-200 text-gray-700'}`}
        >
          All ({notifications.length})
        </button>
        {NOTIFICATION_PRIORITIES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${filter === item.value ? 'bg-[#2f5d31] text-white' : 'bg-white ring-1 ring-gray-200 text-gray-700'}`}
          >
            {item.label} ({byPriority?.[item.value] || 0} unread)
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const meta = notificationPriorityMeta(group.value);
          return (
            <div key={group.value} className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-100">
              <div className={`flex items-center justify-between border-l-4 px-4 py-3 ${meta.bar}`}>
                <div>
                  <p className="font-semibold text-gray-900">{group.label}</p>
                  <p className="text-xs text-gray-500">{group.hint}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.className}`}>
                  {group.items.length}
                </span>
              </div>
              <div className="divide-y">
                {group.items.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={`w-full border-l-4 text-left p-4 hover:bg-gray-50 ${meta.bar} ${row.isRead ? '' : meta.row || 'bg-blue-50'}`}
                    onClick={async () => {
                      if (!row.isRead) await markAsRead(row.id);
                      navigate(row.href || resolveNotificationLink(row.link));
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{row.title || 'Notification'}</p>
                        <p className="mt-1 text-sm text-gray-600">{row.message}</p>
                        {row.created_at && (
                          <p className="mt-2 text-xs text-gray-400">{new Date(row.created_at).toLocaleString()}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {!visible.length && <p className="rounded-xl bg-white p-8 text-center text-gray-500 ring-1 ring-gray-100">No notifications</p>}
      </div>
    </div>
  );
};
