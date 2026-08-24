import apiClient from './config.js';

export const reportRequestService = {
  async getAll() {
    const response = await apiClient.get('/report-requests');
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/report-requests/${id}`);
    return response.data;
  },

  async create(payload) {
    const response = await apiClient.post('/report-requests', payload);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await apiClient.patch(`/report-requests/${id}/status`, { status });
    return response.data;
  },

  async getCombined(id) {
    const response = await apiClient.get(`/report-requests/${id}/combined`);
    return response.data;
  },
};
