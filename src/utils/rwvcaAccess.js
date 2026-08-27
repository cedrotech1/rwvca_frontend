/**
 * Staff menus and route access copied from PHP dashboard1/includes/sidebar.php.
 * Role keys match the PHP $roleMenus array.
 */

const CREATE_ITEMS = [
  { id: 'create-requisition', label: 'Requisition', path: '/dashboard/create/requisitions' },
  { id: 'create-vehicle', label: 'Vehicle Utilization', path: '/dashboard/create/special-requisitions' },
  { id: 'create-leave', label: 'Leave Request', path: '/dashboard/create/leave-requests' },
  { id: 'create-leave-schedule', label: 'Leave Schedule', path: '/dashboard/create/leave-schedule' },
  { id: 'create-mission', label: 'Mission', path: '/dashboard/create/missions' },
  { id: 'create-document', label: 'Document', path: '/dashboard/create/documents' },
  { id: 'create-report', label: 'Report', path: '/dashboard/create/reports' },
  { id: 'create-membership-report', label: 'Membership Report', path: '/dashboard/create/membership-reports' },
];

const VIEW_ITEMS = [
  { id: 'view-requisitions', label: 'Requisitions', path: '/dashboard/requisitions' },
  { id: 'view-vehicle', label: 'Vehicle Utilization', path: '/dashboard/special-requisitions' },
  { id: 'view-leave', label: 'Leave Requests', path: '/dashboard/leave-requests' },
  { id: 'view-leave-schedule', label: 'Leave Schedule', path: '/dashboard/leave-schedule' },
  { id: 'view-missions', label: 'Missions', path: '/dashboard/missions' },
  { id: 'view-documents', label: 'Documents', path: '/dashboard/documents' },
  { id: 'view-reports', label: 'Reports', path: '/dashboard/reports' },
  { id: 'view-membership-reports', label: 'Membership Reports', path: '/dashboard/membership-reports' },
];

const VIEW_FINANCE_ITEMS = [
  { id: 'view-requisitions', label: 'Requisitions', path: '/dashboard/requisitions' },
  { id: 'view-vehicle', label: 'Vehicle Utilization', path: '/dashboard/special-requisitions' },
  { id: 'view-finance', label: 'Finance Requisitions', path: '/dashboard/finance-requisitions' },
  { id: 'view-leave', label: 'Leave Requests', path: '/dashboard/leave-requests' },
  { id: 'view-leave-schedule', label: 'Leave Schedule', path: '/dashboard/leave-schedule' },
  { id: 'view-missions', label: 'Missions', path: '/dashboard/missions' },
  { id: 'view-documents', label: 'Documents', path: '/dashboard/documents' },
  { id: 'view-reports', label: 'Reports', path: '/dashboard/reports' },
  { id: 'view-membership-reports', label: 'Membership Reports', path: '/dashboard/membership-reports' },
];

const GENERAL_ITEMS = [
  { id: 'tickets', label: 'Open Ticket', path: '/dashboard/tickets' },
  { id: 'todos', label: 'Todos', path: '/dashboard/todos' },
  { id: 'communications', label: 'Communications', path: '/dashboard/communications' },
  { id: 'assets', label: 'Assets', path: '/dashboard/assets' },
  { id: 'notifications', label: 'Notifications', path: '/dashboard/notifications' },
  { id: 'account', label: 'Account', path: '/dashboard/profile' },
  { id: 'attendance', label: 'Attendance', path: '/dashboard/attendance' },
  { id: 'ed-notes-general', label: 'ED Notes', path: '/dashboard/ed-notes' },
];

const ADMIN_SYSTEM_ITEMS = [
  { id: 'website', label: 'Website Settings', path: '/dashboard/website' },
  { id: 'membership-setup', label: 'Membership', path: '/dashboard/membership-setup' },
  { id: 'member-products', label: 'Member Products', path: '/dashboard/member-products' },
  { id: 'programs', label: 'Programs', path: '/dashboard/programs' },
  { id: 'gallery', label: 'Gallery', path: '/dashboard/gallery' },
  { id: 'messages', label: 'Messages', path: '/dashboard/messages' },
  { id: 'about-cms', label: 'About Page', path: '/dashboard/about' },
  { id: 'events', label: 'Events', path: '/dashboard/events' },
  { id: 'users', label: 'Users', path: '/dashboard/users' },
  { id: 'logs', label: 'System Logs', path: '/dashboard/logs' },
];

const LINKS = {
  dashboard: { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  'ed-notes': { id: 'ed-notes', label: 'ED Notes', path: '/dashboard/ed-notes' },
  inventory: { id: 'inventory', label: 'Inventory', path: '/dashboard/inventory' },
  procurement: { id: 'procurement', label: 'Procurement', path: '/dashboard/procurement' },
  permissions: { id: 'permissions', label: 'Permissions', path: '/dashboard/permissions' },
  subscribers: { id: 'subscribers', label: 'Subscriptions', path: '/dashboard/subscribers' },
  settings: { id: 'settings', label: 'Settings', path: '/dashboard/settings' },
  members: { id: 'members', label: 'Members', path: '/dashboard/members' },
  'manage-users': { id: 'manage-users', label: 'User Management', path: '/dashboard/users' },
  logs: { id: 'logs-page', label: 'Logs Page', path: '/dashboard/logs' },
  'ed-full-access': { id: 'ed-full-access', label: 'Full Access', path: '/dashboard/ed-full-access' },
};

const CREATE_GROUP = { id: 'create', label: 'Create', children: CREATE_ITEMS };
const VIEW_GROUP = { id: 'view', label: 'View', children: VIEW_ITEMS };
const VIEW_FINANCE_GROUP = { id: 'view-finance', label: 'View', children: VIEW_FINANCE_ITEMS };
const GENERAL_GROUP = { id: 'general', label: 'General', children: GENERAL_ITEMS };
const ADMIN_SYSTEM_GROUP = { id: 'admin-system', label: 'System Settings', children: ADMIN_SYSTEM_ITEMS };

const ROLE_MENUS = {
  admin: [
    LINKS.dashboard,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.inventory,
    LINKS.procurement,
    ADMIN_SYSTEM_GROUP,
    LINKS.permissions,
    LINKS.subscribers,
    LINKS.settings,
  ],
  HR: [
    LINKS.dashboard,
    LINKS['manage-users'],
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.procurement,
    LINKS.permissions,
  ],
  ED: [
    LINKS.dashboard,
    LINKS['ed-full-access'],
    LINKS['ed-notes'],
    LINKS.logs,
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.members,
    LINKS.inventory,
    LINKS.procurement,
    LINKS.permissions,
  ],
  Chairman: [
    LINKS.dashboard,
    LINKS['ed-full-access'],
    LINKS['ed-notes'],
    LINKS.logs,
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.members,
    LINKS.inventory,
    LINKS.procurement,
    LINKS.permissions,
  ],
  Accountant: [
    LINKS.dashboard,
    LINKS['manage-users'],
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_FINANCE_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  'Assistant to ED': [
    LINKS.dashboard,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_FINANCE_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  'Assistant to the Accountant': [
    LINKS.dashboard,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_FINANCE_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  membership_officer: [
    LINKS.dashboard,
    LINKS.members,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  'Membership R. Supervisor': [
    LINKS.dashboard,
    LINKS.inventory,
    LINKS.members,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  logistic: [
    LINKS.dashboard,
    LINKS.inventory,
    LINKS.members,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  'Membership Coordinator': [
    LINKS.dashboard,
    LINKS.inventory,
    LINKS.members,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.procurement,
    LINKS.permissions,
  ],
  'Project Coordinator': [
    LINKS.dashboard,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.procurement,
    LINKS.permissions,
  ],
  'Procurement Officer': [
    LINKS.dashboard,
    LINKS.procurement,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  member: [
    LINKS.dashboard,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
  default: [
    LINKS.dashboard,
    LINKS['ed-notes'],
    CREATE_GROUP,
    VIEW_GROUP,
    GENERAL_GROUP,
    LINKS.permissions,
  ],
};

const ROLE_ALIASES = {
  admin: 'admin',
  hr: 'HR',
  ed: 'ED',
  chairman: 'Chairman',
  accountant: 'Accountant',
  'assistant to ed': 'Assistant to ED',
  'assistant to the accountant': 'Assistant to the Accountant',
  membership_officer: 'membership_officer',
  'membership officer': 'membership_officer',
  'membership relations officer': 'membership_officer',
  'membership r. supervisor': 'Membership R. Supervisor',
  supervisor: 'Membership R. Supervisor',
  logistic: 'logistic',
  'membership coordinator': 'Membership Coordinator',
  'project coordinator': 'Project Coordinator',
  'procurement officer': 'Procurement Officer',
  procurement: 'Procurement Officer',
  member: 'member',
};

export function canReviewLists(role) {
  const value = String(role || '').trim().toLowerCase();
  return ['hr', 'accountant', 'admin', 'ed', 'chairman'].includes(value);
}

export function canSeeMembershipAnalysis(role) {
  const value = String(role || '').trim().toLowerCase();
  return canReviewLists(role) || canSeeAllMembershipReports(role) || canCreateMembershipReport(role) || value.includes('membership');
}

export function canSeeRequisitionAnalysis(role) {
  return canReviewLists(role) || canSeeFinanceRequisitions(role);
}

export function canSeeMembersAnalysis(role) {
  return canReviewLists(role) || canManageMembers(role);
}

function analysisMenuForRole(role) {
  const items = [
    { id: 'my-analysis', label: 'My Analysis', path: '/dashboard/my-analysis' },
  ];
  if (canReviewLists(role)) {
    items.push(
      { id: 'employee-analysis', label: 'Employee Analysis', path: '/dashboard/employee-analysis' },
      { id: 'leave-analysis', label: 'Leave Analysis', path: '/dashboard/leave-analysis' },
    );
  }
  if (canSeeRequisitionAnalysis(role)) {
    items.push({ id: 'requisition-analysis', label: 'Requisition Analysis', path: '/dashboard/requisition-analysis' });
  }
  if (canSeeMembershipAnalysis(role)) {
    items.push({ id: 'membership-analysis', label: 'Membership Analysis', path: '/dashboard/membership-analysis' });
  }
  if (canSeeMembersAnalysis(role)) {
    items.push({ id: 'members-analysis', label: 'Members Analysis', path: '/dashboard/members-analysis' });
  }
  return { id: 'analysis', label: 'Analysis', children: items };
}

export function resolveRoleKey(role) {
  return ROLE_ALIASES[String(role || '').trim().toLowerCase()] || 'default';
}

export function getMenuForRole(role, user = null) {
  const menu = [...(ROLE_MENUS[resolveRoleKey(role)] || ROLE_MENUS.default)];
  const analysis = analysisMenuForRole(role);
  const dashIndex = menu.findIndex((item) => item.id === 'dashboard');
  menu.splice(dashIndex >= 0 ? dashIndex + 1 : 1, 0, analysis);

  // Ensure named procurement managers always see the menu even if role alias differs
  if (canAccessProcurement(user || { role }) && !menu.some((item) => item.id === 'procurement')) {
    const insertAt = menu.findIndex((item) => item.id === 'inventory');
    menu.splice(insertAt >= 0 ? insertAt + 1 : menu.length, 0, LINKS.procurement);
  }
  return menu;
}

function collectPaths(items, into = []) {
  items.forEach((item) => {
    if (item.path) into.push(item.path);
    if (item.children) collectPaths(item.children, into);
  });
  return into;
}

const ALWAYS_ALLOWED = ['/dashboard', '/dashboard/statistics', '/dashboard/profile', '/dashboard/notifications', '/dashboard/my-analysis'];

export function canSeeAllDocumentsTab(role) {
  return String(role || '').trim().toLowerCase() === 'ed';
}

export function canSeeMenuCounts(role) {
  return String(role || '').trim().toLowerCase() === 'ed';
}

export function canSeeVehicleReceived(role) {
  const value = String(role || '').trim().toLowerCase();
  return ['membership coordinator', 'logistic', 'admin', 'ed', 'chairman'].includes(value);
}

export function canSeeAllTicketsTab(role) {
  const value = String(role || '').trim().toLowerCase();
  return value === 'hr' || value === 'accountant' || value === 'admin';
}

export function canSeeAllMembershipReports(role) {
  const value = String(role || '').trim().toLowerCase();
  return [
    'ed',
    'chairman',
    'admin',
    'accountant',
    'assistant to ed',
    'membership coordinator',
    'logistic',
    'membership r. supervisor',
  ].includes(value);
}

export function isMembershipSupervisor(role) {
  return String(role || '').trim().toLowerCase() === 'membership r. supervisor';
}

export function canCreateMembershipReport(role) {
  const value = String(role || '').trim().toLowerCase();
  return [
    'membership relations officer',
    'membership_officer',
    'membership officer',
    'membership r. supervisor',
  ].includes(value);
}

export function canApproveMembershipReports(role) {
  return String(role || '').trim().toLowerCase() === 'accountant';
}

export function canManageUsers(role) {
  const value = String(role || '').trim().toLowerCase();
  return value === 'hr' || value === 'accountant' || value === 'admin' || value === 'ed' || value === 'chairman';
}

export function canSeeFinanceRequisitions(role) {
  const value = String(role || '').trim().toLowerCase();
  return ['accountant', 'assistant to ed', 'assistant to the accountant'].includes(value);
}

const PROCUREMENT_FULL_ACCESS_EMAILS = [
  'gnyirabahizi@rwvca.org.rw',
  'ebizumuremyi@rwvca.org.rw',
  'mukayisenga@rwvca.org.rw',
];

export function isProcurementOfficer(role) {
  const value = String(role || '').trim().toLowerCase();
  return value === 'procurement officer' || value === 'procurement';
}

export function canAccessProcurement(userOrRole) {
  const user = typeof userOrRole === 'object' && userOrRole ? userOrRole : { role: userOrRole };
  const email = String(user.email || '').trim().toLowerCase();
  if (PROCUREMENT_FULL_ACCESS_EMAILS.includes(email)) return true;
  const value = String(user.role || '').trim().toLowerCase();
  return [
    'procurement officer',
    'procurement',
    'project coordinator',
    'membership coordinator',
    'hr',
    'admin',
    'ed',
    'chairman',
  ].includes(value);
}

export function canManageProcurement(userOrRole) {
  const user = typeof userOrRole === 'object' && userOrRole ? userOrRole : { role: userOrRole };
  const email = String(user.email || '').trim().toLowerCase();
  if (isProcurementOfficer(user.role)) return true;
  if (PROCUREMENT_FULL_ACCESS_EMAILS.includes(email)) return true;
  const value = String(user.role || '').trim().toLowerCase();
  return ['admin', 'ed', 'chairman'].includes(value);
}

export function canManageMembers(role) {
  const value = String(role || '').trim().toLowerCase();
  return [
    'ed',
    'chairman',
    'admin',
    'membership coordinator',
    'membership_officer',
    'membership officer',
    'logistic',
    'membership r. supervisor',
  ].includes(value);
}

export function canAccessPath(role, pathname, user = null) {
  const path = (pathname.replace(/\/$/, '') || '/dashboard').replace(/\/document$/, '');
  if (ALWAYS_ALLOWED.includes(path)) return true;
  if (path.startsWith('/dashboard/procurement') && canAccessProcurement(user || { role })) return true;
  const allowed = collectPaths(getMenuForRole(role, user || { role }));
  if (path.startsWith('/dashboard/ads') || path.startsWith('/dashboard/partners') || path.startsWith('/dashboard/platforms') || path.startsWith('/dashboard/team')) {
    return allowed.includes('/dashboard/website');
  }
  if (path.startsWith('/dashboard/create/')) {
    const viewPath = `/dashboard/${path.replace('/dashboard/create/', '')}`;
    return allowed.includes(path) || allowed.includes(viewPath);
  }
  return allowed.some((allowedPath) => {
    if (allowedPath === '/dashboard') return path === '/dashboard';
    return path === allowedPath || path.startsWith(`${allowedPath}/`);
  });
}
