export const NOTIFICATION_PRIORITIES = [
  { value: 'urgent', label: 'Urgent', hint: 'Immediate attention required' },
  { value: 'high', label: 'High', hint: 'Handle soon' },
  { value: 'middle', label: 'Middle', hint: 'Normal priority' },
  { value: 'low', label: 'Low', hint: 'Informational' },
];

export const NOTIFICATION_PRIORITY_RANK = {
  urgent: 0,
  high: 1,
  middle: 2,
  low: 3,
};

export function normalizeNotificationPriority(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'medium' || key === 'normal') return 'middle';
  if (NOTIFICATION_PRIORITY_RANK[key] != null) return key;
  return 'middle';
}

export function notificationPriorityMeta(value) {
  const priority = normalizeNotificationPriority(value);
  const labels = {
    urgent: { label: 'Urgent', className: 'bg-rose-100 text-rose-800 ring-rose-200', bar: 'border-l-rose-600', row: 'bg-rose-50' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800 ring-orange-200', bar: 'border-l-orange-500', row: 'bg-orange-50/70' },
    middle: { label: 'Middle', className: 'bg-sky-100 text-sky-800 ring-sky-200', bar: 'border-l-sky-500', row: '' },
    low: { label: 'Low', className: 'bg-gray-100 text-gray-700 ring-gray-200', bar: 'border-l-gray-300', row: '' },
  };
  return { priority, ...labels[priority] };
}

export function sortNotificationsByPriority(rows = []) {
  return [...rows].sort((a, b) => {
    const rankA = NOTIFICATION_PRIORITY_RANK[normalizeNotificationPriority(a.priority)] ?? 99;
    const rankB = NOTIFICATION_PRIORITY_RANK[normalizeNotificationPriority(b.priority)] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
  });
}

export function groupNotificationsByPriority(rows = []) {
  const groups = NOTIFICATION_PRIORITIES.map((item) => ({
    ...item,
    items: [],
  }));
  const byValue = Object.fromEntries(groups.map((group) => [group.value, group]));
  sortNotificationsByPriority(rows).forEach((row) => {
    const priority = normalizeNotificationPriority(row.priority);
    (byValue[priority] || byValue.middle).items.push(row);
  });
  return groups.filter((group) => group.items.length > 0);
}
