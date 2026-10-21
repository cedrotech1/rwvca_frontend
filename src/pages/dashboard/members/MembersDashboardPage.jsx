import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass, money } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { hasPrivilege } from '../../../utils/rwvcaAccess';
import { MemberNav } from './memberShared';

function pickAmounts(stats = {}) {
  const candidates = [
    stats.payment_amounts,
    stats.payment_totals,
    stats.amounts,
    stats.selected_year_amounts,
    stats.amount_summary,
  ].filter(Boolean);

  const fromNested = candidates[0] || {};
  return {
    amount_paid: Number(
      fromNested.amount_paid
      ?? fromNested.total_paid
      ?? stats.total_amount_paid
      ?? stats.amount_paid
      ?? 0
    ),
    amount_due: Number(
      fromNested.amount_due
      ?? fromNested.total_due
      ?? stats.total_amount_due
      ?? stats.amount_due
      ?? 0
    ),
    amount_partial: Number(
      fromNested.amount_partial
      ?? fromNested.partial_paid
      ?? stats.partial_amount_paid
      ?? 0
    ),
    by_year: Array.isArray(fromNested.by_year)
      ? fromNested.by_year
      : Array.isArray(stats.by_year_amounts)
        ? stats.by_year_amounts
        : [],
  };
}

export default function MembersDashboardPage() {
  const { user } = useAuth();
  const allowed = hasPrivilege(user, 'menu.members_dashboard')
    || hasPrivilege(user, 'members.dashboard')
    || hasPrivilege(user, 'menu.members');

  const [data, setData] = useState(null);
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (paymentYear) => {
    setLoading(true);
    try {
      const res = await api.get('/members/statistics', paymentYear ? { payment_year: paymentYear } : {});
      setData(res.data);
      setYear(String(res.data?.selected_year || paymentYear || ''));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load members dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load().catch(() => {});
  }, [allowed]);

  const stats = data || {};
  const amounts = useMemo(() => pickAmounts(stats), [stats]);
  const employees = stats.employees || { women: 0, men: 0, pwd: 0 };
  const hasPaymentMoney = amounts.amount_paid > 0 || amounts.amount_due > 0 || amounts.amount_partial > 0
    || amounts.by_year.length > 0
    || stats.total_amount_paid != null
    || stats.amount_paid != null;

  const yearPaymentRows = (stats.by_year_payments || []).map((row) => {
    const amountRow = amounts.by_year.find((a) => Number(a.year) === Number(row.year)) || {};
    return {
      ...row,
      amount_paid: amountRow.amount_paid ?? amountRow.paid ?? null,
      amount_due: amountRow.amount_due ?? amountRow.due ?? null,
    };
  });

  if (!allowed) {
    return (
      <PageHeading
        icon={<BarChart3 className="h-6 w-6" />}
        title="Members Dashboard"
        subtitle="Access denied"
        showBack
        backTo="/dashboard"
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<BarChart3 className="h-6 w-6" />}
        title="Members Dashboard"
        subtitle="Advanced membership and payment overview"
        actions={hasPaymentMoney ? [{
          label: 'Export year payments',
          icon: <Download className="h-4 w-4" />,
          onClick: () => exportCsv('members-year-payments', [
            { key: 'year', label: 'Year' },
            { key: 'Paid', label: 'Paid count' },
            { key: 'Partial', label: 'Partial count' },
            { key: 'Not Paid', label: 'Not paid count' },
            { key: 'total', label: 'Total' },
            { key: 'amount_paid', label: 'Amount paid' },
            { key: 'amount_due', label: 'Amount due' },
          ], yearPaymentRows),
        }] : []}
      />
      <MemberNav />

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 flex flex-wrap items-end gap-3">
        <label className="text-sm text-gray-600">
          Payment year
          <select
            className={`mt-1 ${inputClass}`}
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              load(e.target.value);
            }}
          >
            {(stats.available_years || []).map((item) => (
              <option key={item.id || item.year_value} value={item.year_value}>{item.year_value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total members" value={stats.total_members} hint={`+${stats.recent_members || 0} last 30 days`} />
        <StatCard label="Active members" value={stats.active_members} hint={`${stats.active_percentage || 0}%`} />
        <StatCard label="Umusanzu paid %" value={`${stats.paid_percentage || 0}%`} />
        <StatCard label="Growth rate" value={`${stats.growth_rate || 0}%`} />
        <StatCard label="Registration paid %" value={`${stats.registration_paid_percentage || 0}%`} />
        <StatCard label={`Paid count (${stats.selected_year || year})`} value={stats.selected_year_payments?.Paid || 0} />
        <StatCard label="RWVCA role holders" value={stats.rwvca_role_count} />
        <StatCard label="Inactive" value={stats.inactive_members} />
      </div>

      {hasPaymentMoney && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Amount paid" value={money(amounts.amount_paid)} hint="RWF" moneyLike />
          <StatCard label="Amount due" value={money(amounts.amount_due)} hint="RWF" moneyLike />
          <StatCard label="Partial amounts" value={money(amounts.amount_partial)} hint="RWF" moneyLike />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Members by category">
          <HBar items={(stats.by_category || []).map((row) => ({ label: row.name, value: row.count }))} />
        </ChartCard>
        <ChartCard title={`Membership status (Umusanzu ${stats.umusanzu_year || ''})`}>
          <Donut items={(stats.by_status || []).map((row) => ({ label: row.membership_status || 'Unknown', value: row.count }))} />
        </ChartCard>
        <ChartCard title="Registration status">
          <Donut items={(stats.by_registration || []).map((row) => ({ label: row.registration_status || 'Unknown', value: row.count }))} />
        </ChartCard>
        <ChartCard title={`Payments in ${stats.selected_year || year}`}>
          <Donut items={[
            { label: 'Paid', value: stats.selected_year_payments?.Paid || 0 },
            { label: 'Partial', value: stats.selected_year_payments?.Partial || 0 },
            { label: 'Not Paid', value: stats.selected_year_payments?.['Not Paid'] || 0 },
          ]} />
        </ChartCard>
        <ChartCard title="Gender distribution">
          <Donut items={(stats.by_gender || []).map((row) => ({ label: row.gender || 'Unknown', value: row.count }))} />
        </ChartCard>
        <ChartCard title="Employee statistics">
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div><p className="text-xs text-gray-500">Women</p><p className="text-2xl font-bold text-[#2f5d31]">{employees.women}</p></div>
            <div><p className="text-xs text-gray-500">Men</p><p className="text-2xl font-bold text-[#2f5d31]">{employees.men}</p></div>
            <div><p className="text-xs text-gray-500">PWD</p><p className="text-2xl font-bold text-[#2f5d31]">{employees.pwd}</p></div>
          </div>
          <Donut items={[
            { label: 'Women', value: employees.women },
            { label: 'Men', value: employees.men },
            { label: 'PWD', value: employees.pwd },
          ]} />
        </ChartCard>
        <ChartCard title="Top provinces">
          <HBar items={(stats.by_province || []).map((row) => ({ label: row.province || 'Unknown', value: row.count }))} />
        </ChartCard>
        <ChartCard title="Monthly registration trend">
          <HBar items={(stats.by_month || []).map((row) => ({ label: row.month, value: row.count }))} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Yearly payment summary">
          <DataTable
            empty="No year payment data"
            columns={[
              { key: 'year', label: 'Year' },
              { key: 'Paid', label: 'Paid' },
              { key: 'Partial', label: 'Partial' },
              { key: 'Not Paid', label: 'Not paid' },
              { key: 'total', label: 'Total' },
              ...(hasPaymentMoney ? [
                { key: 'amount_paid', label: 'Amt paid', value: (r) => (r.amount_paid != null ? money(r.amount_paid) : '—') },
                { key: 'amount_due', label: 'Amt due', value: (r) => (r.amount_due != null ? money(r.amount_due) : '—') },
              ] : []),
            ]}
            rows={yearPaymentRows}
          />
        </ChartCard>
        <ChartCard title="Top districts">
          <DataTable
            empty="No district data"
            columns={[
              { key: 'district', label: 'District', value: (r) => r.district || '—' },
              { key: 'count', label: 'Members' },
              { key: 'percent', label: '%', value: (r) => `${r.percent ?? 0}%` },
              { key: 'level', label: 'Level', value: (r) => <StatusBadge value={r.level} /> },
            ]}
            rows={stats.by_district || []}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, moneyLike }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 font-bold text-[#2f5d31] ${moneyLike ? 'text-2xl' : 'text-3xl'}`}>{value ?? 0}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Donut({ items }) {
  const colors = ['#2f5d31', '#0f766e', '#c2410c', '#7c3aed', '#ca8a04'];
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
        <circle r="15.915" cx="18" cy="18" fill="transparent" stroke="#e5e7eb" strokeWidth="3" />
        {items.map((item, index) => {
          const pctValue = Number(item.value || 0) / total;
          const dash = `${pctValue * 100} ${100 - pctValue * 100}`;
          const circle = (
            <circle key={item.label} r="15.915" cx="18" cy="18" fill="transparent" stroke={colors[index % colors.length]} strokeWidth="3" strokeDasharray={dash} strokeDashoffset={-offset * 100} />
          );
          offset += pctValue;
          return circle;
        })}
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

function HBar({ items }) {
  const max = Math.max(1, ...items.map((item) => Number(item.value || 0)));
  if (!items.length) return <p className="text-sm text-gray-400">No data</p>;
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
