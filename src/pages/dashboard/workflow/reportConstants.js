export const REPORT_TYPES = [
  { value: 'Weekly', label: 'Weekly Report' },
  { value: 'Monthly', label: 'Monthly Report' },
  { value: 'Travel', label: 'Travel / Field Report' },
  { value: 'Activity', label: 'Activity Report' },
  { value: 'Incident', label: 'Incident Report' },
  { value: 'Other', label: 'Other' },
];

export function reportTypeLabel(value) {
  if (!value) return '—';
  const match = REPORT_TYPES.find((item) => item.value === value);
  if (match) return match.label;
  const legacy = {
    'Weekly Report': 'Weekly Report',
    'Monthly Report': 'Monthly Report',
    'Travel / Field Report': 'Travel / Field Report',
    'Activity Report': 'Activity Report',
    'Incident Report': 'Incident Report',
  };
  return legacy[value] || value;
}
