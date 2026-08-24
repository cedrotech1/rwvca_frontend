export const ROLE_LABELS = {
  admin: 'Admin',
  head_quarter: 'Head Quarter',
  dvc: 'DVC',
  warefare: 'Student Director Welfare',
  wadden: 'Hostel Warden',
  it: 'IT',
};

export const formatUserRole = (role) =>
  ROLE_LABELS[role] || (role ? String(role).replace(/_/g, ' ') : 'Unknown');

export const getRoleLabel = formatUserRole;
