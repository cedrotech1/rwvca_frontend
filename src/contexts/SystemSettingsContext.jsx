import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { systemSettingsService } from '../services/api/systemSettingsService';
import { useAuth } from './AuthContext';

const SystemSettingsContext = createContext(null);

export const SystemSettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const response = await systemSettingsService.getSystemSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user, loadSettings]);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const value = {
    settings,
    loading,
    refreshSettings,
    emailNotificationEnabled: settings?.emailNotification === 'enabled',
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within SystemSettingsProvider');
  }
  return context;
};

export default SystemSettingsContext;
