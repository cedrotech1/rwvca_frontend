import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canSeeRequisitionAnalysis } from '../../../utils/rwvcaAccess';
import { AnalysisAccessDenied, ChartCard, Donut, HBar, StatCard, YearFilter, DataTable, StatusBadge } from './analysisShared';
import { formatPhpDateTime } from '../workflow/helpers';

export default function RequisitionAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = canSeeRequisitionAnalysis(user?.role);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const res = await api.get('/requisitions/analytics', { year });
      setData(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load requisition analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load().catch(() => {});
  }, [year, allowed]);

  if (!allowed) return <AnalysisAccessDenied label="Requisition analysis" />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <PageHeading
        title="Requisition Analysis"
        subtitle="Analyze requisition data and spending trends"
        icon={<BarChart3 className="h-6 w-6" />}
        showBack
        backTo="/dashboard"
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <YearFilter
          year={year}
          onChange={setYear}
          extra={<p className="text-xs text-gray-500 pb-2">{loading ? 'Loading...' : 'Organization requisition insights for the selected year.'}</p>}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Requisitions" value={summary.requisitions} />
            <StatCard label="Pending" value={summary.pending} className="bg-amber-600" />
            <StatCard label="Total amount" value={`RWF ${Number(summary.amount_total || 0).toLocaleString()}`} className="bg-emerald-600" />
            <StatCard label="Pending amount" value={`RWF ${Number(summary.amount_pending || 0).toLocaleString()}`} className="bg-rose-600" />
            <StatCard label="Requesters" value={summary.requesters} className="bg-sky-700" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="By status"><Donut items={data.by_status} /></ChartCard>
            <ChartCard title="Finance status"><Donut items={data.by_finance_status} /></ChartCard>
            <ChartCard title="Top requesters"><HBar items={(data.top_requesters || []).map((item) => ({ label: item.label, value: item.value }))} /></ChartCard>
          </div>

          <ChartCard title="By department">
            <HBar items={data.by_department} />
          </ChartCard>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Recent requisitions</h3>
            <DataTable
              columns={[
                { key: 'id', label: '#', render: (row, idx) => idx + 1 },
                { key: 'preparer', label: 'Prepared by' },
                { key: 'department', label: 'Department' },
                { key: 'total_amount_requested', label: 'Amount', render: (row) => Number(row.total_amount_requested || 0).toLocaleString() },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
                { key: 'created_at', label: 'Date', render: (row) => formatPhpDateTime(row.created_at) },
              ]}
              rows={data.recent || []}
              empty="No requisitions in this period"
              renderActions={(row) => (
                <button type="button" className="font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/requisitions/${row.id}`)}>View</button>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
