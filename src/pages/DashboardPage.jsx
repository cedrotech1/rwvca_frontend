import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse, Users, Car, FileText, CalendarDays, CalendarCheck, Plane,
  FolderOpen, ClipboardList, MessageSquare, Shield, Clock, CheckSquare,
  Mail, Package,
} from 'lucide-react';
import { DashboardWelcome } from '../components/DashboardWelcome';
import { StatusBadge, inputClass } from '../components/ui/dataUi';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { canReviewLists } from '../utils/rwvcaAccess';
import { formatPhpDateTime } from './dashboard/workflow/helpers';

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DashboardPage = () => {
  const { user } = useAuth();
  const isHr = canReviewLists(user?.role);
  const now = new Date();
  const [period, setPeriod] = useState('all');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [leaveInsights, setLeaveInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/overview', {
        period,
        year,
        month: period === 'month' ? month : undefined,
        date_from: period === 'custom' ? dateFrom : undefined,
        date_to: period === 'custom' ? dateTo : undefined,
      });
      setData(res.data ?? null);
      setError('');
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || err.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [period, year, month, dateFrom, dateTo]);

  useEffect(() => {
    if (!isHr) return;
    api.get('/leave-requests/analytics', { year: now.getFullYear(), limit: 200 })
      .then((res) => setLeaveInsights(res.data || null))
      .catch(() => setLeaveInsights(null));
  }, [isHr]);

  const profile = data?.profile || {};
  const managedCards = data?.cards?.managed || [];
  const mineCards = data?.cards?.mine || [];
  const recents = data?.recents || {};

  return (
    <div className="space-y-6">
      <DashboardWelcome
        userName={user?.names || 'User'}
        subtitle={profile.subtitle}
        roleLabel={profile.label || user?.role || 'My work'}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all" className="text-gray-900">All time</option>
              <option value="week" className="text-gray-900">This week</option>
              <option value="month" className="text-gray-900">This month</option>
              <option value="year" className="text-gray-900">This year</option>
              <option value="custom" className="text-gray-900">Custom</option>
            </select>
            {(period === 'year' || period === 'month') && (
              <select className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {YEARS.map((item) => <option key={item} value={item} className="text-gray-900">{item}</option>)}
              </select>
            )}
            {period === 'month' && (
              <select className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((name, index) => <option key={name} value={index + 1} className="text-gray-900">{name}</option>)}
              </select>
            )}
            {period === 'custom' && (
              <>
                <input type="date" className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <input type="date" className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </>
            )}
          </div>
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && !data ? (
        <DashboardSkeleton />
      ) : (
        <>
      {managedCards.length > 0 && (
        <Section title={profile.sees_all ? 'Modules I manage' : 'What I manage'} hint="Organization records for the modules assigned to your role">
          <CardGrid cards={managedCards} />
        </Section>
      )}

      <Section title="My modules" hint="Your own records in every module you use">
        <CardGrid cards={mineCards} />
      </Section>

      <div className="grid lg:grid-cols-3 gap-4">
        {data?.charts?.show_gender && (
          <ChartCard title="Staff gender">
            <DonutChart items={data.charts.gender} />
          </ChartCard>
        )}
        {data?.charts?.show_departments && data?.charts?.departments?.length > 0 && (
          <ChartCard title="Top departments">
            <HBarChart items={data.charts.departments} />
          </ChartCard>
        )}
        <ChartCard title="Request status">
          <HBarChart items={(data?.charts?.status || []).filter((item) => Number(item.value) > 0)} />
        </ChartCard>
      </div>

      <ChartCard title="Monthly trends (last 6 months)">
        <TrendChart
          series={[
            { label: 'Missions', color: '#2f5d31', points: data?.charts?.trends?.missions || [] },
            { label: 'Leave', color: '#0f766e', points: data?.charts?.trends?.leave || [] },
            { label: profile.finance && !profile.sees_all ? 'Finance requisitions' : 'Requisitions', color: '#c2410c', points: data?.charts?.trends?.requisitions || [] },
          ]}
        />
      </ChartCard>

      {isHr && leaveInsights?.summary && (
        <Section title="Leave management insights" hint="Real-time employee leave balances, utilization, and schedule compliance">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            {[
              ['Employees tracked', leaveInsights.summary.employees, 'bg-[#2f5d31]'],
              ['On leave today', leaveInsights.summary.on_leave_now, 'bg-sky-700'],
              ['Total days available', leaveInsights.summary.total_days_available, 'bg-emerald-600'],
              ['Unscheduled requests', leaveInsights.summary.unscheduled_requests, 'bg-rose-600'],
            ].map(([label, value, cls]) => (
              <div key={label} className={`rounded-xl px-4 py-4 text-white shadow-sm ${cls}`}>
                <p className="text-2xl font-semibold">{value ?? 0}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Leave utilization (top staff)">
              <HBarChart
                items={(leaveInsights.utilization || []).slice(0, 8).map((item) => ({
                  label: `${item.label} · ${item.days_left ?? 0}d left`,
                  value: item.value,
                }))}
              />
            </ChartCard>
            <ChartCard title="Requests by status">
              <DonutChart items={leaveInsights.by_status || []} />
            </ChartCard>
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Leave insights</h3>
                <Link to="/dashboard/leave-analysis" className="text-xs font-medium text-[#2f5d31]">Full analysis</Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(leaveInsights.insights || []).map((item) => (
                  <div key={item.key} className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
                <strong>Leave Schedule Restriction:</strong> employees must pre-schedule leave dates before submitting a leave request.
              </p>
            </div>
          </div>
        </Section>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <RecentTable
          title={profile.sees_all ? 'Recent missions' : 'My recent missions'}
          to="/dashboard/missions"
          rows={recents.missions || []}
          columns={[
            { key: 'id', label: '#', render: (row, idx) => idx + 1 },
            { key: 'destination', label: 'Destination' },
            { key: 'mission_requests_status', label: 'Status', badge: true },
            { key: 'created_at', label: 'Date', date: true },
          ]}
        />
        <RecentTable
          title={profile.finance && !profile.sees_all ? 'Finance requisitions' : (profile.sees_all ? 'Recent requisitions' : 'My recent requisitions')}
          to={profile.finance && !profile.sees_all ? '/dashboard/finance-requisitions' : '/dashboard/requisitions'}
          rows={recents.requisitions || []}
          columns={[
            { key: 'id', label: '#', render: (row, idx) => idx + 1 },
            { key: profile.finance && !profile.sees_all ? 'finance_status' : 'status', label: 'Status', badge: true },
            { key: 'total_amount_requested', label: 'Amount' },
            { key: 'created_at', label: 'Date', date: true },
          ]}
        />
        <RecentTable
          title={profile.sees_all ? 'Recent leave requests' : 'My recent leave'}
          to="/dashboard/leave-requests"
          rows={recents.leave_requests || []}
          columns={[
            { key: 'id', label: '#', render: (row, idx) => idx + 1 },
            { key: 'leave_type', label: 'Type' },
            { key: 'leave_requests_status', label: 'Status', badge: true },
            { key: 'created_at', label: 'Date', date: true },
          ]}
        />
        <RecentTable
          title="Recent assets"
          to="/dashboard/assets"
          rows={recents.assets || []}
          columns={[
            { key: 'id', label: '#', render: (row, idx) => idx + 1 },
            { key: 'name', label: 'Asset' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'created_at', label: 'Date', date: true },
          ]}
        />
        {(profile.manage || []).includes('membership_reports') && (
          <RecentTable
            title="Membership reports"
            to="/dashboard/membership-reports"
            rows={recents.membership_reports || []}
            columns={[
              { key: 'id', label: '#', render: (row, idx) => idx + 1 },
              { key: 'report_type', label: 'Type' },
              { key: 'status', label: 'Status', badge: true },
              { key: 'created_at', label: 'Date', date: true },
            ]}
          />
        )}
        {(profile.manage || []).includes('vehicle_utilization') && (
          <RecentTable
            title="Vehicle utilization"
            to="/dashboard/special-requisitions"
            rows={recents.vehicle_utilization || []}
            columns={[
              { key: 'id', label: '#', render: (row, idx) => idx + 1 },
              { key: 'title', label: 'Title' },
              { key: 'status', label: 'Status', badge: true },
              { key: 'created_at', label: 'Date', date: true },
            ]}
          />
        )}
        {(profile.manage || []).includes('members') && (
          <RecentTable
            title="Recent members"
            to="/dashboard/members"
            rows={recents.members || []}
            columns={[
              { key: 'id', label: '#', render: (row, idx) => idx + 1 },
              { key: 'company_name', label: 'Company' },
              { key: 'owner_name', label: 'Owner' },
              { key: 'membership_status', label: 'Status' },
            ]}
          />
        )}
        {(profile.manage || []).includes('inventory') && (
          <RecentTable
            title="Inventory"
            to="/dashboard/inventory"
            rows={recents.inventory || []}
            columns={[
              { key: 'id', label: '#', render: (row, idx) => idx + 1 },
              { key: 'name', label: 'Item' },
              { key: 'category', label: 'Category' },
              { key: 'current_quantity', label: 'Stock' },
            ]}
          />
        )}
      </div>

      {data?.cms && (
        <Section title="Website" hint="Public site content">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ['events', 'Events', '/dashboard/events'],
              ['programs', 'Programs', '/dashboard/programs'],
              ['gallery', 'Gallery', '/dashboard/gallery'],
              ['ads', 'Ads', '/dashboard/ads'],
              ['partners', 'Partners', '/dashboard/partners'],
              ['platforms', 'Platforms', '/dashboard/platforms'],
              ['contact_messages', 'Unread messages', '/dashboard/messages'],
              ['subscribers', 'Subscribers', '/dashboard/subscribers'],
            ].map(([key, label, path]) => (
              <Link key={key} to={path} className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-100 hover:ring-[#2f5d31]/40">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-[#2f5d31] mt-1">{data.cms[key] ?? 0}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}
        </>
      )}
    </div>
  );
};

function Section({ title, hint, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-[#2f5d31] to-[#6b4423]" />
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
          {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const CARD_ICONS = {
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
  assets: Package,
  todos: CheckSquare,
  communications: Mail,
  permissions: Shield,
  attendance: Clock,
  users: Users,
};

function formatCardStatuses(item) {
  if (item.statuses && typeof item.statuses === 'object') {
    const line = Object.entries(item.statuses)
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([status, count]) => `${count} ${String(status).replace(/_/g, ' ')}`)
      .join(' · ');
    if (line) return line;
  }
  if (item.pending == null && item.approved == null && item.rejected == null) return null;
  const parts = [];
  if (item.approved != null) parts.push(`${item.approved || 0} approved`);
  if (item.pending != null) parts.push(`${item.pending || 0} pending`);
  if (item.rejected != null && Number(item.rejected) > 0) parts.push(`${item.rejected} rejected`);
  return parts.join(' · ') || null;
}

function CardGrid({ cards }) {
  if (!cards.length) return <p className="text-sm text-gray-400">No modules in this period</p>;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((item) => {
        const Icon = CARD_ICONS[item.key] || FileText;
        const statusLine = formatCardStatuses(item);
        return (
          <Link
            key={item.key}
            to={item.path}
            className="group flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2f5d31]/10">
              <Icon className="h-5 w-5 text-[#2f5d31]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
              {statusLine && (
                <p className="text-[11px] text-gray-400 leading-snug break-words">{statusLine}</p>
              )}
              {item.key === 'users' && item.male != null && (
                <p className="text-[11px] text-gray-400">{item.male}m · {item.female}f · {item.active} active</p>
              )}
            </div>
            <span className="text-2xl font-bold text-[#2f5d31]">{item.total ?? 0}</span>
          </Link>
        );
      })}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const colors = ['#2f5d31', '#0f766e', '#c2410c', '#7c3aed'];
  let offset = 0;
  const circles = items.map((item, index) => {
    const value = Number(item.value || 0);
    const pct = value / total;
    const dash = `${pct * 100} ${100 - pct * 100}`;
    const circle = (
      <circle key={item.label} r="15.915" cx="18" cy="18" fill="transparent" stroke={colors[index % colors.length]} strokeWidth="3" strokeDasharray={dash} strokeDashoffset={-offset * 100} />
    );
    offset += pct;
    return circle;
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
        <circle r="15.915" cx="18" cy="18" fill="transparent" stroke="#e5e7eb" strokeWidth="3" />
        {circles}
      </svg>
      <ul className="text-sm space-y-1">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
            {item.label}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HBarChart({ items }) {
  const max = Math.max(1, ...items.map((item) => Number(item.value || 0)));
  if (!items.length) return <p className="text-sm text-gray-400">No data in this period</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-[#2f5d31]" style={{ width: `${(Number(item.value || 0) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ series }) {
  const labels = useMemo(() => {
    const keys = new Set();
    series.forEach((item) => item.points.forEach((point) => keys.add(String(point.month).slice(0, 7))));
    return [...keys].sort();
  }, [series]);
  if (!labels.length) return <p className="text-sm text-gray-400">No trend data yet</p>;
  const max = Math.max(1, ...series.flatMap((item) => item.points.map((point) => Number(point.count || 0))));
  const width = 640;
  const height = 180;
  const pad = 24;
  const x = (index) => pad + (index * (width - pad * 2)) / Math.max(1, labels.length - 1);
  const y = (value) => height - pad - (Number(value) / max) * (height - pad * 2);
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {series.map((item) => {
          const points = labels.map((label, index) => {
            const found = item.points.find((point) => String(point.month).slice(0, 7) === label);
            return `${x(index)},${y(found?.count || 0)}`;
          }).join(' ');
          return <polyline key={item.label} fill="none" stroke={item.color} strokeWidth="2.5" points={points} />;
        })}
      </svg>
      <div className="flex gap-4 text-xs text-gray-500">
        {series.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecentTable({ title, to, rows, columns }) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link to={to} className="text-xs font-medium text-[#2f5d31]">View all</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
              {columns.map((col) => <th key={col.key} className="py-2 pr-3">{col.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length ? rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key} className="py-2 pr-3">
                    {col.key === 'id' ? rowIdx + 1 : col.badge ? <StatusBadge value={row[col.key]} /> : col.date ? formatPhpDateTime(row[col.key]) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td className="py-6 text-gray-400" colSpan={columns.length}>No recent records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardPage;
