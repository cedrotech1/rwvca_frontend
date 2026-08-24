import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import apiClient from '../services/api/config';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  logs: [],
  statistics: null,
  loading: false,
  error: null,
  lastFetched: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  },
  filters: {
    activity: '',
    module: '',
    action: '',
    status: '',
    userId: '',
    exactDate: '',
    startDate: '',
    endDate: ''
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LOGS: 'SET_LOGS',
  SET_STATISTICS: 'SET_STATISTICS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STATE: 'RESET_STATE',
};

// Reducer function
const logsReducer = (state, action) => {
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
    
    case actionTypes.SET_LOGS:
      return {
        ...state,
        logs: action.payload.logs || [],
        pagination: action.payload.pagination || state.pagination,
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
    
    case actionTypes.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };
    
    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 },
      };
    
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case actionTypes.RESET_STATE:
      return {
        ...initialState,
        lastFetched: state.lastFetched,
      };
    
    default:
      return state;
  }
};

// Create context
const LogsContext = createContext();

// Provider component
export const LogsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(logsReducer, initialState);
  const { dataRefreshTrigger } = useAuth();

  // Actions
  const actions = {
    setLoading: (loading) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: actionTypes.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    },

    fetchLogs: useCallback(async (page = 1, filters = {}) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const params = {
          page,
          limit: state.pagination.itemsPerPage,
          ...filters
        };

        const response = await apiClient.get('/logs', { params });
        
        if (response.data.success) {
          dispatch({ 
            type: actionTypes.SET_LOGS, 
            payload: {
              logs: response.data.data.logs,
              pagination: response.data.data.pagination
            }
          });
        }
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, [state.pagination.itemsPerPage]),

    fetchStatistics: useCallback(async () => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await apiClient.get('/logs/statistics');
        
        if (response.data.success) {
          dispatch({ 
            type: actionTypes.SET_STATISTICS, 
            payload: response.data.data.statistics 
          });
        }
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, []),

    updateFilters: (filters) => {
      dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
    },

    setPage: (page) => {
      dispatch({ type: actionTypes.SET_PAGINATION, payload: { currentPage: page } });
    },

    exportLogs: async (filters = {}) => {
      try {
        const response = await apiClient.get('/logs/export', { 
          params: filters,
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    resetState: () => {
      dispatch({ type: actionTypes.RESET_STATE });
    }
  };

  // Refresh logs when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      actions.fetchLogs(1, state.filters);
      actions.fetchStatistics();
    }
  }, [dataRefreshTrigger]);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <LogsContext.Provider value={value}>
      {children}
    </LogsContext.Provider>
  );
};

// Custom hook to use context
export const useLogs = () => {
  const context = useContext(LogsContext);
  if (!context) {
    throw new Error('useLogs must be used within a LogsProvider');
  }
  return context;
};

export default LogsContext;
