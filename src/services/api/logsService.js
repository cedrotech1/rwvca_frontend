import apiClient from './config';

export const logsService = {
  // Get all logs with filters and pagination
  async getLogs(params = {}) {
    const response = await apiClient.get('/logs', { params });
    return response.data;
  },

  // Get logs statistics
  async getStatistics() {
    const response = await apiClient.get('/logs/statistics');
    return response.data;
  },

  // Export logs to CSV
  async exportLogs(params = {}) {
    const response = await apiClient.get('/logs/export', { 
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Get logs for a specific user (admin/head_quarter only)
  async getUserLogs(userId, params = {}) {
    const response = await apiClient.get(`/logs/user/${userId}`, { params });
    return response.data;
  }
};
