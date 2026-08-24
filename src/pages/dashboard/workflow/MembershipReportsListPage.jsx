import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, Eye, FileText, Plus } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  canCreateMembershipReport,
  canSeeAllMembershipReports,
  isMembershipSupervisor,
} from '../../../utils/rwvcaAccess';
import { formatPhpDate } from './helpers';
import {
  DISTRICTS,
  MONTHS,
  YEARS,
  toIsoDate,
  formatReportPeriod,
} from './membershipReportShared';

const REPORT_TYPES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const emptyFilters = {
  search: '',
  status: '',
  report_type: '',
  location: '',
  start_date: '',
  end_date: '',
  monthly_month: MONTHS[new Date().getMonth()],
  yearly_year: String(new Date().getFullYear()),
  quarter: '',
};

function defaultFilters(role) {
  if (!isMembershipSupervisor(role)) return { ...emptyFilters };
  const today = toIsoDate(new Date());
  return {
    ...emptyFilters,
    report_type: 'DAILY',
    start_date: today,
  };
}

function cleanParams(values) {
  const next = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value !== '' && value != null) next[key] = value;
  });
  return next;
}

function periodParams(filters) {
  const type = filters.report_type;
  const params = {
    search: filters.search,
    status: filters.status,
    report_type: filters.report_type,
    location: filters.location,
  };
  if (type === 'DAILY') params.start_date = filters.start_date;
  if (type === 'WEEKLY') {
    params.start_date = filters.start_date;
    params.end_date = filters.end_date;
  }
  if (type === 'MONTHLY') {
    params.monthly_month = filters.monthly_month;
    params.yearly_year = filters.yearly_year;
  }
  if (type === 'QUARTERLY') {
    params.quarter = filters.quarter;
    params.yearly_year = filters.yearly_year;
  }
  if (type === 'YEARLY') params.yearly_year = filters.yearly_year;
  if (!type) {
    params.start_date = filters.start_date;
    params.end_date = filters.end_date;
  }
  return cleanParams(params);
}

function StatCard({ label, value, className }) {
  return (
    <div className={`rounded-xl px-4 py-4 text-white shadow-sm ${className}`}>
      <p className="text-2xl font-semibold">{value ?? 0}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">{label}</p>
    </div>
  );
}

export default function MembershipReportsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSeeAll = canSeeAllMembershipReports(user?.role);
  const isSupervisor = isMembershipSupervisor(user?.role);
  const canCreate = canCreateMembershipReport(user?.role);
  const [tab, setTab] = useState('my');
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [items, setItems] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [summary, setSummary] = useState({ officers: 0, submitted: 0, missed: 0 });
  const [stats, setStats] = useState({ total: 0, this_week: 0, this_month: 0, this_year: 0 });
  const [tabCounts, setTabCounts] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const didInit = useRef(false);

  const tabs = useMemo(() => {
    const list = [
      { value: 'my', label: 'My Reports' },
      { value: 'review', label: 'Shared with Me' },
    ];
    if (canSeeAll) list.push({ value: 'all', label: 'All Reports' });
    if (canSeeAll) list.push({ value: 'missed', label: isSupervisor ? 'Who missed reporting' : 'Missing officers' });
    return list;
  }, [canSeeAll, isSupervisor]);

  const loadReports = async (nextFilters = filters, nextTab = tab) => {
    const res = await api.get('/membership-reports', {
      ...periodParams(nextFilters),
      tab: nextTab === 'missed' ? (canSeeAll ? 'all' : 'my') : nextTab,
      limit: 200,
    });
    setItems(res.data?.items || []);
    setStats(res.data?.stats || { total: 0, this_week: 0, this_month: 0, this_year: 0 });
  };

  const loadCoverage = async (nextFilters = filters) => {
    if (!canSeeAll || !nextFilters.report_type) {
      setCoverage([]);
      setSummary({ officers: 0, submitted: 0, missed: 0 });
      return;
    }
    const res = await api.get('/membership-reports/coverage', periodParams(nextFilters));
    setCoverage(res.data?.items || []);
    setSummary(res.data?.summary || { officers: 0, submitted: 0, missed: 0 });
  };

  const loadCounts = async () => {
    const listTabs = tabs.filter((item) => item.value !== 'missed');
    const entries = await Promise.all(listTabs.map(async (item) => {
      try {
        const res = await api.get('/membership-reports', { tab: item.value, limit: 1 });
        return [item.value, res.data?.pagination?.total ?? 0];
      } catch {
        return [item.value, 0];
      }
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  const load = async (nextFilters = filters, nextTab = tab) => {
    setLoading(true);
    try {
      let activeFilters = nextFilters;
      if (nextTab === 'missed' && !activeFilters.report_type) {
        const today = toIsoDate(new Date());
        activeFilters = { ...activeFilters, report_type: 'DAILY', start_date: today };
        setFilters(activeFilters);
      }
      if (nextTab === 'missed') await loadCoverage(activeFilters);
      else await loadReports(activeFilters, nextTab);
      await loadCounts();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load membership reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.role) return;
    if (!didInit.current) {
      didInit.current = true;
      const nextFilters = defaultFilters(user.role);
      const nextTab = isMembershipSupervisor(user.role)
        ? 'missed'
        : canSeeAllMembershipReports(user.role)
          ? 'all'
          : 'my';
      setFilters(nextFilters);
      setTab(nextTab);
      load(nextFilters, nextTab).catch(() => {});
      return;
    }
    load().catch(() => {});
  }, [tab, user?.role]);

  const setField = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  const applyFilters = (event) => {
    event?.preventDefault?.();
    load();
  };

  const resetFilters = () => {
    const next = defaultFilters(user?.role);
    setFilters(next);
    load(next, tab).catch(() => {});
  };

  const exportRows = () => {
    const rows = tab === 'missed' ? coverage : items;
    exportCsv('membership-reports', [
      { key: 'id', label: 'ID', value: (row) => row.id || '' },
      { key: 'title', label: 'Title' },
      { key: 'user_name', label: 'Officer', value: (row) => row.user_name || row.user?.names || row.submitter?.names || '' },
      { key: 'report_type', label: 'Type' },
      { key: 'location', label: 'Location' },
      { key: 'period', label: 'Period', value: (row) => formatReportPeriod(row) },
      { key: 'status', label: 'Status' },
    ], rows);
  };

  const reportColumns = [
    { key: 'id', label: '#', render: (row, idx) => idx + 1 },
    { key: 'title', label: 'Title', render: (row) => row.title || `${row.report_type} report` },
    ...(canSeeAll ? [{
      key: 'officer',
      label: 'Officer',
      render: (row) => row.user?.names || row.submitter?.names || '—',
    }] : []),
    { key: 'report_type', label: 'Type', render: (row) => <StatusBadge value={row.report_type} /> },
    { key: 'location', label: 'Location', render: (row) => row.location || '—' },
    { key: 'period', label: 'Period', render: (row) => formatReportPeriod(row) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'created_at', label: 'Created', render: (row) => formatPhpDate(row.created_at) },
  ];

  const coverageColumns = [
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge value={row.missed ? 'missed' : row.status} />,
    },
    {
      key: 'user_name',
      label: 'Officer',
      render: (row) => (
        <div>
          <p className="font-medium">{row.user_name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Report',
      render: (row) => (
        <div>
          <p className={row.missed ? 'text-gray-500' : 'font-medium'}>{row.title}</p>
          {row.missed && <p className="text-xs text-rose-600">No report submitted for this period</p>}
        </div>
      ),
    },
    { key: 'location', label: 'Location', render: (row) => row.location || '—' },
    { key: 'period', label: 'Period', render: (row) => (row.missed ? '—' : formatReportPeriod(row)) },
    { key: 'created_at', label: 'Submitted', render: (row) => (row.created_at ? formatPhpDate(row.created_at) : '—') },
  ];

  const missedCount = coverage.filter((row) => row.missed).length;

  return (
    <div>
      <PageHeading
        icon={<FileText className="h-6 w-6" />}
        title={canSeeAll ? 'Membership Reports' : 'My Membership Reports'}
        subtitle={isSupervisor
          ? 'Filter by daily, weekly, monthly, or other report types to see submitted reports and officers who missed reporting.'
          : 'View your membership reports and any reports assigned to you for review.'}
        actions={[
          { label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: exportRows, disabled: !(tab === 'missed' ? coverage.length : items.length) },
          ...(canCreate ? [{ label: 'Create Report', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/dashboard/create/membership-reports') }] : []),
        ]}
      />

      {(canSeeAll || tab !== 'missed') && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tab === 'missed' ? (
            <>
              <StatCard label="Officers" value={summary.officers} className="bg-[#2f5d31]" />
              <StatCard label="Submitted" value={summary.submitted} className="bg-[#2f5d31]/80" />
              <StatCard label="Missed" value={summary.missed} className="bg-rose-600" />
              <StatCard label="Coverage" value={summary.officers ? `${summary.submitted}/${summary.officers}` : '0/0'} className="bg-[#6b4423]" />
            </>
          ) : (
            <>
              <StatCard label="Total reports" value={stats.total} className="bg-[#2f5d31]" />
              <StatCard label="This week" value={stats.this_week} className="bg-[#6b4423]" />
              <StatCard label="This month" value={stats.this_month} className="bg-orange-500" />
              <StatCard label="This year" value={stats.this_year} className="bg-[#1e3a1e]" />
            </>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                tab === item.value ? 'bg-[#2f5d31] text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              {item.value !== 'missed' && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${tab === item.value ? 'bg-white/20' : 'bg-white text-gray-600'}`}>
                  {tabCounts[item.value] ?? 0}
                </span>
              )}
              {item.value === 'missed' && missedCount > 0 && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${tab === item.value ? 'bg-white/20' : 'bg-rose-100 text-rose-700'}`}>
                  {missedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={applyFilters} className="mb-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-sm text-gray-600">
            Search
            <input
              className={`mt-1 ${inputClass}`}
              value={filters.search}
              onChange={(e) => setField('search', e.target.value)}
              placeholder="Search title..."
            />
          </label>
          <label className="text-sm text-gray-600">
            Report type
            <select className={`mt-1 ${inputClass}`} value={filters.report_type} onChange={(e) => setField('report_type', e.target.value)}>
              <option value="">All types</option>
              {REPORT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Location
            <select className={`mt-1 ${inputClass}`} value={filters.location} onChange={(e) => setField('location', e.target.value)}>
              <option value="">All locations</option>
              {DISTRICTS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          {tab !== 'missed' && (
            <label className="text-sm text-gray-600">
              Status
              <select className={`mt-1 ${inputClass}`} value={filters.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="">All status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REVERTED">Reverted</option>
              </select>
            </label>
          )}
          {(!filters.report_type || filters.report_type === 'DAILY') && (
            <label className="text-sm text-gray-600">
              {filters.report_type === 'DAILY' ? 'Date' : 'From'}
              <input type="date" className={`mt-1 ${inputClass}`} value={filters.start_date} onChange={(e) => setField('start_date', e.target.value)} />
            </label>
          )}
          {filters.report_type === 'WEEKLY' && (
            <>
              <label className="text-sm text-gray-600">
                Week start
                <input type="date" className={`mt-1 ${inputClass}`} value={filters.start_date} onChange={(e) => setField('start_date', e.target.value)} />
              </label>
              <label className="text-sm text-gray-600">
                Week end
                <input type="date" className={`mt-1 ${inputClass}`} value={filters.end_date} onChange={(e) => setField('end_date', e.target.value)} />
              </label>
            </>
          )}
          {!filters.report_type && (
            <label className="text-sm text-gray-600">
              To
              <input type="date" className={`mt-1 ${inputClass}`} value={filters.end_date} onChange={(e) => setField('end_date', e.target.value)} />
            </label>
          )}
          {filters.report_type === 'MONTHLY' && (
            <>
              <label className="text-sm text-gray-600">
                Month
                <select className={`mt-1 ${inputClass}`} value={filters.monthly_month} onChange={(e) => setField('monthly_month', e.target.value)}>
                  {MONTHS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Year
                <select className={`mt-1 ${inputClass}`} value={filters.yearly_year} onChange={(e) => setField('yearly_year', e.target.value)}>
                  {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </>
          )}
          {filters.report_type === 'QUARTERLY' && (
            <>
              <label className="text-sm text-gray-600">
                Quarter
                <select className={`mt-1 ${inputClass}`} value={filters.quarter} onChange={(e) => setField('quarter', e.target.value)}>
                  <option value="">All quarters</option>
                  <option value="1">Quarter 1 (Jan-Mar)</option>
                  <option value="2">Quarter 2 (Apr-Jun)</option>
                  <option value="3">Quarter 3 (Jul-Sep)</option>
                  <option value="4">Quarter 4 (Oct-Dec)</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Year
                <select className={`mt-1 ${inputClass}`} value={filters.yearly_year} onChange={(e) => setField('yearly_year', e.target.value)}>
                  {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </>
          )}
          {filters.report_type === 'YEARLY' && (
            <label className="text-sm text-gray-600">
              Year
              <select className={`mt-1 ${inputClass}`} value={filters.yearly_year} onChange={(e) => setField('yearly_year', e.target.value)}>
                {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          )}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">
              {loading ? 'Loading...' : 'Apply'}
            </button>
            <button type="button" onClick={resetFilters} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700">
              Reset
            </button>
          </div>
        </form>

        {tab === 'missed' && !filters.report_type && (
          <p className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle size={16} /> Select a report type, such as Daily, then Apply to see officers who missed reporting.
          </p>
        )}
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {tab === 'missed' ? (
          <DataTable
            columns={coverageColumns}
            rows={coverage}
            empty={filters.report_type ? 'No membership officers found for this period' : 'Select a report type to check missed reports'}
            rowClassName={(row) => (row.missed ? 'bg-rose-50/70 hover:bg-rose-50' : 'hover:bg-gray-50')}
            renderActions={(row) => (
              row.id ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-[#2f5d31]"
                  onClick={() => navigate(`/dashboard/membership-reports/${row.id}`)}
                >
                  <Eye size={14} /> View report
                </button>
              ) : (
                <span className="text-xs font-medium text-rose-600">Missed</span>
              )
            )}
          />
        ) : (
          <DataTable
            columns={reportColumns}
            rows={items}
            empty="No membership reports found"
            renderActions={(row) => (
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium text-[#2f5d31]"
                onClick={() => navigate(`/dashboard/membership-reports/${row.id}`)}
              >
                <Eye size={14} /> View
              </button>
            )}
          />
        )}
      </div>
    </div>
  );
}
