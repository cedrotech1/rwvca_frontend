import { Monitor, FileText, Users, TrendingUp } from 'lucide-react';

const MetricCard = ({ title, value, icon, accentClass, subtitle }) => (
  <div className="bg-white rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 ${accentClass} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

export const MetricsCards = ({ statistics, loading }) => {

  if (loading || !statistics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  // Use overview if available, otherwise use statistics directly or provide defaults
  const overview = statistics.overview || statistics || {
    totalReports: 0,
    publishedReports: 0,
    draftReports: 0,
    totalRows: 0,
    avgRowsPerReport: 0
  };

  const metrics = [
    {
      title: 'Total Reports',
      value: (overview.totalReports || 0).toLocaleString(),
      subtitle: `${overview.publishedReports || 0} published`,
      icon: <FileText size={24} className="text-[#2f5d31]" />,
      accentClass: 'bg-[#2f5d31]/10'
    },
    {
      title: 'Published',
      value: (overview.publishedReports || 0).toLocaleString(),
      subtitle: `${Math.round(((overview.publishedReports || 0) / (overview.totalReports || 1)) * 100) || 0}% of total`,
      icon: <TrendingUp size={24} className="text-green-600" />,
      accentClass: 'bg-green-50'
    },
    {
      title: 'Draft Reports',
      value: (overview.draftReports || 0).toLocaleString(),
      subtitle: `${Math.round(((overview.draftReports || 0) / (overview.totalReports || 1)) * 100) || 0}% of total`,
      icon: <Monitor size={24} className="text-yellow-600" />,
      accentClass: 'bg-yellow-50'
    },
    {
      title: 'Data Rows',
      value: (overview.totalRows || 0).toLocaleString(),
      subtitle: `Avg: ${overview.avgRowsPerReport || 0} per report`,
      icon: <Users size={24} className="text-purple-600" />,
      accentClass: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          accentClass={metric.accentClass}
        />
      ))}
    </div>
  );
};
