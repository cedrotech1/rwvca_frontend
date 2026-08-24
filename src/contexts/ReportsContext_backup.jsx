import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { reportService } from '../services/api';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  reports: [],
  statistics: null,
  loading: false,
  error: null,
  lastFetched: null,
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
        loading: false,
        error: null,
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
  const { dataRefreshTrigger } = useAuth();

  // Actions
  const actions = {
    fetchReports: useCallback(async (filters = {}, forceRefresh = false) => {
      // Check if we have recent data (only if no filters provided)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      if (!forceRefresh && !filters.timeRange && !filters.campus && !filters.startDate && 
          state.reports.length > 0 && state.lastFetched && state.lastFetched > fiveMinutesAgo) {
        return state.reports;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.getReports(filters);
        dispatch({ type: actionTypes.SET_REPORTS, payload: response });
        return response;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [state.reports, state.lastFetched]),

    fetchStatistics: useCallback(async (filters = {}, forceRefresh = false) => {
      console.log('fetchStatistics - called with filters:', filters);
      
      // Check if we have recent data (only if no filters provided)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      if (!forceRefresh && !filters.timeRange && !filters.campus && !filters.startDate && 
          state.statistics && state.lastFetched && state.lastFetched > fiveMinutesAgo) {
        console.log('fetchStatistics - returning cached data');
        return state.statistics;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        console.log('fetchStatistics - calling API...');
        const response = await reportService.getStatistics(filters);
        console.log('fetchStatistics - API response:', response);
        console.log('fetchStatistics - response.data:', response.data);
        dispatch({ type: actionTypes.SET_STATISTICS, payload: response.data });
        return response.data;
      } catch (error) {
        console.error('Statistics fetch error:', error);
        // Don't set error state for statistics, just use defaults to prevent UI breaking
        const defaultStats = {
          totalReports: 0,
          publishedReports: 0,
          draftReports: 0,
          archivedReports: 0,
          fileReports: 0
        };
        dispatch({ type: actionTypes.SET_STATISTICS, payload: defaultStats });
        return defaultStats;
      }
    }, [state.statistics, state.lastFetched]),

    createReportWithData: useCallback(async (reportData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.createReportWithData(reportData);
        if (response.success) {
          dispatch({ type: actionTypes.ADD_REPORT, payload: response.report });
          return response;
        } else {
          throw new Error(response.message || 'Failed to create report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    createReportWithFile: useCallback(async (formData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.createReportWithFile(formData);
        if (response.success) {
          dispatch({ type: actionTypes.ADD_REPORT, payload: response.report });
          return response;
        } else {
          throw new Error(response.message || 'Failed to create report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    updateReport: useCallback(async (reportId, reportData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.updateReport(reportId, reportData);
        if (response.success) {
          dispatch({ type: actionTypes.UPDATE_REPORT, payload: response.report });
          return response;
        } else {
          throw new Error(response.message || 'Failed to update report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    updateFileReport: useCallback(async (reportId, formData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.updateFileReport(reportId, formData);
        if (response.success) {
          dispatch({ type: actionTypes.UPDATE_REPORT, payload: response.report });
          return response;
        } else {
          throw new Error(response.message || 'Failed to update report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    deleteReport: useCallback(async (reportId) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.deleteReport(reportId);
        if (response.success) {
          dispatch({ type: actionTypes.DELETE_REPORT, payload: reportId });
          return response;
        } else {
          throw new Error(response.message || 'Failed to delete report');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    changeReportStatus: useCallback(async (reportId, status) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.changeStatus(reportId, status);
        if (response.success) {
          dispatch({ type: actionTypes.CHANGE_REPORT_STATUS, payload: { reportId, status } });
          return response;
        } else {
          throw new Error(response.message || 'Failed to change report status');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [dispatch]),

    getReportById: useCallback(async (reportId) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await reportService.getReportById(reportId);
        if (response.success) {
          if (state.reports.find(r => r.id === reportId)) {
            dispatch({ type: actionTypes.UPDATE_REPORT, payload: response.data });
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

    refreshAllData: async () => {
      try {
        await Promise.all([
          actions.fetchReports({}, true),
          actions.fetchStatistics({}, true)
        ]);
      } catch (error) {
        console.error('Error refreshing reports data:', error);
      }
    },

    clearError: useCallback(() => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    }, [dispatch]),
  };

  // Initialize data on first mount
  useEffect(() => {
    actions.fetchReports();
    actions.fetchStatistics();
  }, []);

  // Refresh reports when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      actions.fetchReports({}, true); // Force refresh
      actions.fetchStatistics({}, true); // Refresh statistics too
    }
  }, [dataRefreshTrigger]);

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
  console.log('useReports called - context:', context);
  
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export default ReportsContext;
