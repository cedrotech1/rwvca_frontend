import apiClient from './config.js';

export const reportService = {
  // Get all reports
  async getReports(params = {}) {
    const response = await apiClient.get('/reports/all', { params });
    return response.data.data;
  },

  // Get report by ID
  getReportById: async (id) => {
    const response = await apiClient.get(`/reports/one/${id}`);
    return response.data;
  },

  // Get report statistics
  getStatistics: async (filters = {}) => {
    const response = await apiClient.get('/reports/statistics', { params: filters });
    return response.data;
  },

  // Create report with file upload
  createReportWithFile: async (formData) => {
    const response = await apiClient.post('/reports/create/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create report with data
  createReportWithData: async (reportData) => {
    const response = await apiClient.post('/reports/create/data', reportData);
    return response.data;
  },

  // Update report (data report)
  updateReport: async (id, reportData) => {
    const response = await apiClient.put(`/reports/edit/${id}`, reportData);
    return response.data;
  },

  // Update file report
  updateFileReport: async (id, formData) => {
    const response = await apiClient.put(`/reports/edit/file/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change report status
  changeStatus: async (id, status) => {
    const response = await apiClient.put(`/reports/status/${id}`, { status });
    return response.data;
  },

  // Delete report
  deleteReport: async (id) => {
    const response = await apiClient.delete(`/reports/delete/one/${id}`);
    return response.data;
  },

  // Export report to CSV
  exportReport: async (id) => {
    const response = await apiClient.get(`/reports/${id}/export`, {
      responseType: 'blob',
    });
    return response;
  },

  // Get report data rows
  getReportData: async (id) => {
    const response = await apiClient.get(`/reports/${id}/data`);
    return response.data;
  },

  // Get report activity logs
  getReportActivity: async (id) => {
    const response = await apiClient.get(`/reports/${id}/activity`);
    return response.data;
  },
};
