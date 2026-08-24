import apiClient from './config';

export const systemSettingsService = {
  async getSystemSettings() {
    const response = await apiClient.get('/system-settings');
    return response.data;
  },

  async updateSystemSettings(settingsData) {
    const response = await apiClient.put('/system-settings', settingsData);
    return response.data;
  },

  async exportDatabase() {
    const response = await apiClient.get('/system-settings/export-database', {
      responseType: 'blob',
      timeout: 120000,
    });
    return response;
  },
};
