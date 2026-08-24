import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Search } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canSeeMembersAnalysis } from '../../../utils/rwvcaAccess';
import { AnalysisAccessDenied, ChartCard, Donut, HBar, StatCard, DataTable, StatusBadge, inputClass } from './analysisShared';

export default function MembersAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = canSeeMembersAnalysis(user?.role);
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStats = async (paymentYear) => {
    const res = await api.get('/members/statistics', paymentYear ? { payment_year: paymentYear } : {});
    setData(res.data || null);
    setYear(String(res.data?.selected_year || paymentYear || ''));
  };

  const loadMembers = async () => {
    const res = await api.get('/members', {
      search: search || undefined,
      membership_status: status || undefined,
      limit: 40,
      sort_by: 'date_joined',
    });
    setMembers(res.data?.items || []);
  };

  const load = async (paymentYear) => {
    if (!allowed) return;
    setLoading(true);
    try {
      await Promise.all([loadStats(paymentYear), loadMembers()]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load members analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load().catch(() => {});
  }, [allowed]);

  if (!allowed) return <AnalysisAccessDenied label="Members analysis" />;

  const stats = data || {};
  const employees = stats.employees || { women: 0, men: 0, pwd: 0 };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Members Analysis"
        subtitle="Analyze membership data and trends"
        icon={<PieChart className="h-6 w-6" />}
        showBack
        backTo="/dashboard"
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <form
          onSubmit={(e) => { e.preventDefault(); load(year); }}
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm text-gray-600">
            Payment year
            <select className={`mt-1 ${inputClass}`} value={year} onChange={(e) => { setYear(e.target.value); load(e.target.value); }}>
              {(stats.available_years || []).map((item) => (
                <option key={item.id || item.year_value} value={item.year_value}>{item.year_value}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Umusanzu status
            <select className={`mt-1 ${inputClass}`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Not Paid">Not Paid</option>
            </select>
          </label>
          <label className="text-sm text-gray-600 lg:col-span-2">
            Search member
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company, owner, email..." />
            </div>
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
            <StatCard label="Total members" value={stats.total_members} />
            <StatCard label="Active" value={stats.active_members} className="bg-emerald-600" />
            <StatCard label="Umusanzu paid %" value={`${stats.paid_percentage || 0}%`} className="bg-sky-700" />
            <StatCard label="Growth rate" value={`${stats.growth_rate || 0}%`} className="bg-violet-600" />
            <StatCard label="Registration paid %" value={`${stats.registration_paid_percentage || 0}%`} className="bg-teal-700" />
            <StatCard label={`Paid in ${stats.selected_year || year}`} value={stats.selected_year_payments?.Paid || 0} className="bg-emerald-700" />
            <StatCard label="RWVCA role holders" value={stats.rwvca_role_count} className="bg-indigo-700" />
            <StatCard label="Inactive" value={stats.inactive_members} className="bg-gray-600" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="By category">
              <HBar items={(stats.by_category || []).map((row) => ({ label: row.name, value: row.count }))} />
            </ChartCard>
            <ChartCard title="Umusanzu status">
              <Donut items={(stats.by_status || []).map((row) => ({ label: row.membership_status || 'Unknown', value: row.count }))} />
            </ChartCard>
            <ChartCard title="Registration status">
              <Donut items={(stats.by_registration || []).map((row) => ({ label: row.registration_status || 'Unknown', value: row.count }))} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Gender">
              <Donut items={(stats.by_gender || []).map((row) => ({ label: row.gender || 'Unknown', value: row.count }))} />
            </ChartCard>
            <ChartCard title="Top provinces">
              <HBar items={(stats.by_province || []).map((row) => ({ label: row.province || row.name || 'Unknown', value: row.count }))} />
            </ChartCard>
            <ChartCard title="Top districts">
              <HBar items={(stats.by_district || []).slice(0, 10).map((row) => ({ label: row.district || row.name || 'Unknown', value: row.count }))} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={`Payments in ${stats.selected_year || year}`}>
              <Donut items={[
                { label: 'Paid', value: stats.selected_year_payments?.Paid || 0 },
                { label: 'Partial', value: stats.selected_year_payments?.Partial || 0 },
                { label: 'Not Paid', value: stats.selected_year_payments?.['Not Paid'] || 0 },
              ]} />
            </ChartCard>
            <ChartCard title="Member employees">
              <Donut items={[
                { label: 'Women', value: employees.women },
                { label: 'Men', value: employees.men },
                { label: 'PWD', value: employees.pwd },
              ]} />
            </ChartCard>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Members</h3>
            <DataTable
              columns={[
                { key: 'company_name', label: 'Company' },
                { key: 'owner_name', label: 'Owner' },
                { key: 'category', label: 'Category', render: (row) => row.platformCategory?.name || row.membership_category || '—' },
                { key: 'membership_status', label: 'Umusanzu', render: (row) => <StatusBadge value={row.membership_status} /> },
                { key: 'registration_status', label: 'Registration', render: (row) => <StatusBadge value={row.registration_status} /> },
                { key: 'province', label: 'Province' },
                { key: 'is_active', label: 'Active', render: (row) => Number(row.is_active) === 1 ? 'Yes' : 'No' },
              ]}
              rows={members}
              empty="No members match your filters"
              renderActions={(row) => (
                <button type="button" className="font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/members/${row.id}`)}>
                  View
                </button>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
