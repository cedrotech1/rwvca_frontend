import React from 'react';
import { Building, Users, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCampusDisplayName } from '../utils/reportPermissions';

const CampusCard = ({ campus, index }) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
  const bgColor = colors[index % colors.length];

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center mr-3`}>
            <Building size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{campus.campusName}</h3>
            <p className="text-sm text-gray-500">Campus ID: {campus.campusId}</p>
          </div>
        </div>
        <div className={`px-3 py-1 ${bgColor} text-white rounded-full text-sm font-medium`}>
          {campus.statistics.totalReports} Reports
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <FileText size={16} className="text-gray-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{campus.statistics.totalReports}</p>
          <p className="text-xs text-gray-600">{campus.statistics.totalRows} rows</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-xs text-gray-500">Published</span>
          </div>
          <p className="text-lg font-semibold text-green-600">{campus.statistics.publishedReports}</p>
          <p className="text-xs text-gray-600">{Math.round((campus.statistics.publishedReports / campus.statistics.totalReports) * 100) || 0}%</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <BarChart3 size={16} className="text-yellow-600" />
            <span className="text-xs text-gray-500">Draft</span>
          </div>
          <p className="text-lg font-semibold text-yellow-600">{campus.statistics.draftReports}</p>
          <p className="text-xs text-gray-600">{Math.round((campus.statistics.draftReports / campus.statistics.totalReports) * 100) || 0}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Users size={16} className="text-purple-600" />
            <span className="text-xs text-gray-500">Avg Rows</span>
          </div>
          <p className="text-lg font-semibold text-purple-600">{campus.statistics.avgRowsPerReport}</p>
          <p className="text-xs text-gray-600">per report</p>
        </div>
      </div>

      {/* Services */}
      {campus.services && campus.services.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Services ({campus.services.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {campus.services.map((service, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate flex-1">{service.serviceName}</span>
                <span className="text-gray-900 font-medium ml-2">{service.reportCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {campus.categories && campus.categories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categories ({campus.categories.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {campus.categories.map((category, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate flex-1">{category.categoryName}</span>
                <span className="text-gray-900 font-medium ml-2">{category.reportCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CampusBreakdown = ({ statistics, loading }) => {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('CampusBreakdown - statistics:', statistics);
    console.log('CampusBreakdown - loading:', loading);
  }

  if (loading || !statistics) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Campus Breakdown</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-40"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const buildCampusesFromServices = () => {
    const rawCampusData = statistics?.services?.byCampus || [];
    const campusMap = new Map();

    rawCampusData.forEach((item) => {
      const campusKey = formatCampusDisplayName(item.campusName, item.campusId);
      if (!campusMap.has(campusKey)) {
        campusMap.set(campusKey, {
          campusId: item.campusId ?? campusKey,
          campusName: campusKey,
          totalReports: 0,
          totalRows: 0,
          publishedReports: 0,
          services: [],
          categories: [],
        });
      }

      const campus = campusMap.get(campusKey);
      campus.totalReports += item.reportCount;
      campus.totalRows += item.totalRows;
      campus.services.push({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        reportCount: item.reportCount,
        totalRows: item.totalRows,
      });
    });

    const categoriesData = statistics?.categories?.byCampus || [];
    categoriesData.forEach((item) => {
      const campusKey = formatCampusDisplayName(item.campusName, item.campusId);
      if (campusMap.has(campusKey)) {
        campusMap.get(campusKey).categories.push({
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          reportCount: item.reportCount,
          totalRows: item.totalRows,
        });
      }
    });

    return Array.from(campusMap.values()).map((campus) => ({
      campusId: campus.campusId,
      campusName: campus.campusName,
      statistics: {
        totalReports: campus.totalReports,
        totalRows: campus.totalRows,
        publishedReports: campus.publishedReports,
        draftReports: campus.totalReports,
        archivedReports: 0,
        fileReports: 0,
        dataReports: campus.totalReports,
        avgRowsPerReport: campus.totalReports > 0 ? Math.round(campus.totalRows / campus.totalReports) : 0,
        maxRowsInReport: campus.totalRows,
        minRowsInReport: 0,
      },
      services: campus.services,
      categories: campus.categories,
    }));
  };

  const campuses = statistics?.campuses?.overview?.length
    ? statistics.campuses.overview.map((campus) => ({
        campusId: campus.campusId,
        campusName: formatCampusDisplayName(campus.campusName, campus.campusId),
        statistics: campus.statistics,
        services: campus.services || [],
        categories: campus.categories || [],
      }))
    : buildCampusesFromServices();

  if (!campuses || campuses.length === 0) {
    return (
      <div className="rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Campus Breakdown</h2>
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">No campus data available</p>
          <p className="text-sm text-gray-400 mt-1">Campus statistics will appear once reports are created</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campuses</p>
              <p className="text-2xl font-bold text-gray-900">{campuses.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-blue-600">
              <Building size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {campuses.reduce((sum, campus) => sum + (campus.services?.length || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {campuses.reduce((sum, campus) => sum + (campus.categories?.length || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-purple-600">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Campus Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campuses.map((campus, index) => (
            <CampusCard key={campus.campusId} campus={campus} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
