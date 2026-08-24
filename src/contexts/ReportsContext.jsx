import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { reportService } from '../services/api';
import { useAuth } from './AuthContext';

const DASHBOARD_REPORT_FILTERS = { limit: 5000, page: 1, includeAllCampuses: true };
const DASHBOARD_STATS_FILTERS = { timeRange: 'all', academicYear: 'all' };

// Initial state
const initialState = {
  reports: [],
  statistics: null,
  loading: false,
  statisticsLoading: false,
  error: null,
  lastFetched: null,
  statisticsLastFetched: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_REPORTS: 'SET_REPORTS',
  SET_STATISTICS: 'SET_STATISTICS',
  ADD_REPORT: 'ADD_REPORT',
  UPDATE_REPORT: 'UPDATE_REPORT',
  DELETE_REPORT: 'DELETE_REPORT',
  CHANGE_REPORT_STATUS: 'CHANGE_REPORT_STATUS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const reportsReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case actionTypes.SET_REPORTS:
      return {
        ...state,
        reports: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
        error: null,
        lastFetched: new Date(),
      };
    
    case actionTypes.SET_STATISTICS:
      return {
        ...state,
        statistics: action.payload,
        statisticsLoading: false,
        error: null,
        statisticsLastFetched: new Date(),
      };
    
    case actionTypes.ADD_REPORT:
      return {
        ...state,
        reports: [action.payload, ...state.reports],
        loading: false,
        error: null,
      };
    
    case actionTypes.UPDATE_REPORT:
      return {
        ...state,
        reports: state.reports.map(report =>
          report.id === action.payload.id ? action.payload : report
        ),
        loading: false,
        error: null,
      };
    
    case actionTypes.DELETE_REPORT:
      return {
        ...state,
        reports: state.reports.filter(report => report.id !== action.payload),
        loading: false,
        error: null,
      };
    
    case actionTypes.CHANGE_REPORT_STATUS:
      return {
        ...state,
        reports: state.reports.map(report =>
          report.id === action.payload.reportId
            ? { ...report, status: action.payload.status }
            : report
        ),
        loading: false,
        error: null,
      };
    
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Create context
const ReportsContext = createContext();

// Provider component
export const ReportsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reportsReducer, initialState);
  const stateRef = useRef(state);
  const { dataRefreshTrigger } = useAuth();
  const { user } = useAuth();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchReports = useCallback(async (filters = {}, forceRefresh = false) => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const currentState = stateRef.current;

      const hasActiveFilters = Object.keys(filters).some(key =>
        key !== 'page' &&
        key !== 'limit' &&
        key !== 'sortBy' &&
        key !== 'sortOrder' &&
        filters[key] && filters[key] !== 'all' && filters[key] !== ''
      );

      if (!forceRefresh && !hasActiveFilters &&
          currentState.reports.length > 0 && currentState.lastFetched && currentState.lastFetched > fiveMinutesAgo) {
        return currentState.reports;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.getReports(filters);
        const reportsData = Array.isArray(response)
          ? response
          : (response?.reports || []);
        dispatch({ type: actionTypes.SET_REPORTS, payload: reportsData });
        return reportsData;
      } catch (error) {
        console.error('Error fetching reports:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, []);

  const fetchStatistics = useCallback(async (filters = {}, forceRefresh = false) => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const currentState = stateRef.current;

      const hasActiveFilters = Boolean(
        filters.timeRange || filters.campus || filters.startDate || filters.endDate
      );

      if (
        !forceRefresh &&
        !hasActiveFilters &&
        currentState.statistics &&
        currentState.statisticsLastFetched &&
        currentState.statisticsLastFetched > fiveMinutesAgo
      ) {
        return currentState.statistics;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.getStatistics(filters);
        const statsPayload = response.data ?? response;
        dispatch({ type: actionTypes.SET_STATISTICS, payload: statsPayload });
        return statsPayload;
      } catch (error) {
        console.error('Statistics fetch error:', error);
        const defaultStats = {
          overview: {
            totalReports: 0,
            publishedReports: 0,
            draftReports: 0,
            archivedReports: 0,
            fileReports: 0
          },
          services: { overall: [], byCampus: [] },
          charts: { timeStats: [], campusTimeSeries: [] }
        };
        dispatch({ type: actionTypes.SET_STATISTICS, payload: defaultStats });
        return defaultStats;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    }, []);

  const refreshAllData = useCallback(async (
    reportFilters = DASHBOARD_REPORT_FILTERS,
    statsFilters = DASHBOARD_STATS_FILTERS
  ) => {
    try {
      await Promise.all([
        fetchReports(reportFilters, true),
        fetchStatistics({ ...DASHBOARD_STATS_FILTERS, ...statsFilters }, true)
      ]);
    } catch (error) {
      console.error('Error refreshing reports data:', error);
    }
  }, [fetchReports, fetchStatistics]);

  const refreshAfterMutation = useCallback(async () => {
    try {
      await refreshAllData(DASHBOARD_REPORT_FILTERS, DASHBOARD_STATS_FILTERS);
    } catch (error) {
      console.error('Error refreshing after mutation:', error);
    } finally {
      // Always notify dashboard so KPIs reload from live reports
      window.dispatchEvent(new CustomEvent('swars:reports-changed'));
    }
  }, [refreshAllData]);

  // Actions
  const actions = {
    fetchReports,
    fetchStatistics,
    refreshAllData,

    createReportWithData: useCallback(async (reportData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.createReportWithData(reportData);
        if (response.success) {
          dispatch({ type: actionTypes.ADD_REPORT, payload: response.data || response.report });
          await refreshAfterMutation();
          return response;
        } else {
          throw new Error(response.message || 'Failed to create report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [refreshAfterMutation]),

    createReportWithFile: useCallback(async (formData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.createReportWithFile(formData);
        if (response.success) {
          dispatch({ type: actionTypes.ADD_REPORT, payload: response.data || response.report });
          await refreshAfterMutation();
          return response;
        } else {
          throw new Error(response.message || 'Failed to create report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [refreshAfterMutation]),

    updateReport: useCallback(async (reportId, reportData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.updateReport(reportId, reportData);
        if (response.success) {
          dispatch({ type: actionTypes.UPDATE_REPORT, payload: response.data || response.report });
          await refreshAfterMutation();
          return response;
        } else {
          throw new Error(response.message || 'Failed to update report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [refreshAfterMutation]),

    updateFileReport: useCallback(async (reportId, formData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.updateFileReport(reportId, formData);
        if (response.success) {
          dispatch({ type: actionTypes.UPDATE_REPORT, payload: response.data || response.report });
          await refreshAfterMutation();
          return response;
        } else {
          throw new Error(response.message || 'Failed to update report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [refreshAfterMutation]),

    deleteReport: useCallback(async (reportId) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.deleteReport(reportId);
        if (response.success) {
          dispatch({ type: actionTypes.DELETE_REPORT, payload: reportId });
          await refreshAfterMutation();
          return response;
        } else {
          throw new Error(response.message || 'Failed to delete report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [refreshAfterMutation]),

    changeReportStatus: useCallback(async (reportId, status) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.changeStatus(reportId, status);
        if (response.success) {
          dispatch({ type: actionTypes.CHANGE_REPORT_STATUS, payload: { reportId, status } });
          await refreshAfterMutation();
          return response;
        } else {
          throw new Error(response.message || 'Failed to change report status');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [refreshAfterMutation]),

    getReportById: useCallback(async (reportId) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.getReportById(reportId);
        if (response.success) {
          if (state.reports.find(r => String(r.id) === String(reportId))) {
            dispatch({ type: actionTypes.UPDATE_REPORT, payload: response.data });
          } else {
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
          }
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to get report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [state.reports, dispatch]),

    exportReport: useCallback(async (reportId) => {
      try {
        const response = await reportService.exportReport(reportId);
        
        // Create a blob from the response
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${reportId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    clearError: useCallback(() => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    }, [dispatch]),
  };

  // Soft init only — pages (dashboard/reports) load their own fresh data.
  // Avoid racing dashboard with a second stats fetch that used wrong year filters.
  useEffect(() => {
    if (user && !stateRef.current.statistics) {
      refreshAllData(DASHBOARD_REPORT_FILTERS, DASHBOARD_STATS_FILTERS);
    }
  }, [user, refreshAllData]);

  // Refresh reports when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0 && user) {
      refreshAllData(DASHBOARD_REPORT_FILTERS, DASHBOARD_STATS_FILTERS);
    }
  }, [dataRefreshTrigger, user, refreshAllData]);

  // Global refresh from other components
  useEffect(() => {
    const handleForceRefresh = () => {
      refreshAllData(DASHBOARD_REPORT_FILTERS, DASHBOARD_STATS_FILTERS);
    };
    window.addEventListener('forceDataRefresh', handleForceRefresh);
    return () => window.removeEventListener('forceDataRefresh', handleForceRefresh);
  }, [refreshAllData]);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
};

// Custom hook to use context
export const useReports = () => {
  const context = useContext(ReportsContext);

  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export default ReportsContext;
