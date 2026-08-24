import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Building, TrendingUp } from 'lucide-react';
import { formatCampusDisplayName } from '../utils/reportPermissions';

const COLORS = ['#2f5d31', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const ChartLoading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2f5d31] border-t-transparent" />
  </div>
);

const ChartCard = ({ title, children, tall = false }) => (
  <div className="bg-white rounded-lg p-5">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className={`w-full ${tall ? 'min-h-[360px]' : 'h-80'}`}>
      {children}
    </div>
  </div>
);

export const ReportsByCampusChart = ({ statistics, loading }) => {
  // Use services.byCampus data since campusOverview is empty, but group by campus to avoid duplicates
  const rawCampusData = statistics?.services?.byCampus || [];
  const campusMap = new Map();

  // Group data by campus
  rawCampusData.forEach(item => {
    const campusKey = formatCampusDisplayName(item.campusName, item.campusId);
    if (!campusMap.has(campusKey)) {
      campusMap.set(campusKey, {
        campusName: campusKey,
        reportCount: 0,
        totalRows: 0,
        publishedReports: 0
      });
    }
    
    const campus = campusMap.get(campusKey);
    campus.reportCount += item.reportCount || 0;
    campus.totalRows += item.totalRows || 0;
  });

  const campusData = Array.from(campusMap.values());

  if (loading) {
    return (
      <ChartCard title="Reports by Campus">
        <ChartLoading />
      </ChartCard>
    );
  }

  if (!statistics || campusData.length === 0) {
    return (
      <ChartCard title="Reports by Campus">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No campus data available</p>
          </div>
        </div>
      </ChartCard>
    );
  }

  // Transform data for chart
  const chartData = campusData.map(item => ({
    name: formatCampusDisplayName(item.campusName, item.campusId),
    value: item.reportCount || 0,
    totalRows: item.totalRows || 0,
    publishedReports: item.publishedReports || 0
  }));

  return (
    <ChartCard title="Reports by Campus">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar dataKey="value" fill="#2f5d31" radius={[4, 4, 0, 0]} name="Total Reports" />
          <Bar dataKey="publishedReports" fill="#10B981" radius={[4, 4, 0, 0]} name="Published" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const ServicesDistributionChart = ({ statistics, loading }) => {
  const servicesData = statistics?.services?.overall || [];

  if (loading) {
    return (
      <ChartCard title="Services Distribution" tall>
        <ChartLoading />
      </ChartCard>
    );
  }

  if (!statistics || servicesData.length === 0) {
    return (
      <ChartCard title="Services Distribution" tall>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No service data available</p>
          </div>
        </div>
      </ChartCard>
    );
  }

  const chartData = servicesData.map((service, index) => ({
    name: service.serviceName || 'Unknown Service',
    value: service.reportCount || 0,
    totalRows: service.totalRows || 0,
    fill: COLORS[index % COLORS.length],
  }));

  const chartHeight = Math.max(360, chartData.length * 40);

  return (
    <div className="bg-white rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Services Distribution</h3>
      <p className="text-sm text-gray-500 mb-4">
        {chartData.length} service{chartData.length !== 1 ? 's' : ''} — scroll to see all
      </p>
      <div className="w-full overflow-y-auto pr-2" style={{ maxHeight: 480 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={{ fill: '#374151', fontSize: 11 }}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                maxWidth: 320,
              }}
              formatter={(value, _name, props) => [
                `${value} report${value !== 1 ? 's' : ''}`,
                props?.payload?.name || 'Service',
              ]}
            />
            <Bar dataKey="value" name="Reports" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`svc-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CampusTimeSeriesChart = ({ statistics, loading }) => {
  const timeStatsData = statistics?.charts?.timeStats || [];

  if (loading) {
    return (
      <ChartCard title="Campus Trends Over Time">
        <ChartLoading />
      </ChartCard>
    );
  }

  if (!statistics || timeStatsData.length === 0) {
    return (
      <ChartCard title="Campus Trends Over Time">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No time series data available</p>
          </div>
        </div>
      </ChartCard>
    );
  }

  // Use timeStats data directly since campusTimeSeries is empty
  const mergedData = timeStatsData.map(item => ({
    date: item.label,
    'Total Reports': item.totalReports,
    'Published': item.publishedReports,
    'File Reports': item.fileReports
  }));

  const campusNames = ['Total Reports', 'Published', 'File Reports'];

  return (
    <ChartCard title="Campus Trends Over Time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {campusNames.map((campus, index) => (
            <Line 
              key={campus}
              type="monotone" 
              dataKey={campus} 
              stroke={COLORS[index % COLORS.length]} 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};


export const AcademicYearByCampusChart = ({ statistics, loading }) => {
  const chartData = statistics?.academicYears?.byCampus || [];

  if (loading) {
    return (
      <ChartCard title="Reports by Campus & Academic Year">
        <ChartLoading />
      </ChartCard>
    );
  }

  if (!chartData.length) {
    return (
      <ChartCard title="Reports by Campus & Academic Year">
        <div className="flex items-center justify-center h-full text-gray-500">
          No academic year data available
        </div>
      </ChartCard>
    );
  }

  const grouped = chartData.reduce((acc, item) => {
    const label = formatCampusDisplayName(item.campusName, item.campusId);
    if (!acc[label]) {
      acc[label] = { name: label };
    }
    acc[label][item.academicYearLabel] = item.reportCount;
    return acc;
  }, {});

  const data = Object.values(grouped);
  const yearKeys = [...new Set(chartData.map((item) => item.academicYearLabel))];

  return (
    <ChartCard title="Reports by Campus & Academic Year">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {yearKeys.map((year, index) => (
            <Bar key={year} dataKey={year} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const ChartsSection = ({ statistics, loading }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <ReportsByCampusChart statistics={statistics} loading={loading} />
    <ServicesDistributionChart statistics={statistics} loading={loading} />
    <CampusTimeSeriesChart statistics={statistics} loading={loading} />
    <AcademicYearByCampusChart statistics={statistics} loading={loading} />
  </div>
);
