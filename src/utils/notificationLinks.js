const NEW_SYSTEM_MODULES = [
  'documents',
  'requisitions',
  'special-requisitions',
  'leave-requests',
  'leave-schedule',
  'missions',
  'reports',
  'tickets',
  'todos',
  'communications',
  'permissions',
  'attendance',
  'ed-notes',
  'membership-reports',
  'members',
  'assets',
  'inventory',
  'users',
  'profile',
  'notifications',
  'ed-full-access',
  'finance-requisitions',
  'create',
];

const PHP_PAGE_ROUTES = {
  document_view: '/dashboard/documents',
  document_list: '/dashboard/documents',
  document_create: '/dashboard/create/documents',
  view_requisition: '/dashboard/requisitions',
  requisitions_list: '/dashboard/requisitions',
  requisitions: '/dashboard/requisitions',
  view_special_requisition: '/dashboard/special-requisitions',
  special_requisitions_list: '/dashboard/special-requisitions',
  special_requisitions: '/dashboard/special-requisitions',
  leave_request_details: '/dashboard/leave-requests',
  leave_request_list: '/dashboard/leave-requests',
  leave_request: '/dashboard/create/leave-requests',
  leave_schedule_details: '/dashboard/leave-schedule',
  leave_schedule: '/dashboard/leave-schedule',
  mission_request_details: '/dashboard/missions',
  mission_list: '/dashboard/missions',
  mission: '/dashboard/create/missions',
  'report-list': '/dashboard/reports',
  report_list: '/dashboard/reports',
  report: '/dashboard/reports',
  'report-create': '/dashboard/create/reports',
  'view-report-display': '/dashboard/membership-reports',
  'membership-report-create': '/dashboard/create/membership-reports',
  ticketing: '/dashboard/tickets',
  view_todo: '/dashboard/todos',
  todos: '/dashboard/todos',
  view_communication: '/dashboard/communications',
  communication: '/dashboard/communications',
  create_communication: '/dashboard/create/communications',
  view_permission: '/dashboard/permissions',
  permission: '/dashboard/permissions',
  permissions: '/dashboard/permissions',
  view_attendance: '/dashboard/attendance',
  attendance: '/dashboard/attendance',
  asset_details: '/dashboard/assets',
  asset_form: '/dashboard/assets',
  assets_list: '/dashboard/assets',
  assets: '/dashboard/assets',
  inventory: '/dashboard/inventory',
  'users-profile': '/dashboard/profile',
  users: '/dashboard/profile',
  'member-view': '/dashboard/members',
  'members-management': '/dashboard/members',
  members: '/dashboard/members',
  add_member: '/dashboard/members/new',
  ed_notes: '/dashboard/ed-notes',
  ed_full_access: '/dashboard/ed-full-access',
  overview: '/dashboard',
  index: '/dashboard',
  documents: '/dashboard/documents',
  leave_requests: '/dashboard/leave-requests',
  missions: '/dashboard/missions',
  reports: '/dashboard/reports',
  membership_reports: '/dashboard/membership-reports',
  tickets: '/dashboard/tickets',
  communications: '/dashboard/communications',
};

const PHP_PAGE_ALIASES = {
  'ed_all_access_components/ed_full_access': 'ed_full_access',
};

function pageKey(value) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.php$/i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function firstQueryValue(params, keys) {
  for (const key of keys) {
    const value = params.get(key);
    if (value && /^\d+$/.test(String(value))) return value;
  }
  return null;
}

function parseLinkParts(link) {
  const raw = String(link || '').trim();
  const hashIndex = raw.indexOf('#');
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;

  let pathname = withoutHash;
  let search = '';

  try {
    if (/^https?:\/\//i.test(withoutHash)) {
      const url = new URL(withoutHash);
      pathname = url.pathname;
      search = url.search;
    } else {
      const qIndex = withoutHash.indexOf('?');
      if (qIndex >= 0) {
        pathname = withoutHash.slice(0, qIndex);
        search = withoutHash.slice(qIndex);
      }
    }
  } catch {
    pathname = withoutHash.split('?')[0] || '';
    search = withoutHash.includes('?') ? `?${withoutHash.split('?').slice(1).join('?')}` : '';
  }

  pathname = pathname.replace(/\/{2,}/g, '/');
  if (pathname && !pathname.startsWith('/')) pathname = `/${pathname}`;
  return { pathname, search, hash, params: new URLSearchParams(search.startsWith('?') ? search.slice(1) : search) };
}

function isLegacyPhpNotificationLink(link) {
  const raw = String(link || '');
  if (!raw.trim()) return false;
  return /dashboard1/i.test(raw) || /\.php(\?|#|$)/i.test(raw) || /document_view|view_requisition|leave_request_details|mission_request_details|ticketing\?|view_todo|view_communication|view_attendance|view_permission|asset_details|view-report-display|report-list|ed_full_access|view_special_requisition|leave_schedule_details/i.test(raw);
}

export function isNewSystemNotificationLink(link) {
  if (!link) return false;
  if (isLegacyPhpNotificationLink(link)) return false;
  const { pathname } = parseLinkParts(link);
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const module = pathname.replace(/^\/dashboard\/?/, '').split('/')[0];
    return !module || NEW_SYSTEM_MODULES.includes(module);
  }
  const module = pathname.replace(/^\//, '').split('/')[0];
  return NEW_SYSTEM_MODULES.includes(module);
}

export function resolveLegacyPhpNotificationLink(link) {
  const { pathname, search, hash, params } = parseLinkParts(link);
  const cleaned = pathname.replace(/^\/dashboard1\/?/i, '/').replace(/^\//, '');
  const file = pageKey(cleaned.split('/').pop());
  const nested = pageKey(cleaned);
  const page = PHP_PAGE_ALIASES[nested] || PHP_PAGE_ALIASES[file] || file;
  const base = PHP_PAGE_ROUTES[page] || PHP_PAGE_ROUTES[nested];
  const id = firstQueryValue(params, ['id', 'view', 'comm_id', 'comment_record', 'record_id', 'doc_id', 'ticket_id', 'asset']);
  const extraHash = hash || (params.get('tab') === 'comments' ? '#comments' : '');

  if (page === 'ed_full_access') {
    const tab = params.get('tab');
    const record = firstQueryValue(params, ['comment_record', 'id', 'record_id']);
    const mapped = tab && PHP_PAGE_ROUTES[tab];
    if (mapped && record) return `${mapped}/${record}${extraHash}`;
    const query = new URLSearchParams();
    if (tab) query.set('tab', tab);
    if (record) query.set('comment_record', record);
    const suffix = query.toString();
    return suffix ? `/dashboard/ed-full-access?${suffix}` : '/dashboard/ed-full-access';
  }

  if (page === 'ed_notes') {
    const module = params.get('module');
    const record = firstQueryValue(params, ['record_id', 'id']);
    const mapped = module && (PHP_PAGE_ROUTES[module] || PHP_PAGE_ROUTES[module.replace(/_/g, '-')]);
    if (mapped && record && mapped !== '/dashboard/ed-notes') return `${mapped}/${record}`;
    return '/dashboard/ed-notes';
  }

  if (page === 'asset_details' || page === 'asset_form') {
    return id ? `/dashboard/assets?asset=${id}` : '/dashboard/assets';
  }

  if (page === 'users-profile') return '/dashboard/profile';
  if (page === 'inventory') return '/dashboard/inventory';

  if (base) {
    if (id && !['document_list', 'document_create', 'leave_request_list', 'mission_list', 'members-management'].includes(page)) {
      if (base === '/dashboard/assets') return `/dashboard/assets?asset=${id}`;
      return `${base}/${id}${extraHash}`;
    }
    if (params.get('tab') === 'received' && base === '/dashboard/communications') {
      return '/dashboard/communications?tab=received';
    }
    return `${base}${search || ''}${extraHash}`;
  }

  if (id) {
    const guess = cleaned.split('/').pop();
    const guessedBase = PHP_PAGE_ROUTES[pageKey(guess)];
    if (guessedBase) return `${guessedBase}/${id}${extraHash}`;
  }

  return '/dashboard/notifications';
}

function normalizeNewSystemLink(link) {
  const { pathname, search, hash } = parseLinkParts(link);
  let path = pathname;
  if (!path.startsWith('/dashboard')) {
    path = path.startsWith('/') ? `/dashboard${path}` : `/dashboard/${path}`;
  }
  return `${path}${search || ''}${hash || ''}`;
}

export function resolveNotificationLink(link) {
  if (!link) return '/dashboard/notifications';
  if (isNewSystemNotificationLink(link)) return normalizeNewSystemLink(link);
  if (isLegacyPhpNotificationLink(link)) return resolveLegacyPhpNotificationLink(link);
  return normalizeNewSystemLink(link);
}
