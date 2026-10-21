/**
 * Staff menus and route access driven by privilege_codes from the API.
 * Defaults are seeded in the backend; manage via Roles & Privileges page.
 */

const CREATE_ITEMS = [
  { id: 'create-requisition', label: 'Requisition', path: '/dashboard/create/requisitions', privilege: 'menu.create.requisition' },
  { id: 'create-vehicle', label: 'Vehicle Utilization', path: '/dashboard/create/special-requisitions', privilege: 'menu.create.vehicle' },
  { id: 'create-leave', label: 'Leave Request', path: '/dashboard/create/leave-requests', privilege: 'menu.create.leave' },
  { id: 'create-leave-schedule', label: 'Leave Schedule', path: '/dashboard/create/leave-schedule', privilege: 'menu.create.leave_schedule' },
  { id: 'create-mission', label: 'Mission', path: '/dashboard/create/missions', privilege: 'menu.create.mission' },
  { id: 'create-document', label: 'Document', path: '/dashboard/create/documents', privilege: 'menu.create.document' },
  { id: 'create-report', label: 'Report', path: '/dashboard/create/reports', privilege: 'menu.create.report' },
  { id: 'create-membership-report', label: 'Membership Report', path: '/dashboard/create/membership-reports', privilege: 'menu.create.membership_report' },
  { id: 'create-supply-requisition', label: 'Supply Requisition', path: '/dashboard/create/supply-requisitions', privilege: 'menu.create.supply_requisition' },
];

const VIEW_ITEMS = [
  { id: 'view-requisitions', label: 'Requisitions', path: '/dashboard/requisitions', privilege: 'menu.view.requisitions' },
  { id: 'view-vehicle', label: 'Vehicle Utilization', path: '/dashboard/special-requisitions', privilege: 'menu.view.vehicle' },
  { id: 'view-finance', label: 'Finance Requisitions', path: '/dashboard/finance-requisitions', privilege: 'menu.view.finance_requisitions' },
  { id: 'view-leave', label: 'Leave Requests', path: '/dashboard/leave-requests', privilege: 'menu.view.leave' },
  { id: 'view-leave-schedule', label: 'Leave Schedule', path: '/dashboard/leave-schedule', privilege: 'menu.view.leave_schedule' },
  { id: 'view-missions', label: 'Missions', path: '/dashboard/missions', privilege: 'menu.view.missions' },
  { id: 'view-documents', label: 'Documents', path: '/dashboard/documents', privilege: 'menu.view.documents' },
  { id: 'view-reports', label: 'Reports', path: '/dashboard/reports', privilege: 'menu.view.reports' },
  { id: 'view-membership-reports', label: 'Membership Reports', path: '/dashboard/membership-reports', privilege: 'menu.view.membership_reports' },
  { id: 'view-supply-requisitions', label: 'Supply Requisitions', path: '/dashboard/supply-requisitions', privilege: 'menu.view.supply_requisitions' },
];

const GENERAL_ITEMS = [
  { id: 'tickets', label: 'Open Ticket', path: '/dashboard/tickets', privilege: 'menu.tickets' },
  { id: 'todos', label: 'Todos', path: '/dashboard/todos', privilege: 'menu.todos' },
  { id: 'communications', label: 'Communications', path: '/dashboard/communications', privilege: 'menu.communications' },
  { id: 'assets', label: 'Assets', path: '/dashboard/assets', privilege: 'menu.assets' },
  { id: 'employee-plans', label: 'Employee Plans', path: '/dashboard/employee-plans', privilege: 'menu.employee_plans' },
  { id: 'notifications', label: 'Notifications', path: '/dashboard/notifications', privilege: 'menu.notifications' },
  { id: 'account', label: 'Account', path: '/dashboard/profile', privilege: 'menu.account' },
  { id: 'attendance', label: 'Attendance', path: '/dashboard/attendance', privilege: 'menu.attendance' },
  { id: 'ed-notes-general', label: 'ED Notes', path: '/dashboard/ed-notes', privilege: 'menu.ed_notes' },
];

const ADMIN_SYSTEM_ITEMS = [
  { id: 'website', label: 'Website Settings', path: '/dashboard/website', privilege: 'menu.admin.website' },
  { id: 'membership-setup', label: 'Membership', path: '/dashboard/membership-setup', privilege: 'menu.admin.membership_setup' },
  { id: 'member-products', label: 'Member Products', path: '/dashboard/member-products', privilege: 'menu.admin.member_products' },
  { id: 'programs', label: 'Programs', path: '/dashboard/programs', privilege: 'menu.admin.programs' },
  { id: 'gallery', label: 'Gallery', path: '/dashboard/gallery', privilege: 'menu.admin.gallery' },
  { id: 'messages', label: 'Messages', path: '/dashboard/messages', privilege: 'menu.admin.messages' },
  { id: 'about-cms', label: 'About Page', path: '/dashboard/about', privilege: 'menu.admin.about' },
  { id: 'events', label: 'Events', path: '/dashboard/events', privilege: 'menu.admin.events' },
  { id: 'users', label: 'Users', path: '/dashboard/users', privilege: 'menu.users' },
  { id: 'roles', label: 'Roles & Privileges', path: '/dashboard/roles', privilege: 'menu.roles' },
  { id: 'logs', label: 'System Logs', path: '/dashboard/logs', privilege: 'menu.logs' },
];

const ANALYSIS_ITEMS = [
  { id: 'my-analysis', label: 'My Analysis', path: '/dashboard/my-analysis', privilege: 'menu.analysis.my' },
  { id: 'employee-analysis', label: 'Employee Analysis', path: '/dashboard/employee-analysis', privilege: 'menu.analysis.employee' },
  { id: 'leave-analysis', label: 'Leave Analysis', path: '/dashboard/leave-analysis', privilege: 'menu.analysis.leave' },
  { id: 'requisition-analysis', label: 'Requisition Analysis', path: '/dashboard/requisition-analysis', privilege: 'menu.analysis.requisition' },
  { id: 'membership-analysis', label: 'Membership Analysis', path: '/dashboard/membership-analysis', privilege: 'menu.analysis.membership' },
  { id: 'members-analysis', label: 'Members Analysis', path: '/dashboard/members-analysis', privilege: 'menu.analysis.members' },
  { id: 'staff-monitoring', label: 'Staff Monitoring', path: '/dashboard/staff-monitoring', privilege: 'menu.staff_monitoring' },
];

const TOP_LINKS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', privilege: 'menu.dashboard' },
  { id: 'ed-full-access', label: 'Full Access', path: '/dashboard/ed-full-access', privilege: 'menu.ed_full_access' },
  { id: 'ed-notes', label: 'ED Notes', path: '/dashboard/ed-notes', privilege: 'menu.ed_notes' },
  { id: 'manage-users', label: 'User Management', path: '/dashboard/users', privilege: 'menu.users' },
  { id: 'logs-page', label: 'Logs Page', path: '/dashboard/logs', privilege: 'menu.logs' },
  { id: 'members', label: 'Members', path: '/dashboard/members', privilege: 'menu.members' },
  { id: 'members-dashboard', label: 'Members Dashboard', path: '/dashboard/members-dashboard', privilege: 'menu.members_dashboard' },
  { id: 'inventory', label: 'Inventory', path: '/dashboard/inventory', privilege: 'menu.inventory' },
  { id: 'logistic-dashboard', label: 'Logistic Dashboard', path: '/dashboard/logistic-dashboard', privilege: 'menu.logistic_dashboard' },
  { id: 'procurement', label: 'Procurement', path: '/dashboard/procurement', privilege: 'menu.procurement' },
  { id: 'permissions', label: 'Permissions', path: '/dashboard/permissions', privilege: 'menu.permissions' },
  { id: 'subscribers', label: 'Subscriptions', path: '/dashboard/subscribers', privilege: 'menu.subscribers' },
  { id: 'settings', label: 'Settings', path: '/dashboard/settings', privilege: 'menu.settings' },
];

const PROCUREMENT_FULL_ACCESS_EMAILS = [
  'gnyirabahizi@rwvca.org.rw',
  'ebizumuremyi@rwvca.org.rw',
  'mukayisenga@rwvca.org.rw',
];

export function getEffectiveRoles(roleOrUser) {
  if (roleOrUser && typeof roleOrUser === 'object') {
    if (Array.isArray(roleOrUser.effective_roles) && roleOrUser.effective_roles.length) {
      return [...new Set(roleOrUser.effective_roles.map((r) => String(r || '').trim()).filter(Boolean))];
    }
    const primary = roleOrUser.role;
    const acting = Array.isArray(roleOrUser.acting_roles) ? roleOrUser.acting_roles : [];
    return [...new Set([primary, ...acting].map((r) => String(r || '').trim()).filter(Boolean))];
  }
  const single = String(roleOrUser || '').trim();
  return single ? [single] : [];
}

export function hasPrivilege(userOrCodes, code) {
  const want = String(code || '').trim();
  if (!want) return false;
  if (Array.isArray(userOrCodes)) return userOrCodes.includes(want);
  const list = userOrCodes?.privilege_codes;
  if (Array.isArray(list)) return list.includes(want);
  return false;
}

function privilegeSet(user) {
  if (Array.isArray(user?.privilege_codes)) return new Set(user.privilege_codes);
  return null;
}

function filterByPrivilege(items, privs) {
  if (!privs) return items;
  return items.filter((item) => !item.privilege || privs.has(item.privilege));
}

function stripPrivilegeMeta(item) {
  const { privilege, ...rest } = item;
  if (rest.children) {
    return { ...rest, children: rest.children.map(stripPrivilegeMeta) };
  }
  return rest;
}

export function getMenuForRole(role, user = null) {
  const userObj = user || (role && typeof role === 'object' ? role : { role });
  const privs = privilegeSet(userObj);

  // Without privileges on the session, show a minimal safe menu until /auth/me refreshes.
  if (!privs) {
    return [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { id: 'account', label: 'Account', path: '/dashboard/profile' },
    ];
  }

  const menu = [];
  const dash = TOP_LINKS.find((l) => l.id === 'dashboard');
  if (privs.has(dash.privilege)) menu.push(stripPrivilegeMeta(dash));

  const analysisChildren = filterByPrivilege(ANALYSIS_ITEMS, privs).map(stripPrivilegeMeta);
  if (analysisChildren.length) {
    menu.push({ id: 'analysis', label: 'Analysis', children: analysisChildren });
  }

  for (const link of TOP_LINKS) {
    if (link.id === 'dashboard') continue;
    if (['manage-users', 'logs-page', 'ed-notes'].includes(link.id)) {
      // placed intentionally below / in groups
      continue;
    }
    if (privs.has(link.privilege) && !menu.some((m) => m.id === link.id)) {
      menu.push(stripPrivilegeMeta(link));
    }
  }

  if (privs.has('menu.ed_notes') && !menu.some((m) => m.id === 'ed-notes')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'ed-notes')));
  }
  if (privs.has('menu.users') && !menu.some((m) => m.id === 'manage-users' || m.id === 'users')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'manage-users')));
  }
  // Roles & Privileges stays under System Settings only (not a top-level / post-login page).
  if (privs.has('menu.logs') && !menu.some((m) => m.id === 'logs-page' || m.id === 'logs')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'logs-page')));
  }

  const createChildren = filterByPrivilege(CREATE_ITEMS, privs).map(stripPrivilegeMeta);
  if (createChildren.length) menu.push({ id: 'create', label: 'Create', children: createChildren });

  const viewChildren = filterByPrivilege(VIEW_ITEMS, privs).map(stripPrivilegeMeta);
  if (viewChildren.length) menu.push({ id: 'view', label: 'View', children: viewChildren });

  const generalChildren = filterByPrivilege(GENERAL_ITEMS, privs).map(stripPrivilegeMeta);
  if (generalChildren.length) menu.push({ id: 'general', label: 'General', children: generalChildren });

  if (privs.has('menu.inventory') && !menu.some((m) => m.id === 'inventory')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'inventory')));
  }
  if (privs.has('menu.logistic_dashboard') && !menu.some((m) => m.id === 'logistic-dashboard')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'logistic-dashboard')));
  }
  if (privs.has('menu.procurement') && !menu.some((m) => m.id === 'procurement')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'procurement')));
  }
  if (privs.has('menu.members_dashboard') && !menu.some((m) => m.id === 'members-dashboard')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'members-dashboard')));
  }
  // Supply list also reachable via menu.supply_requisitions when view privilege is absent
  if (
    privs.has('menu.supply_requisitions')
    && !menu.some((m) => m.id === 'view-supply-requisitions' || m.id === 'supply-requisitions')
    && !viewChildren.some((m) => m.id === 'view-supply-requisitions')
  ) {
    const viewGroup = menu.find((m) => m.id === 'view');
    const supplyItem = { id: 'view-supply-requisitions', label: 'Supply Requisitions', path: '/dashboard/supply-requisitions' };
    if (viewGroup) viewGroup.children = [...(viewGroup.children || []), supplyItem];
    else menu.push({ id: 'view', label: 'View', children: [supplyItem] });
  }

  const adminChildren = filterByPrivilege(ADMIN_SYSTEM_ITEMS, privs).map(stripPrivilegeMeta);
  if (adminChildren.length) {
    menu.push({ id: 'admin-system', label: 'System Settings', children: adminChildren });
  }

  if (privs.has('menu.permissions') && !menu.some((m) => m.id === 'permissions')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'permissions')));
  }
  if (privs.has('menu.subscribers') && !menu.some((m) => m.id === 'subscribers')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'subscribers')));
  }
  if (privs.has('menu.settings') && !menu.some((m) => m.id === 'settings')) {
    menu.push(stripPrivilegeMeta(TOP_LINKS.find((l) => l.id === 'settings')));
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

export function canReviewLists(user) {
  return hasPrivilege(user, 'workflow.review');
}

export function canSeeMembershipAnalysis(user) {
  return hasPrivilege(user, 'analysis.membership') || hasPrivilege(user, 'menu.analysis.membership');
}

export function canSeeRequisitionAnalysis(user) {
  return hasPrivilege(user, 'analysis.requisition') || hasPrivilege(user, 'menu.analysis.requisition');
}

export function canSeeMembersAnalysis(user) {
  return hasPrivilege(user, 'analysis.members') || hasPrivilege(user, 'menu.analysis.members');
}

export function resolveRoleKey(role) {
  return String(role || '').trim() || 'default';
}

export function canSeeAllDocumentsTab(user) {
  return hasPrivilege(user, 'documents.view_all');
}

export function canSeeMenuCounts(user) {
  return hasPrivilege(user, 'dashboard.menu_counts');
}

export function canSeeVehicleReceived(user) {
  return hasPrivilege(user, 'vehicle.received.view');
}

export function canSeeAllTicketsTab(user) {
  return hasPrivilege(user, 'tickets.view_all');
}

export function canSeeAllMembershipReports(user) {
  return hasPrivilege(user, 'membership.reports.view_all');
}

export function isMembershipSupervisor(user) {
  return getEffectiveRoles(user).some((r) => String(r).toLowerCase() === 'membership r. supervisor');
}

export function canCreateMembershipReport(user) {
  return hasPrivilege(user, 'membership.reports.create') || hasPrivilege(user, 'menu.create.membership_report');
}

export function canApproveMembershipReports(user) {
  return hasPrivilege(user, 'membership.reports.approve');
}

export function canManageUsers(user) {
  return hasPrivilege(user, 'users.manage');
}

export function canManageRoles(user) {
  return hasPrivilege(user, 'roles.manage');
}

export function canSeeFinanceRequisitions(user) {
  return hasPrivilege(user, 'finance.requisitions.view') || hasPrivilege(user, 'menu.view.finance_requisitions');
}

export function canEditRequisitionAccountFields(user) {
  return hasPrivilege(user, 'finance.requisitions.account_fields');
}

export function isProcurementOfficer(user) {
  return hasPrivilege(user, 'procurement.manage');
}

export function canAccessProcurement(userOrRole) {
  const user = typeof userOrRole === 'object' && userOrRole ? userOrRole : { role: userOrRole };
  const email = String(user.email || '').trim().toLowerCase();
  if (PROCUREMENT_FULL_ACCESS_EMAILS.includes(email)) return true;
  return hasPrivilege(user, 'procurement.access') || hasPrivilege(user, 'menu.procurement');
}

export function canManageProcurement(userOrRole) {
  const user = typeof userOrRole === 'object' && userOrRole ? userOrRole : { role: userOrRole };
  const email = String(user.email || '').trim().toLowerCase();
  if (PROCUREMENT_FULL_ACCESS_EMAILS.includes(email)) return true;
  return hasPrivilege(user, 'procurement.manage');
}

export function canManageMembers(user) {
  return hasPrivilege(user, 'members.manage');
}

export function canManageAssets(user) {
  return hasPrivilege(user, 'assets.manage');
}

export function canManageInventory(user) {
  return hasPrivilege(user, 'inventory.manage');
}

export function canManageSupply(user) {
  return hasPrivilege(user, 'supply.manage');
}

export function canAuthorizeSupply(user) {
  return hasPrivilege(user, 'supply.authorize');
}

export function canMonitorPlans(user) {
  return hasPrivilege(user, 'plans.monitor') || hasPrivilege(user, 'menu.staff_monitoring');
}

export function canManagePlans(user) {
  return hasPrivilege(user, 'plans.manage') || hasPrivilege(user, 'menu.employee_plans');
}

export function canAccessLogisticDashboard(user) {
  return hasPrivilege(user, 'logistic.dashboard') || hasPrivilege(user, 'menu.logistic_dashboard');
}

export function canAccessMembersDashboard(user) {
  return hasPrivilege(user, 'members.dashboard') || hasPrivilege(user, 'menu.members_dashboard');
}

export function canAccessPath(role, pathname, user = null) {
  const path = (pathname.replace(/\/$/, '') || '/dashboard').replace(/\/document$/, '');
  const userObj = user || (role && typeof role === 'object' ? role : { role });
  if (ALWAYS_ALLOWED.includes(path)) return true;
  if (path.startsWith('/dashboard/roles') && canManageRoles(userObj)) return true;
  if (path.startsWith('/dashboard/procurement') && canAccessProcurement(userObj)) return true;
  const allowed = collectPaths(getMenuForRole(userObj.role || role, userObj));
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
