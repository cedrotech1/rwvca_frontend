import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canSeeMembershipAnalysis } from '../../../utils/rwvcaAccess';
import { AnalysisAccessDenied, ChartCard, Donut, HBar, StatCard, inputClass } from './analysisShared';
import { DISTRICTS, MONTHS, YEARS } from '../workflow/membershipReportShared';

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
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
    params.year = filters.yearly_year || undefined;
    params.start_date = filters.start_date;
    params.end_date = filters.end_date;
  }
  return cleanParams(params);
}

const emptyFilters = {
  search: '',
  report_type: '',
  location: '',
  start_date: '',
  end_date: '',
  monthly_month: MONTHS[new Date().getMonth()],
  yearly_year: String(new Date().getFullYear()),
  quarter: '',
};

export default function MembershipAnalysisPage() {
  const { user } = useAuth();
  const allowed = canSeeMembershipAnalysis(user?.role);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  const load = async (nextFilters = filters) => {
    if (!allowed) return;
    setLoading(true);
    try {
      const res = await api.get('/membership-reports/analytics', periodParams(nextFilters));
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
  }, [allowed]);

  if (!allowed) return <AnalysisAccessDenied label="Membership analysis" />;

  const summary = data?.summary || {};
  const locationChoices = data?.locations?.length ? data.locations : DISTRICTS;
  const typeLabel = filters.report_type || 'All types';
  const locationLabel = filters.location || 'All locations';

  return (
    <div className="space-y-6">
      <PageHeading
        title="Membership Analysis"
        subtitle="Timber, VAT, and membership fees by report type, location, and period"
        icon={<TrendingUp className="h-6 w-6" />}
        showBack
        backTo="/dashboard"
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
        >
          <label className="text-sm text-gray-600">
            Type
            <select
              className={`mt-1 ${inputClass}`}
              value={filters.report_type}
              onChange={(e) => setField('report_type', e.target.value)}
            >
              <option value="">All types</option>
              {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Location
            <select
              className={`mt-1 ${inputClass}`}
              value={filters.location}
              onChange={(e) => setField('location', e.target.value)}
            >
              <option value="">All locations</option>
              {locationChoices.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          {(!filters.report_type || filters.report_type === 'DAILY') && (
            <label className="text-sm text-gray-600">
              {filters.report_type === 'DAILY' ? 'Date' : 'From'}
              <input
                type="date"
                className={`mt-1 ${inputClass}`}
                value={filters.start_date}
                onChange={(e) => setField('start_date', e.target.value)}
              />
            </label>
          )}

          {filters.report_type === 'WEEKLY' && (
            <>
              <label className="text-sm text-gray-600">
                Week start
                <input
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={filters.start_date}
                  onChange={(e) => setField('start_date', e.target.value)}
                />
              </label>
              <label className="text-sm text-gray-600">
                Week end
                <input
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={filters.end_date}
                  onChange={(e) => setField('end_date', e.target.value)}
                />
              </label>
            </>
          )}

          {!filters.report_type && (
            <label className="text-sm text-gray-600">
              To
              <input
                type="date"
                className={`mt-1 ${inputClass}`}
                value={filters.end_date}
                onChange={(e) => setField('end_date', e.target.value)}
              />
            </label>
          )}

          {filters.report_type === 'MONTHLY' && (
            <>
              <label className="text-sm text-gray-600">
                Month
                <select
                  className={`mt-1 ${inputClass}`}
                  value={filters.monthly_month}
                  onChange={(e) => setField('monthly_month', e.target.value)}
                >
                  {MONTHS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Year
                <select
                  className={`mt-1 ${inputClass}`}
                  value={filters.yearly_year}
                  onChange={(e) => setField('yearly_year', e.target.value)}
                >
                  {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </>
          )}

          {filters.report_type === 'QUARTERLY' && (
            <>
              <label className="text-sm text-gray-600">
                Quarter
                <select
                  className={`mt-1 ${inputClass}`}
                  value={filters.quarter}
                  onChange={(e) => setField('quarter', e.target.value)}
                >
                  <option value="">All quarters</option>
                  <option value="1">Quarter 1 (Jan-Mar)</option>
                  <option value="2">Quarter 2 (Apr-Jun)</option>
                  <option value="3">Quarter 3 (Jul-Sep)</option>
                  <option value="4">Quarter 4 (Oct-Dec)</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Year
                <select
                  className={`mt-1 ${inputClass}`}
                  value={filters.yearly_year}
                  onChange={(e) => setField('yearly_year', e.target.value)}
                >
                  {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </>
          )}

          {filters.report_type === 'YEARLY' && (
            <label className="text-sm text-gray-600">
              Year
              <select
                className={`mt-1 ${inputClass}`}
                value={filters.yearly_year}
                onChange={(e) => setField('yearly_year', e.target.value)}
              >
                {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          )}

          {!filters.report_type && (
            <label className="text-sm text-gray-600">
              Year
              <select
                className={`mt-1 ${inputClass}`}
                value={filters.yearly_year}
                onChange={(e) => setField('yearly_year', e.target.value)}
              >
                {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          )}

          <label className="text-sm text-gray-600">
            Search
            <input
              className={`mt-1 ${inputClass}`}
              value={filters.search}
              onChange={(e) => setField('search', e.target.value)}
              placeholder="Report title..."
            />
          </label>

          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">
              {loading ? 'Loading...' : 'Apply filters'}
            </button>
            <button
              type="button"
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700"
              onClick={() => {
                const next = { ...emptyFilters };
                setFilters(next);
                load(next).catch(() => {});
              }}
            >
              Reset
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-gray-500">
          Showing <strong>{typeLabel}</strong> · <strong>{locationLabel}</strong>
          {loading ? ' · updating…' : ''}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Reports" value={summary.reports} />
            <StatCard label="Total timber" value={money(summary.total_timber)} className="bg-[#2f5d31]" />
            <StatCard label="Weekly reports" value={summary.weekly_reports} className="bg-sky-700" />
            <StatCard label="Monthly reports" value={summary.monthly_reports} className="bg-[#6b4423]" />
            <StatCard label="Membership fees" value={money(summary.total_membership_fees)} className="bg-emerald-600" />
            <StatCard label="Total VAT" value={money(summary.total_vat)} className="bg-amber-600" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="By status"><Donut items={data.by_status || []} /></ChartCard>
            <ChartCard title="By type (all)"><Donut items={data.by_type || []} /></ChartCard>
            <ChartCard title="Top officers">
              <HBar items={(data.top_officers || []).map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Timber types">
              <HBar items={(data.by_timber_type || []).map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              />
            </ChartCard>
            <ChartCard title="Payment methods">
              <HBar items={data.by_payment_method || []} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
