import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { campusesService } from '../services/api/campusesService';
import { dedupeCampuses } from '../utils/campusUtils';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  campuses: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CAMPUSES: 'SET_CAMPUSES',
  ADD_CAMPUS: 'ADD_CAMPUS',
  UPDATE_CAMPUS: 'UPDATE_CAMPUS',
  DELETE_CAMPUS: 'DELETE_CAMPUS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STATE: 'RESET_STATE',
};

// Reducer function
const campusesReducer = (state, action) => {
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
    
    case actionTypes.SET_CAMPUSES:
      return {
        ...state,
        campuses: dedupeCampuses(action.payload || []),
        loading: false,
        error: null,
        lastFetched: new Date(),
      };
    
    case actionTypes.ADD_CAMPUS:
      return {
        ...state,
        campuses: [...state.campuses, action.payload],
        loading: false,
        error: null,
      };
    
    case actionTypes.UPDATE_CAMPUS:
      return {
        ...state,
        campuses: state.campuses.map(campus =>
          campus.id === action.payload.id ? action.payload : campus
        ),
        loading: false,
        error: null,
      };
    
    case actionTypes.DELETE_CAMPUS:
      return {
        ...state,
        campuses: state.campuses.filter(campus => campus.id !== action.payload),
        loading: false,
        error: null,
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
const CampusesContext = createContext();

// Provider component
export const CampusesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(campusesReducer, initialState);
  const { dataRefreshTrigger, user } = useAuth();

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

    fetchCampuses: useCallback(async () => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await campusesService.getCampuses();
        
        if (response.success) {
          dispatch({ type: actionTypes.SET_CAMPUSES, payload: response.data });
        }
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, []),

    createCampus: useCallback(async (campusData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await campusesService.createCampus(campusData);
        
        if (response.success) {
          dispatch({ type: actionTypes.ADD_CAMPUS, payload: response.data });
        }
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, []),

    updateCampus: useCallback(async (id, campusData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await campusesService.updateCampus(id, campusData);
        
        if (response.success) {
          dispatch({ type: actionTypes.UPDATE_CAMPUS, payload: response.data });
        }
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, []),

    deleteCampus: useCallback(async (id) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await campusesService.deleteCampus(id);
        
        if (response.success) {
          dispatch({ type: actionTypes.DELETE_CAMPUS, payload: id });
        }
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }, []),

    resetState: () => {
      dispatch({ type: actionTypes.RESET_STATE });
    }
  };

  // Load campuses when user is available
  useEffect(() => {
    if (user) {
      actions.fetchCampuses();
    }
  }, [user]);

  // Refresh campuses when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0 && user) {
      actions.fetchCampuses();
    }
  }, [dataRefreshTrigger, user]);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <CampusesContext.Provider value={value}>
      {children}
    </CampusesContext.Provider>
  );
};

// Custom hook to use context
export const useCampuses = () => {
  const context = useContext(CampusesContext);
  if (!context) {
    throw new Error('useCampuses must be used within a CampusesProvider');
  }
  return context;
};

export default CampusesContext;
