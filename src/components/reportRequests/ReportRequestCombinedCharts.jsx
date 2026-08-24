import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#2f5d31', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

const ChartCard = ({ title, children, tall = false }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h4 className="mb-4 text-sm font-semibold text-gray-900">{title}</h4>
    <div className={`w-full ${tall ? 'h-[360px]' : 'h-72'}`}>{children}</div>
  </div>
);

const formatTooltip = (value) => {
  if (value == null || Number.isNaN(value)) return '—';
  if (Number.isInteger(value)) return value.toLocaleString();
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Charts for HQ combined view — table-format requests only.
 */
export const ReportRequestCombinedCharts = ({ charts, submissionFormat }) => {
  if (submissionFormat !== 'table' || !charts?.enabled) {
    return null;
  }

  const { campusComparison, byField, calculations, selectDistributions } = charts;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[#2f5d31]" />
        <h4 className="text-base font-semibold text-gray-900">Charts & visual analysis</h4>
        <span className="rounded-full bg-[#2f5d31]/10 px-2 py-0.5 text-xs font-medium text-[#2f5d31]">
          Table report
        </span>
      </div>

      {calculations?.length > 0 && (
        <ChartCard title="Overall calculations (all campuses)">
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={calculations} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: '#6B7280', fontSize: 11 }}
              />
              <Tooltip formatter={(v) => formatTooltip(v)} />
              <Bar dataKey="value" fill="#2f5d31" radius={[0, 4, 4, 0]} name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {campusComparison?.data?.length > 0 && campusComparison.fields?.length > 0 && (
        <ChartCard title="Campus comparison — all numeric columns" tall>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={campusComparison.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                interval={0}
                angle={campusComparison.data.length > 4 ? -25 : 0}
                textAnchor={campusComparison.data.length > 4 ? 'end' : 'middle'}
                height={campusComparison.data.length > 4 ? 72 : 40}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip formatter={(v) => formatTooltip(v)} />
              <Legend wrapperStyle={{ paddingTop: 12 }} iconType="rect" />
              {campusComparison.fields.map((field, index) => (
                <Bar
                  key={field.key}
                  dataKey={field.key}
                  name={field.label}
                  fill={COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {byField?.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {byField.map((series, seriesIndex) => (
            <ChartCard key={series.fieldKey} title={`${series.label} — by campus`}>
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={series.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    interval={0}
                    angle={series.data.length > 3 ? -20 : 0}
                    textAnchor={series.data.length > 3 ? 'end' : 'middle'}
                    height={series.data.length > 3 ? 64 : 36}
                  />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatTooltip(v)} />
                  <Bar
                    dataKey="value"
                    name={series.label}
                    fill={COLORS[seriesIndex % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
        </div>
      )}

      {selectDistributions?.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {selectDistributions.map((dist, distIndex) => (
            <ChartCard key={dist.fieldKey} title={`${dist.label} — distribution`}>
              <ResponsiveContainer width="100%" height={288}>
                <PieChart>
                  <Pie
                    data={dist.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {dist.data.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={COLORS[(distIndex + index) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatTooltip(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReportRequestCombinedCharts;
