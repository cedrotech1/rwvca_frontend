import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Search } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canReviewLists } from '../../../utils/rwvcaAccess';
import { formatPhpDate } from '../workflow/helpers';
import { LeaveBalanceSummary } from '../workflow/leaveShared';
import { useStaffOptions } from '../workflow/helpers';

function HBar({ label, value, max, suffix = '' }) {
  const pct = max ? (Number(value) / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span className="truncate pr-2">{label}</span>
        <span>{value}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#2f5d31]" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function Donut({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const colors = ['#2f5d31', '#0f766e', '#c2410c', '#7c3aed', '#e11d48', '#ca8a04'];
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
        <circle r="15.915" cx="18" cy="18" fill="transparent" stroke="#e5e7eb" strokeWidth="3" />
        {items.map((item, index) => {
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

export default function LeaveAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments } = useStaffOptions();
  const isHr = canReviewLists(user?.role);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!isHr) return;
    setLoading(true);
    try {
      const res = await api.get('/leave-requests/analytics', {
        year,
        search,
        department_id: departmentId || undefined,
        limit: 300,
      });
      setData(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load leave analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHr) return;
    load().catch(() => {});
  }, [year, isHr]);

  const selected = useMemo(
    () => (data?.employees || []).find((row) => Number(row.user_id) === Number(selectedId)) || null,
    [data, selectedId],
  );

  if (!isHr) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-gray-600 ring-1 ring-gray-100">
        Leave analysis is available to HR and administrators only.
      </div>
    );
  }

  const summary = data?.summary || {};
  const employees = data?.employees || [];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Leave Analysis & Insights"
        subtitle="Analyze leave patterns and utilization"
        icon={<CalendarDays className="h-6 w-6" />}
        showBack
        backTo="/dashboard/leave-requests"
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm text-gray-600">
            Search employee
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, role..." />
            </div>
          </label>
          <label className="text-sm text-gray-600">
            Year
            <select className={`mt-1 ${inputClass}`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Department
            <select className={`mt-1 ${inputClass}`} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">
            {loading ? 'Loading...' : 'Apply filters'}
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Employees', summary.employees, 'bg-[#2f5d31]'],
              ['On leave today', summary.on_leave_now, 'bg-sky-700'],
              ['Days available (org)', summary.total_days_available, 'bg-emerald-600'],
              ['Unscheduled requests', summary.unscheduled_requests, 'bg-rose-600'],
            ].map(([label, value, cls]) => (
              <div key={label} className={`rounded-xl px-4 py-4 text-white ${cls}`}>
                <p className="text-2xl font-semibold">{value ?? 0}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/80">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Requests by status</h3>
              <Donut items={data.by_status || []} />
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Requests by type</h3>
              <Donut items={data.by_type || []} />
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Leave utilization (top staff)</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {(data.utilization || []).map((item) => (
                  <HBar key={item.label} label={item.label} value={item.value} max={100} suffix="%" />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Leave Schedule Restriction:</strong> leave requests are only allowed when the employee has a pre-scheduled leave entry (pending or approved) that fully covers the requested dates.
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">All employees — leave overview</h3>
              <DataTable
                columns={[
                  { key: 'names', label: 'Employee', render: (row) => (
                    <button type="button" className="text-left font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/employee-analysis/${row.user_id}`)}>
                      {row.names}
                    </button>
                  ) },
                  { key: 'department', label: 'Department' },
                  { key: 'days_left', label: 'Days left', render: (row) => (
                    <span className={Number(row.days_left) <= 3 ? 'font-semibold text-amber-700' : ''}>{row.days_left}</span>
                  ) },
                  { key: 'utilization_pct', label: 'Used %', render: (row) => `${row.utilization_pct}%` },
                  { key: 'current_status', label: 'Current status' },
                  { key: 'requests_count', label: 'Requests' },
                  { key: 'missing_schedule_count', label: 'No schedule', render: (row) => (
                    row.missing_schedule_count > 0
                      ? <span className="font-medium text-rose-600">{row.missing_schedule_count}</span>
                      : '0'
                  ) },
                ]}
                rows={employees}
                empty="No employees match your filters"
              />
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Employee detail</h3>
              {!selected ? (
                <p className="text-sm text-gray-500">Select an employee from the table to view full leave profile.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{selected.names}</p>
                    <p className="text-sm text-gray-500">{selected.role} · {selected.department || 'No department'}</p>
                    <p className="text-sm text-gray-500">{selected.email}</p>
                  </div>
                  <LeaveBalanceSummary balance={selected.balance} userName={selected.names} compact />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Status</p><p className="font-medium">{selected.current_status}</p></div>
                    <div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Approved days ({year})</p><p className="font-medium">{selected.approved_days_ytd}</p></div>
                    <div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Pending days</p><p className="font-medium">{selected.pending_days}</p></div>
                    <div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Schedules</p><p className="font-medium">{selected.schedules_count}</p></div>
                  </div>
                  {selected.upcoming_schedule && (
                    <div className="rounded-lg bg-sky-50 p-3 text-sm">
                      <p className="font-medium text-sky-900">Upcoming schedule</p>
                      <p>{formatPhpDate(selected.upcoming_schedule.from_date)} – {formatPhpDate(selected.upcoming_schedule.return_date)} ({selected.upcoming_schedule.status})</p>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-800">Recent requests</p>
                    <ul className="space-y-2 text-sm">
                      {(selected.requests || []).slice(0, 5).map((row) => (
                        <li key={row.id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <span>#{row.id} {row.leave_type}</span>
                          <StatusBadge value={row.leave_requests_status} />
                        </li>
                      ))}
                    </ul>
                    {selected.latest_request?.id && (
                      <button type="button" className="mt-2 text-sm font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/leave-requests/${selected.latest_request.id}`)}>
                        View latest request
                      </button>
                    )}
                  </div>
                  <Link to={`/dashboard/employee-analysis/${selected.user_id}`} className="inline-block text-sm font-medium text-[#2f5d31]">
                    Full employee profile →
                  </Link>
                  <Link to={`/dashboard/leave-schedule?user=${selected.user_id}`} className="mt-2 inline-block text-sm font-medium text-[#2f5d31]">
                    View leave schedules →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
