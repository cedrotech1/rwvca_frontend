import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCampuses } from '../contexts/CampusesContext';
import { useServices } from '../contexts/ServicesContext';

import { MetricsCards } from './MetricsCards';
import { ChartsSection, ServicesDistributionChart } from './Charts';
import { CampusBreakdown } from './CampusBreakdown';
import { ServiceCoverageMatrix } from './ServiceCoverageMatrix';
import { academicYearService } from '../services/api/academicYearService';
import { reportService } from '../services/api/reportService';

import { MapPin, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { formatCampusDisplayName, isDvcViewer } from '../utils/reportPermissions';

const DASHBOARD_PATHS = ['/', '/dashboard'];

const computeOverviewFromReports = (list = []) => {
  const totalReports = list.length;
  const publishedReports = list.filter((r) => r.status === 'published').length;
  const draftReports = list.filter((r) => r.status === 'draft').length;
  const archivedReports = list.filter((r) => r.status === 'archived').length;
  const fileReports = list.filter((r) => r.fileName).length;
  const totalRows = list.reduce((sum, r) => sum + (Number(r.totalRows) || 0), 0);
  const avgRowsPerReport = totalReports > 0 ? Math.round(totalRows / totalReports) : 0;

  return {
    totalReports,
    publishedReports,
    draftReports,
    archivedReports,
    fileReports,
    totalRows,
    avgRowsPerReport,
  };
};

const buildServicesOverallFromReports = (list = []) => {
  const serviceMap = new Map();
  list.forEach((report) => {
    const serviceName = report.service?.name || 'No service';
    const serviceId = report.service?.id ?? serviceName;
    if (!serviceMap.has(serviceId)) {
      serviceMap.set(serviceId, {
        serviceId,
        serviceName,
        reportCount: 0,
        totalRows: 0,
      });
    }
    const row = serviceMap.get(serviceId);
    row.reportCount += 1;
    row.totalRows += Number(report.totalRows) || 0;
  });
  return Array.from(serviceMap.values()).sort((a, b) => b.reportCount - a.reportCount);
};

const isGeneralReport = (report) =>
  (report?.campus == null || report?.campus === '') && !report?.reportCampus?.id;

const buildDvcDashboardStatistics = (reports = [], baseStats = {}) => {
  const generalReports = reports.filter(isGeneralReport);
  return {
    ...baseStats,
    overview: computeOverviewFromReports(generalReports),
    services: {
      ...(baseStats.services || {}),
      overall: buildServicesOverallFromReports(generalReports),
      byCampus: [],
    },
    charts: {
      ...(baseStats.charts || {}),
      timeStats: [],
    },
    academicYears: {
      ...(baseStats.academicYears || {}),
      byCampus: [],
    },
    campuses: {
      ...(baseStats.campuses || {}),
      overview: buildCampusOverview(generalReports, []),
    },
  };
};
const buildCampusOverview = (list = [], campuses = []) => {
  const byId = new Map();
  list.forEach((report) => {
    const rawCampusId = report.campus ?? report.reportCampus?.id;
    const campusId =
      rawCampusId == null || rawCampusId === ''
        ? 'general'
        : Number(rawCampusId);
    const campusName = formatCampusDisplayName(
      report.reportCampus?.name ||
        campuses.find((c) => c.id === Number(rawCampusId))?.name,
      rawCampusId
    );

    if (!byId.has(campusId)) {
      byId.set(campusId, {
        campusId,
        campusName,
        totalReports: 0,
        publishedReports: 0,
        draftReports: 0,
        archivedReports: 0,
        fileReports: 0,
        dataReports: 0,
        totalRows: 0,
      });
    }
    const row = byId.get(campusId);
    row.totalReports += 1;
    if (report.status === 'published') row.publishedReports += 1;
    if (report.status === 'draft') row.draftReports += 1;
    if (report.status === 'archived') row.archivedReports += 1;
    if (report.fileName) row.fileReports += 1;
    else row.dataReports += 1;
    row.totalRows += Number(report.totalRows) || 0;
  });

  return Array.from(byId.values()).map((c) => ({
    campusId: c.campusId,
    campusName: c.campusName,
    statistics: {
      totalReports: c.totalReports,
      publishedReports: c.publishedReports,
      draftReports: c.draftReports,
      archivedReports: c.archivedReports,
      fileReports: c.fileReports,
      dataReports: c.dataReports,
      totalRows: c.totalRows,
      avgRowsPerReport: c.totalReports > 0 ? Math.round(c.totalRows / c.totalReports) : 0,
      maxRowsInReport: c.totalRows,
      minRowsInReport: 0,
    },
    services: [],
    categories: [],
  }));
};

export const DashboardDataProvider = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { campuses = [], fetchCampuses } = useCampuses();
  const { services = [], fetchServices } = useServices();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAcademicYearId, setActiveAcademicYearId] = useState('');
  const [activeAcademicYearLabel, setActiveAcademicYearLabel] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [matrixReports, setMatrixReports] = useState([]);
  const [dashboardStatistics, setDashboardStatistics] = useState(null);

  const loadSeq = useRef(0);
  const loadingRef = useRef(false);
  const campusesRef = useRef(campuses);
  const fetchCampusesRef = useRef(fetchCampuses);
  const fetchServicesRef = useRef(fetchServices);

  useEffect(() => {
    campusesRef.current = campuses;
  }, [campuses]);

  useEffect(() => {
    fetchCampusesRef.current = fetchCampuses;
  }, [fetchCampuses]);

  useEffect(() => {
    fetchServicesRef.current = fetchServices;
  }, [fetchServices]);

  const visibleCampuses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'head_quarter' || user.role === 'dvc') {
      return campuses;
    }
    if (user.campus) {
      return campuses.filter((campus) => campus.id === Number(user.campus));
    }
    return campuses;
  }, [campuses, user]);

  // Stable loader — does NOT depend on campuses/refreshAllData (those caused infinite reloads)
  const loadDashboardData = useCallback(async () => {
    if (!user || loadingRef.current) return;

    const seq = ++loadSeq.current;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const [activeYearResponse, yearsResponse, reportsResponse, statsResponse] = await Promise.all([
        academicYearService.getActiveAcademicYear(),
        academicYearService.getAcademicYears(),
        reportService.getReports({
          limit: 5000,
          page: 1,
          includeAllCampuses: true,
        }),
        reportService.getStatistics({
          timeRange: 'all',
          academicYear: 'all',
        }),
        fetchCampusesRef.current?.(),
        fetchServicesRef.current?.(),
      ]);

      if (seq !== loadSeq.current) return;

      const activeId = activeYearResponse?.data?.id ? String(activeYearResponse.data.id) : '';
      const activeLabel = activeYearResponse?.data?.label || '';
      setActiveAcademicYearId(activeId);
      setActiveAcademicYearLabel(activeLabel);
      setAcademicYears(yearsResponse?.data || []);

      const allReports = reportsResponse?.reports || [];
      setMatrixReports(allReports);

      const overview = computeOverviewFromReports(allReports);
      const campusOverview = buildCampusOverview(allReports, campusesRef.current || []);
      const apiStats = statsResponse?.data ?? statsResponse ?? {};

      setDashboardStatistics({
        ...apiStats,
        overview,
        campuses: {
          ...(apiStats.campuses || {}),
          overview: campusOverview,
        },
      });
    } catch (err) {
      console.error('Dashboard load failed:', err);
      if (seq === loadSeq.current) {
        setError(err?.message || 'Failed to load dashboard');
      }
    } finally {
      if (seq === loadSeq.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [user]);

  const isDashboardRoute = DASHBOARD_PATHS.includes(location.pathname);

  useEffect(() => {
    if (user && isDashboardRoute) {
      loadDashboardData();
    }
  }, [user?.id, isDashboardRoute, location.pathname, loadDashboardData]);

  // After create / publish / delete — reload once if dashboard is open
  useEffect(() => {
    if (!user || !isDashboardRoute) return undefined;

    const onReportsChanged = () => {
      // Allow reload even if a previous load just finished
      loadingRef.current = false;
      loadDashboardData();
    };

    window.addEventListener('swars:reports-changed', onReportsChanged);
    return () => window.removeEventListener('swars:reports-changed', onReportsChanged);
  }, [user?.id, isDashboardRoute, loadDashboardData]);

  const dashboardData = {
    statistics: dashboardStatistics,
    loading,
    error,
  };

  const filteredReports = useMemo(() => {
    if (!matrixReports.length) return [];
    if (!activeAcademicYearId) return matrixReports;
    const yearId = Number(activeAcademicYearId);
    return matrixReports.filter(
      (report) => Number(report.academicYearId || report.academicYear?.id) === yearId
    );
  }, [matrixReports, activeAcademicYearId]);

  const campusSummary = useMemo(() => {
    if (!visibleCampuses.length) return [];

    const reportsByCampus = new Map();
    const servicesByCampus = new Map();

    filteredReports.forEach((report) => {
      const campusId = Number(report.campus ?? report.reportCampus?.id);
      if (!campusId) return;

      if (!reportsByCampus.has(campusId)) {
        reportsByCampus.set(campusId, []);
        servicesByCampus.set(campusId, new Set());
      }

      reportsByCampus.get(campusId).push(report);
      if (report.service?.name) {
        servicesByCampus.get(campusId).add(report.service.name);
      }
    });

    return visibleCampuses.map((campus) => {
      const campusReports = reportsByCampus.get(campus.id) || [];
      return {
        id: campus.id,
        name: campus.name,
        reportCount: campusReports.length,
        publishedCount: campusReports.filter((r) => r.status === 'published').length,
        draftCount: campusReports.filter((r) => r.status === 'draft').length,
        serviceCount: servicesByCampus.get(campus.id)?.size || 0,
      };
    });
  }, [filteredReports, visibleCampuses]);

  const handleRefresh = () => {
    loadingRef.current = false;
    loadDashboardData();
  };

  const isCampusScopedUser =
    user?.role === 'warefare' || user?.role === 'it' || (user?.campus && user?.role === 'wadden');

  const matrixDefaultCampusId = useMemo(() => {
    if (isCampusScopedUser && user?.campus) {
      return String(user.campus);
    }
    if (visibleCampuses.length > 0) {
      return String(visibleCampuses[0].id);
    }
    return null;
  }, [isCampusScopedUser, user?.campus, visibleCampuses]);

  const lockMatrixCampusFilter = isCampusScopedUser && !!user?.campus;
  const hideCampusSections = isDvcViewer(user?.role);

  const displayStatistics = useMemo(() => {
    if (!dashboardStatistics) return null;
    if (!hideCampusSections) return dashboardStatistics;
    return buildDvcDashboardStatistics(matrixReports, dashboardStatistics);
  }, [dashboardStatistics, matrixReports, hideCampusSections]);

  return (
    <div className="space-y-6">
      {hideCampusSections && (
        <div className="rounded-lg border border-[#2f5d31]/20 bg-[#2f5d31]/5 px-4 py-3 text-sm text-[#2f5d31]">
          Dashboard shows <strong>General</strong> headquarters reports only (published HQ reports with no campus).
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2f5d31] bg-white border border-[#2f5d31]/30 rounded-lg hover:bg-[#2f5d31]/5 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh dashboard
        </button>
      </div>

      <MetricsCards statistics={displayStatistics} loading={dashboardData.loading} />

      {hideCampusSections ? (
        <ServicesDistributionChart statistics={displayStatistics} loading={dashboardData.loading} />
      ) : (
        <ChartsSection statistics={displayStatistics} loading={dashboardData.loading} />
      )}

      {!hideCampusSections && (
        <>
          <CampusBreakdown statistics={displayStatistics} loading={dashboardData.loading} />

          <ServiceCoverageMatrix
            campuses={visibleCampuses}
            services={services}
            academicYears={academicYears}
            reports={matrixReports}
            loading={loading}
            onRefresh={handleRefresh}
            defaultCampusId={matrixDefaultCampusId}
            lockCampusFilter={lockMatrixCampusFilter}
          />

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">Campus Summary</h3>
              {activeAcademicYearLabel && (
                <span className="text-sm text-gray-500">
                  ({activeAcademicYearLabel})
                </span>
              )}
            </div>

            <div>
              {loading ? null : campusSummary.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No campus data available</p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Refresh Data
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {campusSummary.map((campus) => (
                    <div key={campus.id} className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        <div>
                          <h4>{campus.name}</h4>
                          <p className="text-sm text-gray-500">{campus.reportCount} reports</p>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-green-800 font-medium">{campus.publishedCount}</span>
                          <span className="text-gray-600 ml-1">published</span>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                          <span className="text-yellow-800 font-medium">{campus.draftCount}</span>
                          <span className="text-gray-600 ml-1">drafts</span>
                        </div>
                      </div>

                      <div
                        className={`mt-2 text-xs p-2 rounded ${
                          campus.reportCount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {campus.reportCount > 0 ? (
                          <CheckCircle className="inline h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="inline h-3 w-3 mr-1" />
                        )}
                        {campus.reportCount > 0 ? `${campus.serviceCount} services` : 'No Reports'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
