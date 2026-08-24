import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userService } from '../services/api';
import { dedupeCampuses } from '../utils/campusUtils';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  users: [],
  campuses: [],
  statistics: null,
  loading: false,
  error: null,
  lastFetched: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USERS: 'SET_USERS',
  SET_CAMPUSES: 'SET_CAMPUSES',
  SET_STATISTICS: 'SET_STATISTICS',
  ADD_USER: 'ADD_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  TOGGLE_USER_STATUS: 'TOGGLE_USER_STATUS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const usersReducer = (state, action) => {
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
    
    case actionTypes.SET_USERS:
      return {
        ...state,
        users: action.payload,
        loading: false,
        error: null,
        lastFetched: new Date(),
      };
    
    case actionTypes.SET_CAMPUSES:
      return {
        ...state,
        campuses: dedupeCampuses(action.payload || []),
        loading: false,
        error: null,
      };
    
    case actionTypes.SET_STATISTICS:
      return {
        ...state,
        statistics: action.payload,
        loading: false,
        error: null,
      };
    
    case actionTypes.ADD_USER:
      return {
        ...state,
        users: [action.payload, ...state.users],
        loading: false,
        error: null,
      };
    
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
        loading: false,
        error: null,
      };
    
    case actionTypes.DELETE_USER:
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
        loading: false,
        error: null,
      };
    
    case actionTypes.TOGGLE_USER_STATUS:
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.userId
            ? { ...user, active: action.payload.active }
            : user
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
const UsersContext = createContext();

// Provider component
export const UsersProvider = ({ children }) => {
  const [state, dispatch] = useReducer(usersReducer, initialState);
  const { dataRefreshTrigger, token, loading: authLoading } = useAuth();

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

    fetchUsers: async (forceRefresh = false) => {
      // Check if we have recent data (less than 5 minutes old)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      if (!forceRefresh && state.lastFetched && state.lastFetched > fiveMinutesAgo && state.users.length > 0) {
        return state.users; // Return cached data
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await userService.getAllUsers();
        if (response.success) {
          dispatch({ type: actionTypes.SET_USERS, payload: response.users });
          return response.users;
        } else {
          throw new Error(response.message || 'Failed to fetch users');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        return [];
      }
    },

    fetchCampuses: async (forceRefresh = false) => {
      // Check if we have recent data
      if (!forceRefresh && state.campuses.length > 0) {
        return state.campuses;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await userService.getCampuses();
        if (response.success) {
          dispatch({ type: actionTypes.SET_CAMPUSES, payload: response.data });
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch campuses');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        return [];
      }
    },

    fetchStatistics: async (forceRefresh = false) => {
      // Disabled - using ReportsContext for statistics instead
      console.log('UsersContext fetchStatistics disabled - using ReportsContext instead');
      return null;
    },

    createUser: async (userData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await userService.createUser(userData);
        if (response.success) {
          // Add the new user to the state
          dispatch({ type: actionTypes.ADD_USER, payload: response.user });
          return response;
        } else {
          throw new Error(response.message || 'Failed to create user');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateUser: async (userId, userData) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await userService.updateUser(userId, userData);
        if (response.success) {
          // Update the user in the state
          dispatch({ type: actionTypes.UPDATE_USER, payload: response.user });
          return response;
        } else {
          throw new Error(response.message || 'Failed to update user');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    deleteUser: async (userId) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await userService.deleteUser(userId);
        if (response.success) {
          // Remove the user from the state
          dispatch({ type: actionTypes.DELETE_USER, payload: userId });
          return response;
        } else {
          throw new Error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    toggleUserStatus: async (userId, action) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = action === 'activate' 
          ? await userService.activateUser(userId)
          : await userService.deactivateUser(userId);
        
        if (response.success) {
          // Update the user status in the state
          const newStatus = action === 'activate' ? 1 : 0;
          dispatch({ type: actionTypes.TOGGLE_USER_STATUS, payload: { userId, active: newStatus } });
          return response;
        } else {
          throw new Error(response.message || `Failed to ${action} user`);
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    refreshAllData: async () => {
      try {
        await Promise.all([
          actions.fetchUsers(true),
          actions.fetchCampuses(true),
          // actions.fetchStatistics(true) // Disabled - using ReportsContext instead
        ]);
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    },
  };

  // Load directory data only when authenticated
  useEffect(() => {
    if (authLoading || !token) {
      return;
    }
    actions.fetchUsers();
    actions.fetchCampuses();
  }, [authLoading, token]);

  // Refresh users when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0 && token) {
      actions.fetchUsers(true); // Force refresh
      actions.fetchCampuses(true); // Force refresh
    }
  }, [dataRefreshTrigger]);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};

// Custom hook to use the context
export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

export default UsersContext;
