import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { StatusBadge, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { MemberNav } from './memberShared';

export default function MemberStatisticsPage() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const load = async (paymentYear) => {
    try {
      const res = await api.get('/members/statistics', paymentYear ? { payment_year: paymentYear } : {});
      setData(res.data);
      setYear(String(res.data?.selected_year || ''));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load statistics');
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const stats = data || {};
  const employees = stats.employees || { women: 0, men: 0, pwd: 0 };

  return (
    <div className="space-y-4">
      <PageHeading title="Membership statistics" subtitle="Members, umusanzu, registration, and growth" icon={<BarChart3 className="h-6 w-6" />} />
      <MemberNav />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-gray-600">
          Payment year
          <select className={`mt-1 ${inputClass}`} value={year} onChange={(e) => { setYear(e.target.value); load(e.target.value); }}>
            {(stats.available_years || []).map((item) => (
              <option key={item.id} value={item.year_value}>{item.year_value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total members" value={stats.total_members} hint={`+${stats.recent_members || 0} last 30 days`} />
        <StatCard label="Active members" value={stats.active_members} hint={`${stats.active_percentage || 0}% of total`} />
        <StatCard label="Umusanzu paid %" value={`${stats.paid_percentage || 0}%`} hint={`Umusanzu ${stats.umusanzu_year || 2025}`} />
        <StatCard label="Growth rate" value={`${stats.growth_rate || 0}%`} hint="This year vs last year" />
        <StatCard label="Registration paid %" value={`${stats.registration_paid_percentage || 0}%`} />
        <StatCard label={`Paid in ${stats.selected_year || year}`} value={stats.selected_year_payments?.Paid || 0} />
        <StatCard label="RWVCA role holders" value={stats.rwvca_role_count} />
        <StatCard label="Inactive" value={stats.inactive_members} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Members by category">
          <HBar items={(stats.by_category || []).map((row) => ({ label: row.name, value: row.count }))} />
        </ChartCard>
        <ChartCard title={`Membership status (Umusanzu ${stats.umusanzu_year || 2025})`}>
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
        <ChartCard title="Annual payments by year">
          <div className="space-y-3">
            {(stats.by_year_payments || []).map((row) => (
              <div key={row.year}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{row.year}</span>
                  <span>{row.total}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
                  <div className="h-full bg-emerald-600" style={{ width: `${pct(row.Paid, row.total)}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${pct(row.Partial, row.total)}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${pct(row['Not Paid'], row.total)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Monthly registration trend">
          <HBar items={(stats.by_month || []).map((row) => ({ label: row.month, value: row.count }))} />
        </ChartCard>
        <ChartCard title="Top provinces">
          <HBar items={(stats.by_province || []).map((row) => ({ label: row.province || 'Unknown', value: row.count }))} />
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
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Yearly payment summary">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="py-2">Year</th><th>Paid</th><th>Partial</th><th>Not Paid</th><th>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.by_year_payments || []).map((row) => (
                <tr key={row.year}>
                  <td className="py-2 font-medium">{row.year}</td>
                  <td>{row.Paid}</td>
                  <td>{row.Partial}</td>
                  <td>{row['Not Paid']}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
        <ChartCard title="Top districts">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="py-2">#</th><th>District</th><th>Members</th><th>%</th><th>Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.by_district || []).map((row, index) => (
                <tr key={row.district || index}>
                  <td className="py-2">{index + 1}</td>
                  <td>{row.district || '—'}</td>
                  <td>{row.count}</td>
                  <td>{row.percent}%</td>
                  <td><StatusBadge value={row.level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </div>
  );
}

function pct(value, total) {
  if (!total) return 0;
  return (Number(value || 0) / Number(total)) * 100;
}

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm ring-1 ring-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-[#2f5d31] mt-1">{value ?? 0}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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
