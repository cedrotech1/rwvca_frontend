import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/appPaths';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function applySession(setToken, setUser, token, userData) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  setToken(token);
  setUser(userData);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await authService.getCurrentUser();
        const userData = response?.data;
        if (response?.success && userData) {
          applySession(setToken, setUser, storedToken, userData);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [clearSession]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const payload = response?.data || {};
      if (response?.success && payload.token && payload.user) {
        applySession(setToken, setUser, payload.token, payload.user);
        setDataRefreshTrigger((prev) => prev + 1);
        return { success: true, user: payload.user };
      }
      return { success: false, message: response?.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // still clear local session
    }
    clearSession();
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        dataRefreshTrigger,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
