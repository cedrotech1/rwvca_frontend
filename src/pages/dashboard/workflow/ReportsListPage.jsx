import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, exportCsv, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { useStaffOptions, formatPhpDateTime } from './helpers';
import { reportTypeLabel } from './reportConstants';

function cleanParams(values) {
  const next = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value !== '' && value != null && value !== '0') next[key] = value;
  });
  return next;
}

export default function ReportsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { users } = useStaffOptions();
  const tab = searchParams.get('tab') || 'my';
  const [items, setItems] = useState([]);
  const [tabCounts, setTabCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    filter_type: searchParams.get('filter_type') || '',
    filter_creator: searchParams.get('filter_creator') || '',
    filter_recipient: searchParams.get('filter_recipient') || '',
    filter_status: searchParams.get('filter_status') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
  });

  const queryParams = () => ({
    tab,
    search,
    limit: 20,
    page: searchParams.get('page') || 1,
    ...cleanParams(filters),
  });

  const load = async () => {
    try {
      const res = await api.get('/reports', queryParams());
      setItems(res.data?.items || []);
      setPagination(res.data?.pagination || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reports');
    }
  };

  const loadCounts = async () => {
    const entries = await Promise.all(['my', 'shared'].map(async (value) => {
      try {
        const res = await api.get('/reports', { tab: value, limit: 1 });
        return [value, res.data?.pagination?.total ?? 0];
      } catch {
        return [value, 0];
      }
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    load().catch(() => {});
    loadCounts().catch(() => {});
  }, [tab, searchParams.get('page')]);

  const setTab = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    next.delete('page');
    if (value === 'my') next.delete('filter_status');
    if (value === 'shared') next.delete('filter_recipient');
    setSearchParams(next);
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    next.set('tab', tab);
    if (search.trim()) next.set('search', search.trim());
    Object.entries(cleanParams(filters)).forEach(([key, value]) => next.set(key, value));
    setSearchParams(next);
    setTimeout(() => load().catch(() => {}), 0);
  };

  const resetFilters = () => {
    setSearch('');
    setFilters({
      filter_type: '',
      filter_creator: '',
      filter_recipient: '',
      filter_status: '',
      date_from: '',
      date_to: '',
    });
    setSearchParams({ tab });
    setTimeout(() => load().catch(() => {}), 0);
  };

  const deleteRow = async (row) => {
    if (!window.confirm(`Delete report "${row.title}" permanently?`)) return;
    try {
      await api.del(`/reports/${row.id}`);
      await load();
      await loadCounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete report');
    }
  };

  const columns = useMemo(() => {
    const base = [
      { key: 'id', label: '#', render: (row, idx) => idx + 1 },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type', render: (row) => reportTypeLabel(row.type) },
      { key: 'created_at', label: 'Created', render: (row) => formatPhpDateTime(row.created_at) },
      { key: 'creator_name', label: 'Creator', render: (row) => row.creator_name || row.creator?.names || '—' },
      { key: 'shared_with', label: 'Shared With', render: (row) => row.shared_with || '—' },
      { key: 'replies', label: 'Replies', render: (row) => String(row.replies ?? 0) },
    ];
    if (tab === 'shared') {
      base.push({
        key: 'read_status',
        label: 'Status',
        render: (row) => (
          Number(row.read_status) === 1
            ? <span className="text-emerald-600 font-medium">Read</span>
            : <span className="text-rose-600 font-medium">Unread</span>
        ),
      });
    }
    return base;
  }, [tab]);

  const exportRows = () => {
    exportCsv('reports', columns.map((col) => ({
      key: col.key,
      label: col.label,
      value: (row) => (col.render ? col.render(row) : row[col.key]),
    })), items);
  };

  return (
    <div>
      <PageHeading
        icon={<FileText className="h-6 w-6" />}
        title="Report List"
        subtitle="View and manage all submitted reports"
        actions={[
          { label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: exportRows, disabled: !items.length },
          { label: 'Membership Reports', variant: 'secondary', icon: <FileText className="h-4 w-4" />, onClick: () => navigate('/dashboard/membership-reports') },
          { label: 'Create New Report', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/dashboard/create/reports') },
        ]}
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {[
            { value: 'my', label: 'My Reports' },
            { value: 'shared', label: 'Shared with Me' },
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title/content..." className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-sm text-gray-600">
            Report Type
            <select className={`mt-1 ${inputClass}`} value={filters.filter_type} onChange={(e) => setFilters((prev) => ({ ...prev, filter_type: e.target.value }))}>
              <option value="">All Types</option>
              {['Weekly', 'Monthly', 'Travel', 'Activity', 'Incident', 'Other', 'Weekly Report', 'Monthly Report', 'Travel / Field Report', 'Activity Report', 'Incident Report'].map((value) => (
                <option key={value} value={value}>{reportTypeLabel(value)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            From Date
            <input type="date" className={`mt-1 ${inputClass}`} value={filters.date_from} onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))} />
          </label>
          <label className="text-sm text-gray-600">
            To Date
            <input type="date" className={`mt-1 ${inputClass}`} value={filters.date_to} onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))} />
          </label>
          <label className="text-sm text-gray-600">
            Creator
            <select className={`mt-1 ${inputClass}`} value={filters.filter_creator} onChange={(e) => setFilters((prev) => ({ ...prev, filter_creator: e.target.value }))}>
              <option value="">All Creators</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.names}</option>)}
            </select>
          </label>
          {tab === 'my' ? (
            <label className="text-sm text-gray-600">
              Recipient
              <select className={`mt-1 ${inputClass}`} value={filters.filter_recipient} onChange={(e) => setFilters((prev) => ({ ...prev, filter_recipient: e.target.value }))}>
                <option value="">All Recipients</option>
                {users.map((item) => <option key={item.id} value={item.id}>{item.names}</option>)}
              </select>
            </label>
          ) : (
            <label className="text-sm text-gray-600">
              Read Status
              <select className={`mt-1 ${inputClass}`} value={filters.filter_status} onChange={(e) => setFilters((prev) => ({ ...prev, filter_status: e.target.value }))}>
                <option value="">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
            </label>
          )}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">Apply Filters</button>
            <button type="button" onClick={resetFilters} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700">Reset</button>
          </div>
        </form>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <DataTable
          columns={columns}
          rows={items}
          rowClassName={(row) => (tab === 'shared' && Number(row.read_status) !== 1 ? 'bg-amber-50' : '')}
          actionsLabel="Actions"
          renderActions={(row) => (
            <>
              <button type="button" className="mr-2 inline-flex items-center gap-1 font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/reports/${row.id}?tab=${tab}`)}>
                <Eye size={14} /> View
              </button>
              {tab === 'my' && (
                <button type="button" className="inline-flex items-center gap-1 text-rose-600" onClick={() => deleteRow(row)}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </>
          )}
        />

        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                className="rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-50"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(pagination.page - 1));
                  setSearchParams(next);
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                className="rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-50"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(pagination.page + 1));
                  setSearchParams(next);
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
