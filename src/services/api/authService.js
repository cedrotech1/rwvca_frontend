import apiClient from './config.js';

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  verifyCode: async (payload) => {
    const response = await apiClient.post('/auth/verify-code', payload);
    return response.data;
  },
  resetPassword: async (payload) => {
    const response = await apiClient.put('/auth/reset-password', payload);
    return response.data;
  },
  changePassword: async (payload) => {
    const response = await apiClient.put('/auth/change-password', payload);
    return response.data;
  },
  updateProfile: async (formData) => {
    const response = await apiClient.put('/auth/profile', formData);
    return response.data;
  },
  updateSignature: async (formData) => {
    const response = await apiClient.put('/auth/signature', formData);
    return response.data;
  },
};
