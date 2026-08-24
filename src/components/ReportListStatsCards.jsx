import { FileText, Eye, EyeOff, Upload } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  </div>
);

export const ReportListStatsCards = ({ stats, loading, filterLabel }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const total = stats.totalReports || 0;

  return (
    <div className="mb-6">
      {filterLabel && (
        <p className="text-sm text-gray-500 mb-3">
          Statistics for current filters · {filterLabel}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={total}
          subtitle={`${stats.publishedReports} published · ${stats.draftReports} drafts`}
          icon={FileText}
          iconBg="bg-[#2f5d31]/10"
          iconColor="text-[#2f5d31]"
        />
        <StatCard
          title="Published"
          value={stats.publishedReports}
          subtitle={total ? `${stats.publishedPercentage}% of filtered results` : 'No matching reports'}
          icon={Eye}
          iconBg="bg-green-100"
          iconColor="text-green-700"
        />
        <StatCard
          title="Drafts"
          value={stats.draftReports}
          subtitle={total ? `${stats.draftPercentage}% of filtered results` : 'No matching reports'}
          icon={EyeOff}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-700"
        />
        <StatCard
          title="File Reports"
          value={stats.fileReports}
          subtitle={`${stats.dataReports} table · ${stats.textReports} text`}
          icon={Upload}
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
        />
      </div>
    </div>
  );
};

export default ReportListStatsCards;
