import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FileText, CheckCircle, XCircle, AlertCircle, Users, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, subtitle }) => (
  <div className="bg-white rounded-lg p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, emptyMessage }) => (
  <div className="bg-white rounded-lg p-5">
    <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="h-72">{children}</div>
    {emptyMessage && (
      <p className="text-sm text-gray-500 text-center mt-2">{emptyMessage}</p>
    )}
  </div>
);

const objectToChartData = (obj = {}) =>
  Object.entries(obj).map(([name, value]) => ({ name, value }));

export const LogsStatsSection = ({ statistics, loading }) => {
  if (loading && !statistics) {
    return (
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-white rounded-lg animate-pulse" />
          <div className="h-80 bg-white rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!statistics) return null;

  const userChartData = (statistics.logsByUser || []).map((item) => ({
    name: item.userName?.length > 14 ? `${item.userName.slice(0, 14)}…` : item.userName,
    fullName: item.userName,
    count: item.count,
  }));

  const dateChartData = (statistics.logsByDate || []).map((item) => ({
    date: item.date ? String(item.date).slice(5) : '',
    count: item.count,
  }));

  const moduleChartData = objectToChartData(statistics.logsByModule);

  const total = statistics.totalLogs || 0;
  const successPct = total ? Math.round((statistics.successfulLogs / total) * 100) : 0;

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Logs"
          value={total}
          subtitle={`${statistics.successfulLogs || 0} successful`}
          icon={FileText}
          iconBg="bg-[#2f5d31]/10"
          iconColor="text-[#2f5d31]"
        />
        <StatCard
          title="Successful"
          value={statistics.successfulLogs || 0}
          subtitle={`${successPct}% of total`}
          icon={CheckCircle}
          iconBg="bg-green-100"
          iconColor="text-green-700"
        />
        <StatCard
          title="Failed"
          value={statistics.failedLogs || 0}
          icon={XCircle}
          iconBg="bg-red-100"
          iconColor="text-red-700"
        />
        <StatCard
          title="Warnings"
          value={statistics.warningLogs || 0}
          icon={AlertCircle}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Logs by User (top 10)">
          {userChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userChartData} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [value, 'Logs']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                />
                <Bar dataKey="count" fill="#2f5d31" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <Users className="h-8 w-8 mr-2 opacity-40" />
              No user activity yet
            </div>
          )}
        </ChartCard>

        <ChartCard title="Logs by Module">
          {moduleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleChartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [value, 'Logs']} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No module data
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Daily Activity (last 30 days)">
        {dateChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dateChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [value, 'Logs']} labelFormatter={(l) => `Date: ${l}`} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2f5d31"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2f5d31' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <TrendingUp className="h-8 w-8 mr-2 opacity-40" />
            No activity in the last 30 days
          </div>
        )}
      </ChartCard>
    </div>
  );
};

export default LogsStatsSection;
