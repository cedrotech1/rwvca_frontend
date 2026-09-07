import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

const DISMISS_KEY = 'rwvca-high-priority-alert-dismissed';

function readDismissed(userId) {
  try {
    const raw = sessionStorage.getItem(`${DISMISS_KEY}:${userId || 'guest'}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDismissed(userId, count) {
  try {
    sessionStorage.setItem(
      `${DISMISS_KEY}:${userId || 'guest'}`,
      JSON.stringify({ count: Number(count || 0), at: Date.now() })
    );
  } catch {
    // ignore storage errors
  }
}

/**
 * Global reminder when the user has High-priority unread notifications.
 * Shown across dashboard pages until they click OK or View.
 */
export function HighPriorityReminderAlert() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { highUnreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const count = Number(highUnreadCount || 0);
  const userId = user?.id;

  const shouldShow = useMemo(() => {
    if (count <= 0) return false;
    if (location.pathname.includes('/dashboard/notifications')) return false;
    const dismissed = readDismissed(userId);
    if (dismissed && Number(dismissed.count) >= count) return false;
    return true;
  }, [count, location.pathname, userId]);

  useEffect(() => {
    setOpen(shouldShow);
  }, [shouldShow, location.pathname]);

  if (!open || count <= 0) return null;

  const label = count === 1
    ? 'You have 1 high priority unread notification.'
    : `You have ${count} high priority unread notifications.`;

  const dismiss = () => {
    writeDismissed(userId, count);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 print:hidden">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="high-priority-alert-title"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl ring-1 ring-red-100"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 id="high-priority-alert-title" className="text-lg font-semibold text-gray-900">
              High priority reminder
            </h3>
            <p className="mt-1 text-sm text-gray-600">{label}</p>
            <p className="mt-1 text-xs text-gray-500">Please review them when you can.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              navigate('/dashboard/notifications?priority=high');
            }}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
