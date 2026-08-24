import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Phone, User, Warehouse, Users, Car, FileText, CalendarDays, CalendarCheck,
  Plane, FolderOpen, ClipboardList, MessageSquare, Shield, Clock, CheckSquare,
  Mail as MailIcon, Package,
} from 'lucide-react';
import { DataTable, StatusBadge, inputClass } from '../../../components/ui/dataUi';
import { formatPhpDateTime } from '../workflow/helpers';
import { LeaveBalanceSummary } from '../workflow/leaveShared';

const MODULE_ICONS = {
  inventory: Warehouse,
  members: Users,
  vehicle_utilization: Car,
  membership_reports: FileText,
  requisitions: ClipboardList,
  finance_requisitions: ClipboardList,
  leave_requests: CalendarDays,
  leave_schedule: CalendarCheck,
  missions: Plane,
  documents: FolderOpen,
  staff_reports: FileText,
  tickets: MessageSquare,
  tickets_created: MessageSquare,
  tickets_assigned: MessageSquare,
  assets: Package,
  todos: CheckSquare,
  communications: MailIcon,
  permissions: Shield,
  attendance: Clock,
  users: Users,
  logs: FileText,
};

export function StatCard({ label, value, className = 'bg-[#2f5d31]' }) {
  return (
    <div className={`rounded-xl px-4 py-4 text-white shadow-sm ${className}`}>
      <p className="text-2xl font-semibold">{value ?? 0}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">{label}</p>
    </div>
  );
}

export function ChartCard({ title, children, action }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Donut({ items }) {
  const list = items || [];
  const total = list.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const colors = ['#2f5d31', '#0f766e', '#c2410c', '#7c3aed', '#e11d48', '#ca8a04'];
  let offset = 0;
  if (!list.length) return <p className="text-sm text-gray-400">No data yet</p>;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
        <circle r="15.915" cx="18" cy="18" fill="transparent" stroke="#e5e7eb" strokeWidth="3" />
        {list.map((item, index) => {
          const pct = Number(item.value || 0) / total;
          const dash = `${pct * 100} ${100 - pct * 100}`;
          const circle = (
            <circle key={item.label} r="15.915" cx="18" cy="18" fill="transparent" stroke={colors[index % colors.length]} strokeWidth="3" strokeDasharray={dash} strokeDashoffset={-offset * 100} />
          );
          offset += pct;
          return circle;
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {list.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
            {item.label}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBar({ items, suffix = '' }) {
  const list = items || [];
  const max = Math.max(1, ...list.map((item) => Number(item.value || 0)));
  if (!list.length) return <p className="text-sm text-gray-400">No data yet</p>;
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {list.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span className="truncate pr-2">{item.label}</span>
            <span>{item.value}{suffix}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#2f5d31]" style={{ width: `${Math.min(100, (Number(item.value || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function YearFilter({ year, onChange, extra }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-gray-600">
        Year
        <select className={`mt-1 ${inputClass}`} value={year} onChange={(e) => onChange(Number(e.target.value))}>
          {[year - 1, year, year + 1].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      {extra}
    </div>
  );
}

function rowLabel(row) {
  return row.title || row.destination || row.leave_type || row.name || row.subject || row.report_type || row.action || row.description || 'Record';
}

function rowStatus(row) {
  if (row.is_completed != null) return Number(row.is_completed) === 1 ? 'completed' : 'open';
  if (row.status) return row.status;
  if (row.mission_requests_status) return row.mission_requests_status;
  if (row.leave_requests_status) return row.leave_requests_status;
  if (row.communication_type) return row.communication_type;
  if (row.action) return row.action;
  return null;
}

export function ModuleRecentTable({ module, onOpen }) {
  const rows = module.recent || [];
  const canOpen = Boolean(module.openTo) && module.key !== 'logs' && module.key !== 'assets' && module.key !== 'attendance';
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{module.label}</h3>
          <p className="text-xs text-gray-500">
            {module.total ?? 0} total
            {module.approved != null ? ` · ${module.approved || 0} approved · ${module.pending || 0} pending` : ''}
          </p>
        </div>
        {module.path && (
          <Link to={module.path} className="text-xs font-medium text-[#2f5d31]">Open module</Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Summary</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length ? rows.map((row, idx) => (
              <tr
                key={row.id}
                className={canOpen ? 'cursor-pointer hover:bg-sky-50' : ''}
                onClick={() => canOpen && onOpen(`${module.openTo}/${row.id}`)}
              >
                <td className="py-2 pr-3">{idx + 1}</td>
                <td className="py-2 pr-3 truncate max-w-[220px]">{rowLabel(row)}</td>
                <td className="py-2 pr-3"><StatusBadge value={rowStatus(row)} /></td>
                <td className="py-2 pr-3">{formatPhpDateTime(row.created_at || row.leave_from || row.departure_date)}</td>
              </tr>
            )) : (
              <tr><td className="py-6 text-gray-400" colSpan={4}>No records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmployeeProfileView({ data, year, onYearChange }) {
  const navigate = useNavigate();
  const employee = data?.employee || {};
  const modules = data?.modules || [];
  const links = data?.links || {};

  const scrollTo = (key) => {
    const el = document.getElementById(`module-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2f5d31]/10 text-[#2f5d31]">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{employee.names}</h2>
              <p className="text-sm text-gray-500">{employee.role} · {employee.department?.name || 'No department'}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1"><Mail size={14} />{employee.email || '—'}</span>
                {employee.phone && <span className="inline-flex items-center gap-1"><Phone size={14} />{employee.phone}</span>}
                {employee.gender && <span>Gender: {employee.gender}</span>}
                <span>Status: {Number(employee.active) === 1 ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <YearFilter year={year} onChange={onYearChange} />
            <div className="rounded-lg bg-sky-50 px-4 py-2 text-center">
              <p className="text-xs text-gray-500">Total activity</p>
              <p className="text-xl font-bold text-[#2f5d31]">{data?.activity?.total ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {data?.leave?.balance && (
        <LeaveBalanceSummary balance={data.leave.balance} userName={employee.names} />
      )}

      {data?.leave?.profile && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Days left" value={data.leave.profile.days_left} className="bg-emerald-600" />
          <StatCard label="Leave used %" value={`${data.leave.profile.utilization_pct}%`} className="bg-sky-700" />
          <StatCard label="Leave requests" value={data.leave.profile.requests_count} />
          <StatCard label="Missing schedule" value={data.leave.profile.missing_schedule_count} className="bg-rose-600" />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map((module) => {
          const Icon = MODULE_ICONS[module.key] || FileText;
          return (
            <button
              key={module.key}
              type="button"
              className="group flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm transition hover:shadow-md text-left"
              onClick={() => scrollTo(module.key)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2f5d31]/10">
                <Icon className="h-5 w-5 text-[#2f5d31]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{module.label}</p>
                {(module.pending != null || module.approved != null) && (
                  <p className="text-[11px] text-gray-400">{module.approved || 0} approved · {module.pending || 0} pending</p>
                )}
              </div>
              <span className="text-2xl font-bold text-[#2f5d31]">{module.total ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
        <h3 className="mb-3 text-sm font-semibold text-sky-900">Jump to records</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(links).map(([key, moduleKey]) => (
            <button
              key={key}
              type="button"
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium capitalize text-[#2f5d31] ring-1 ring-gray-100"
              onClick={() => scrollTo(moduleKey)}
            >
              {key.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">All related records</h2>
          <p className="text-xs text-gray-500">Same layout as the dashboard — click a row to open the record.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {modules.map((module) => (
            <div key={module.key} id={`module-${module.key}`}>
              <ModuleRecentTable module={module} onOpen={(path) => navigate(path)} />
            </div>
          ))}
        </div>
      </section>

      {(data?.leave_allowance_years || []).length > 0 && (
        <ChartCard title="Leave allowance years">
          <ul className="space-y-2 text-sm">
            {data.leave_allowance_years.map((row) => (
              <li key={row.id} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span>{row.year}</span>
                <span className="font-medium">{row.allowed_days} days</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}
    </div>
  );
}

export function AnalysisAccessDenied({ label }) {
  return (
    <div className="rounded-xl bg-white p-6 text-sm text-gray-600 ring-1 ring-gray-100">
      {label} is not available for your role.
    </div>
  );
}

export { DataTable, StatusBadge, inputClass };
