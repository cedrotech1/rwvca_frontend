import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canSeeMembershipAnalysis } from '../../../utils/rwvcaAccess';
import { AnalysisAccessDenied, ChartCard, Donut, HBar, StatCard, YearFilter, DataTable, StatusBadge, inputClass } from './analysisShared';
import { formatPhpDateTime } from '../workflow/helpers';

export default function MembershipAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = canSeeMembershipAnalysis(user?.role);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const res = await api.get('/membership-reports/analytics', {
        year,
        search: search || undefined,
        report_type: reportType || undefined,
      });
      setData(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load membership analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load().catch(() => {});
  }, [year, allowed]);

  if (!allowed) return <AnalysisAccessDenied label="Membership analysis" />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <PageHeading
        title="Membership Analysis"
        subtitle="Analyze membership growth and categories"
        icon={<TrendingUp className="h-6 w-6" />}
        showBack
        backTo="/dashboard"
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <YearFilter year={year} onChange={setYear} />
          <label className="text-sm text-gray-600">
            Type
            <select className={`mt-1 ${inputClass}`} value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="">All types</option>
              {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Search
            <input className={`mt-1 ${inputClass}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Report title..." />
          </label>
          <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">
            {loading ? 'Loading...' : 'Apply filters'}
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Reports" value={summary.reports} />
            <StatCard label="Pending" value={summary.pending} className="bg-amber-600" />
            <StatCard label="Approved" value={summary.approved} className="bg-emerald-600" />
            <StatCard label="Officers" value={summary.officers} className="bg-sky-700" />
            <StatCard label="Payments (RWF)" value={Number(summary.amount_total || 0).toLocaleString()} className="bg-violet-600" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="By status"><Donut items={data.by_status} /></ChartCard>
            <ChartCard title="By type"><Donut items={data.by_type} /></ChartCard>
            <ChartCard title="Top officers"><HBar items={data.top_officers} /></ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Locations"><HBar items={data.by_location} /></ChartCard>
            <ChartCard title="Payment methods"><HBar items={data.by_payment_method} /></ChartCard>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Recent reports</h3>
            <DataTable
              columns={[
                { key: 'id', label: '#', render: (row, idx) => idx + 1 },
                { key: 'title', label: 'Title' },
                { key: 'officer', label: 'Officer' },
                { key: 'report_type', label: 'Type' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
                { key: 'created_at', label: 'Date', render: (row) => formatPhpDateTime(row.created_at) },
              ]}
              rows={data.recent || []}
              empty="No reports in this period"
              renderActions={(row) => (
                <button type="button" className="font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/membership-reports/${row.id}`)}>View</button>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
