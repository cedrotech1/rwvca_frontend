import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { downloadProtectedFile, fileUrl } from '../../../services/api/config';
import { useAuth } from '../../../contexts/AuthContext';
import { canReviewLists } from '../../../utils/rwvcaAccess';
import { formatCell, formatPhpDateTime, useStaffOptions } from './helpers';
import { LeaveBalanceSummary } from './leaveShared';

const LEAVE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'verified_by_hr', label: 'Verified by HR' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'reverted', label: 'Reverted' },
];

function StatCard({ label, value, className = 'bg-[#2f5d31]' }) {
  return (
    <div className={`rounded-xl px-4 py-4 text-white shadow-sm ${className}`}>
      <p className="text-2xl font-semibold">{value ?? 0}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">{label}</p>
    </div>
  );
}

export default function LeaveReportsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useStaffOptions();
  const isHr = canReviewLists(user?.role);
  const [tab, setTab] = useState('my');
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(null);
  const [insights, setInsights] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', user_id: '', date_from: '', date_to: '' });
  const [tabCounts, setTabCounts] = useState({});
  const [error, setError] = useState('');

  const params = () => {
    const next = { tab, search, limit: 100 };
    if (filters.status) next.status = filters.status;
    if (filters.user_id) next.user_id = filters.user_id;
    if (filters.date_from) next.date_from = filters.date_from;
    if (filters.date_to) next.date_to = filters.date_to;
    if (isHr && tab === 'received') next.include_balance = '1';
    return next;
  };

  const load = async () => {
    const res = await api.get('/leave-requests', params());
    setItems(res.data?.items || []);
    setError('');
  };

  const loadBalance = async () => {
    try {
      const res = await api.get('/leave-requests/balance');
      setBalance(res.data || null);
    } catch {
      setBalance(null);
    }
  };

  const loadInsights = async () => {
    if (!isHr) return;
    try {
      const res = await api.get('/leave-requests/analytics', { year: new Date().getFullYear(), limit: 200 });
      setInsights(res.data || null);
    } catch {
      setInsights(null);
    }
  };

  const loadCounts = async () => {
    const tabs = [
      { value: 'my', label: 'My Leave Requests' },
      ...(isHr ? [{ value: 'received', label: 'Received Leave Requests' }] : []),
    ];
    const entries = await Promise.all(tabs.map(async (item) => {
      try {
        const res = await api.get('/leave-requests', { tab: item.value, limit: 1 });
        return [item.value, res.data?.pagination?.total ?? 0];
      } catch {
        return [item.value, 0];
      }
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Could not load leave requests'));
    loadCounts().catch(() => {});
    if (tab === 'my') loadBalance().catch(() => {});
    if (isHr) loadInsights().catch(() => {});
  }, [tab, isHr]);

  const applyFilters = (event) => {
    event?.preventDefault?.();
    load().catch((err) => setError(err.response?.data?.message || 'Could not load leave requests'));
  };

  const deleteRow = async (row) => {
    if (!window.confirm('Delete this leave request?')) return;
    try {
      await api.del(`/leave-requests/${row.id}`);
      await load();
      await loadCounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete');
    }
  };

  const columns = useMemo(() => {
    const base = [
      { key: 'id', label: '#', render: (row, idx) => idx + 1 },
      ...(tab === 'received' ? [{
        key: 'user.names',
        label: 'Applicant',
        render: (row) => row.user?.names || '—',
      }] : []),
      { key: 'leave_type', label: 'Type' },
      {
        key: 'period',
        label: 'Period',
        render: (row) => `${String(row.leave_from || '').slice(0, 10)} – ${String(row.return_date || '').slice(0, 10)}`,
      },
      { key: 'requested_days', label: 'Days' },
      ...(isHr && tab === 'received' ? [{
        key: 'days_left',
        label: 'Days left',
        render: (row) => (
          <span className={Number(row.days_left) <= 3 ? 'font-semibold text-amber-700' : 'text-gray-700'}>
            {row.days_left ?? '—'}
          </span>
        ),
      }] : []),
      { key: 'leave_requests_status', label: 'Status', render: (row) => <StatusBadge value={row.leave_requests_status} /> },
      { key: 'created_at', label: 'Created', render: (row) => formatPhpDateTime(row.created_at) },
    ];
    return base;
  }, [tab, isHr]);

  const exportRows = () => {
    exportCsv('leave-requests', columns.map((col) => ({
      key: col.key,
      label: col.label,
      value: (row) => (col.render ? undefined : formatCell(row, col)),
    })), items);
  };

  const summary = insights?.summary;
  const insightCards = insights?.insights || [];

  return (
    <div>
      <PageHeading
        icon={<CalendarDays className="h-6 w-6" />}
        title="Leave Requests"
        subtitle={isHr ? 'Track team leave balances, requests, and schedule compliance.' : 'View your leave balance and request history.'}
        actions={[
          ...(isHr ? [{
            label: 'Leave analysis',
            variant: 'secondary',
            icon: <BarChart3 className="h-4 w-4" />,
            onClick: () => navigate('/dashboard/leave-analysis'),
          }] : []),
          { label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: exportRows, disabled: !items.length },
          { label: 'New request', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/dashboard/create/leave-requests') },
        ]}
      />

      {tab === 'my' && balance && (
        <div className="mb-4">
          <LeaveBalanceSummary balance={balance} userName={user?.names} />
        </div>
      )}

      {isHr && summary && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Employees tracked" value={summary.employees} />
            <StatCard label="On leave today" value={summary.on_leave_now} className="bg-sky-700" />
            <StatCard label="Total days available" value={summary.total_days_available} className="bg-emerald-600" />
            <StatCard label="Unscheduled requests" value={summary.unscheduled_requests} className="bg-rose-600" />
          </div>
          {insightCards.length > 0 && (
            <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
              <h3 className="mb-3 text-sm font-semibold text-sky-900">Leave insights</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {insightCards.map((item) => (
                  <div key={item.key} className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-100">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Leave Schedule Restriction: employees must pre-schedule leave dates before submitting a leave request.
                {' '}
                <Link to="/dashboard/leave-analysis" className="font-medium text-[#2f5d31]">Open full analysis</Link>
              </p>
            </div>
          )}
        </>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {[
            { value: 'my', label: 'My Leave Requests' },
            ...(isHr ? [{ value: 'received', label: 'Received Leave Requests' }] : []),
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === item.value ? 'bg-[#2f5d31] text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${tab === item.value ? 'bg-white/20' : 'bg-white text-gray-600'}`}>
                {tabCounts[item.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={applyFilters} className="mb-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-sm text-gray-600">
            Search
            <input className={`mt-1 ${inputClass}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search type or name..." />
          </label>
          <label className="text-sm text-gray-600">
            Status
            <select className={`mt-1 ${inputClass}`} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All status</option>
              {LEAVE_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {isHr && tab === 'received' && (
            <label className="text-sm text-gray-600">
              Applicant
              <select className={`mt-1 ${inputClass}`} value={filters.user_id} onChange={(e) => setFilters((p) => ({ ...p, user_id: e.target.value }))}>
                <option value="">All users</option>
                {users.map((item) => <option key={item.id} value={item.id}>{item.names}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm text-gray-600">
            From
            <input type="date" className={`mt-1 ${inputClass}`} value={filters.date_from} onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
          </label>
          <label className="text-sm text-gray-600">
            To
            <input type="date" className={`mt-1 ${inputClass}`} value={filters.date_to} onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">Filter</button>
            <button type="button" className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700" onClick={() => { setSearch(''); setFilters({ status: '', user_id: '', date_from: '', date_to: '' }); setTimeout(() => load(), 0); }}>Reset</button>
          </div>
        </form>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <DataTable
          columns={columns}
          rows={items}
          empty="No leave requests found"
          renderActions={(row) => (
            <>
              <button type="button" className="mr-2 inline-flex items-center gap-1 font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/leave-requests/${row.id}`)}>
                <Eye size={14} /> View
              </button>
              {row.letter_url && (
                <button type="button" className="mr-2 inline-flex items-center gap-1 font-medium text-emerald-700" onClick={() => window.open(fileUrl(row.letter_url, { auth: true }), '_blank')}>
                  Letter
                </button>
              )}
              {((isHr && ['pending', 'draft'].includes(row.leave_requests_status)) || (Number(row.user_id) === Number(user?.id) && ['pending', 'draft'].includes(row.leave_requests_status))) && (
                <button type="button" className="inline-flex items-center gap-1 font-medium text-red-600" onClick={() => deleteRow(row)}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </>
          )}
        />
      </div>
    </div>
  );
}
