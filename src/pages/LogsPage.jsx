import { useEffect, useState } from 'react';
import { Download, RefreshCw, ScrollText, Search } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { DataTable, StatusBadge, inputClass } from '../components/ui/dataUi';
import api from '../services/api';
import apiClient from '../services/api/config';
import { useAuth } from '../contexts/AuthContext';
import { formatPhpDateTime, useStaffOptions } from './dashboard/workflow/helpers';
import { ChartCard, Donut, HBar, StatCard } from './dashboard/analysis/analysisShared';

export default function LogsPage() {
  const { user } = useAuth();
  const { users } = useStaffOptions();
  const canExport = ['admin', 'ed', 'chairman', 'hr'].includes(String(user?.role || '').toLowerCase());
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', module: '', action: '', status: '', user_id: '', startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params = (page = 1) => ({
    page,
    limit: 50,
    search: filters.search || undefined,
    module: filters.module || undefined,
    action: filters.action || undefined,
    status: filters.status || undefined,
    user_id: filters.user_id || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const [listRes, statRes] = await Promise.all([
        api.get('/logs', params(page)),
        api.get('/logs/statistics', params(1)),
      ]);
      setItems(listRes.data?.items || listRes.data?.logs || []);
      setPagination(listRes.data?.pagination || { page: 1, pages: 1, total: 0 });
      setStats(statRes.data?.statistics || statRes.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1).catch(() => {});
  }, []);

  const exportCsv = async () => {
    const res = await apiClient.get('/logs/export', { params: params(1), responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const byModule = Object.entries(stats?.logsByModule || {}).map(([label, value]) => ({ label, value }));
  const byAction = Object.entries(stats?.logsByAction || {}).slice(0, 10).map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6">
      <PageHeading
        title="System Logs & Analytics"
        subtitle="View and monitor system activity logs"
        icon={<ScrollText className="h-6 w-6" />}
        actions={[
          ...(canExport ? [{ label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: exportCsv }] : []),
          { label: loading ? 'Loading...' : 'Refresh', variant: 'secondary', icon: <RefreshCw className="h-4 w-4" />, onClick: () => load(pagination.page || 1) },
        ]}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total logs" value={stats?.totalLogs ?? 0} />
        <StatCard label="Successful" value={stats?.successfulLogs ?? 0} className="bg-emerald-600" />
        <StatCard label="Failed" value={stats?.failedLogs ?? 0} className="bg-rose-600" />
        <StatCard label="Warnings" value={stats?.warningLogs ?? 0} className="bg-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="By module"><Donut items={byModule} /></ChartCard>
        <ChartCard title="Top actions"><HBar items={byAction} /></ChartCard>
        <ChartCard title="Top users">
          <HBar items={(stats?.logsByUser || []).map((item) => ({ label: item.userName, value: item.count }))} />
        </ChartCard>
      </div>

      <ChartCard title="Daily activity (last 14 days)">
        <HBar items={(stats?.logsByDate || []).map((item) => ({ label: item.date, value: item.count }))} />
      </ChartCard>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <form
          onSubmit={(e) => { e.preventDefault(); load(1); }}
          className="mb-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-8"
        >
          <label className="text-sm text-gray-600 lg:col-span-2">
            Search
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputClass} pl-8`} value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Action or description..." />
            </div>
          </label>
          <label className="text-sm text-gray-600">
            Module
            <select className={`mt-1 ${inputClass}`} value={filters.module} onChange={(e) => setFilters((p) => ({ ...p, module: e.target.value }))}>
              <option value="">All</option>
              {['Authentication', 'Users', 'Members', 'Member Products', 'Website', 'Events', 'Programs', 'Reports', 'Leave', 'Requisitions', 'Missions', 'Tickets', 'System Settings', 'System'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Status
            <select className={`mt-1 ${inputClass}`} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="WARNING">Warning</option>
            </select>
          </label>
          <label className="text-sm text-gray-600">
            User
            <select className={`mt-1 ${inputClass}`} value={filters.user_id} onChange={(e) => setFilters((p) => ({ ...p, user_id: e.target.value }))}>
              <option value="">All users</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.names}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            From
            <input type="date" className={`mt-1 ${inputClass}`} value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
          </label>
          <label className="text-sm text-gray-600">
            To
            <input type="date" className={`mt-1 ${inputClass}`} value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">Filter</button>
            <button type="button" className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm" onClick={() => { setFilters({ search: '', module: '', action: '', status: '', user_id: '', startDate: '', endDate: '' }); setTimeout(() => load(1), 0); }}>Reset</button>
          </div>
        </form>

        <DataTable
          columns={[
            { key: 'id', label: '#', render: (row, idx) => idx + 1 },
            { key: 'userName', label: 'User', render: (row) => row.userName || row.user?.names || 'System' },
            { key: 'user.role', label: 'Role', render: (row) => row.user?.role || '—' },
            { key: 'module', label: 'Module' },
            { key: 'action', label: 'Action' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'description', label: 'Description' },
            { key: 'created_at', label: 'Date', render: (row) => formatPhpDateTime(row.created_at) },
          ]}
          rows={items}
          empty={loading ? 'Loading logs...' : 'No logs found'}
        />
        {pagination.pages > 1 && (
          <div className="mt-4 flex justify-end gap-2 text-sm">
            <button disabled={(pagination.page || 1) <= 1} className="rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-50" onClick={() => load((pagination.page || 1) - 1)}>Previous</button>
            <span className="px-2 py-1.5 text-gray-600">Page {pagination.page} of {pagination.pages}</span>
            <button disabled={(pagination.page || 1) >= pagination.pages} className="rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-50" onClick={() => load((pagination.page || 1) + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
