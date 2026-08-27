import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  DollarSign,
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  ClipboardList,
  Car,
  CalendarDays,
  Plane,
  Ticket,
  CheckSquare,
  MessageSquare,
  Package,
  Warehouse,
  UserCheck,
  Image,
  Megaphone,
  LogOut,
  Bell,
  Settings,
  Home,
  ChevronDown,
  Eye,
  PlusCircle,
  Grid3x3,
  Shield,
  NotebookPen,
  CreditCard,
  ScrollText,
  UserRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { canSeeMenuCounts, getMenuForRole } from '../utils/rwvcaAccess';
import api from '../services/api';

const ICONS = {
  dashboard: <LayoutDashboard size={18} />,
  analysis: <BarChart3 size={18} />,
  'my-analysis': <BarChart3 size={18} />,
  'employee-analysis': <Users size={18} />,
  'leave-analysis': <CalendarDays size={18} />,
  'requisition-analysis': <ClipboardList size={18} />,
  'membership-analysis': <FileText size={18} />,
  'members-analysis': <Users size={18} />,
  overview: <Eye size={18} />,
  statistics: <LayoutDashboard size={18} />,
  'dashboard-group': <LayoutDashboard size={18} />,
  'ed-notes': <NotebookPen size={18} />,
  'ed-notes-general': <NotebookPen size={18} />,
  'ed-full-access': <Shield size={18} />,
  create: <PlusCircle size={18} />,
  view: <ClipboardList size={18} />,
  'view-finance': <DollarSign size={18} />,
  general: <Grid3x3 size={18} />,
  inventory: <Warehouse size={18} />,
  'admin-system': <Settings size={18} />,
  permissions: <ShieldCheck size={18} />,
  subscribers: <CreditCard size={18} />,
  settings: <Settings size={18} />,
  members: <Users size={18} />,
  'manage-users': <Users size={18} />,
  'logs-page': <ScrollText size={18} />,
  tickets: <Ticket size={18} />,
  todos: <CheckSquare size={18} />,
  communications: <MessageSquare size={18} />,
  assets: <Package size={18} />,
  notifications: <Bell size={18} />,
  account: <UserRound size={18} />,
  attendance: <UserCheck size={18} />,
  website: <Megaphone size={18} />,
  'membership-setup': <Users size={18} />,
  'member-products': <Package size={18} />,
  programs: <FileText size={18} />,
  gallery: <Image size={18} />,
  messages: <MessageSquare size={18} />,
  'about-cms': <FileText size={18} />,
  events: <CalendarDays size={18} />,
  users: <Users size={18} />,
  logs: <ScrollText size={18} />,
  'create-requisition': <ClipboardList size={18} />,
  'create-vehicle': <Car size={18} />,
  'create-leave': <CalendarDays size={18} />,
  'create-leave-schedule': <CalendarDays size={18} />,
  'create-mission': <Plane size={18} />,
  'create-document': <FolderOpen size={18} />,
  'create-report': <FileText size={18} />,
  'create-membership-report': <FileText size={18} />,
  'view-requisitions': <ClipboardList size={18} />,
  'view-vehicle': <Car size={18} />,
  'view-leave': <CalendarDays size={18} />,
  'view-leave-schedule': <CalendarDays size={18} />,
  'view-missions': <Plane size={18} />,
  'view-documents': <FolderOpen size={18} />,
  'view-reports': <FileText size={18} />,
  'view-membership-reports': <FileText size={18} />,
};

const SidebarItem = ({ icon, label, active = false, badge, collapsed = false, onClick, indent = false, inDropdown = false }) => (
  <div
    className={`
      flex items-center cursor-pointer transition-colors duration-200 rounded-lg px-4 py-2.5
      ${collapsed ? 'lg:justify-center lg:px-2' : ''}
      ${indent && !collapsed ? 'pl-6' : ''}
      ${active
        ? 'bg-[#2f5d31] text-white shadow-sm'
        : inDropdown
          ? 'text-gray-700 hover:bg-[#2f5d31]/15'
          : 'text-gray-700 hover:bg-[#2f5d31]/8'}
    `}
    onClick={onClick}
    title={collapsed ? label : undefined}
  >
    <div className={`w-5 h-5 relative shrink-0 mr-3 ${collapsed ? 'lg:mr-0' : ''}`}>
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    <span className={`font-medium text-sm leading-snug flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
  </div>
);

function pathActive(pathname, itemPath) {
  if (!itemPath) return false;
  if (itemPath === '/dashboard') return pathname === '/dashboard';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function groupHasActive(pathname, children = []) {
  return children.some((child) => pathActive(pathname, child.path) || groupHasActive(pathname, child.children));
}

const MENU_COUNT_KEYS = {
  'view-requisitions': 'requisitions',
  'view-finance': 'finance_requisitions',
  'view-leave': 'leave_requests',
  'view-leave-schedule': 'leave_schedule',
  'view-missions': 'missions',
  'view-documents': 'documents',
  'view-reports': 'reports',
  'view-membership-reports': 'membership_reports',
  tickets: 'tickets',
  todos: 'todos',
  communications: 'communications',
  permissions: 'permissions',
  assets: 'assets',
  attendance: 'attendance',
  'ed-notes': 'ed_notes_unreplied',
  'ed-notes-general': 'ed_notes_unreplied',
};

export const Sidebar = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const menu = getMenuForRole(user?.role, user);
  const showCounts = canSeeMenuCounts(user?.role);
  const [counts, setCounts] = useState({});
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    menu.forEach((item) => {
      if (item.children && groupHasActive(location.pathname, item.children)) initial[item.id] = true;
    });
    return initial;
  });

  useEffect(() => {
    api.get('/dashboard/overview').then((res) => {
      setCounts(res.data?.counts || {});
    }).catch(() => {});
  }, []);

  const badgeFor = (id) => {
    if (id === 'notifications') return unreadCount;
    if (id === 'ed-notes' || id === 'ed-notes-general') return Number(counts.ed_notes_unreplied || 0);
    if (!showCounts) return 0;
    const key = MENU_COUNT_KEYS[id];
    return key ? Number(counts[key] || 0) : 0;
  };

  const go = (path) => {
    if (path) navigate(path);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className={`px-4 py-4 border-b border-gray-100 ${collapsed ? 'lg:px-2' : ''}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'lg:justify-center' : ''}`}>
          <img src="/rwvca-logo.png" alt="RWVCA" className="h-9 w-auto" />
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="text-sm font-bold text-[#2f5d31] leading-tight">RWVCA</p>
            <p className="text-[11px] text-gray-500">{user?.role || 'Staff dashboard'}</p>
          </div>
        </div>
      </div>
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto px-2 ${collapsed ? 'lg:px-1.5' : ''}`}>
        {menu.map((item) => {
          if (item.children) {
            const open = Boolean(openGroups[item.id]);
            const parentActive = groupHasActive(location.pathname, item.children);
            return (
              <div key={item.id}>
                <button
                  type="button"
                  className={`w-full flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    parentActive
                      ? 'bg-[#2f5d31]/12 text-[#2f5d31]'
                      : open
                        ? 'bg-[#2f5d31]/8 text-[#2f5d31]'
                        : 'text-gray-700 hover:bg-[#2f5d31]/8'
                  } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                >
                  <span className={`w-5 h-5 mr-3 ${collapsed ? 'lg:mr-0' : ''}`}>{ICONS[item.id] || <Grid3x3 size={18} />}</span>
                  <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${collapsed ? 'lg:hidden' : ''}`} />
                </button>
                {open && (
                  <div className={`mb-1 rounded-lg bg-[#2f5d31]/10 py-1 mx-1 ring-1 ring-[#2f5d31]/10 ${collapsed ? 'lg:hidden' : ''}`}>
                    {item.children.map((child) => (
                      <SidebarItem
                        key={child.id}
                        icon={ICONS[child.id] || <FileText size={16} />}
                        label={child.label}
                        active={pathActive(location.pathname, child.path)}
                        badge={badgeFor(child.id)}
                        indent
                        inDropdown
                        onClick={() => go(child.path)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <SidebarItem
              key={item.id}
              icon={ICONS[item.id] || <FileText size={18} />}
              label={item.label}
              active={pathActive(location.pathname, item.path)}
              badge={badgeFor(item.id)}
              collapsed={collapsed}
              onClick={() => go(item.path)}
            />
          );
        })}
        <SidebarItem
          icon={<LogOut size={18} />}
          label="Logout"
          collapsed={collapsed}
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        />
      </nav>
      <div className={`border-t border-gray-100 p-4 ${collapsed ? 'lg:p-2' : ''}`}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`flex items-center text-xs text-gray-500 hover:text-[#2f5d31] ${collapsed ? 'lg:justify-center w-full' : ''}`}
        >
          <Home size={12} className="mr-1" />
          <span className={collapsed ? 'lg:hidden' : ''}>Public website</span>
        </button>
      </div>
    </div>
  );
};
