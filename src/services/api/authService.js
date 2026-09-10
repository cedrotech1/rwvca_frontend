import apiClient from './config.js';

/** Password-reset + login can wait on cold starts / SMTP; use a longer client timeout. */
const AUTH_SLOW_TIMEOUT_MS = Number(import.meta.env.VITE_AUTH_TIMEOUT || 120000);

function authErrorMessage(err, fallback) {
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''))) {
    return 'The server is taking too long to respond. Please try again in a moment.';
  }
  return err?.response?.data?.message || err?.message || fallback;
}

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials, { timeout: AUTH_SLOW_TIMEOUT_MS });
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
    const response = await apiClient.post('/auth/forgot-password', { email }, { timeout: AUTH_SLOW_TIMEOUT_MS });
    return response.data;
  },
  verifyCode: async (payload) => {
    const response = await apiClient.post('/auth/verify-code', payload, { timeout: AUTH_SLOW_TIMEOUT_MS });
    return response.data;
  },
  resetPassword: async (payload) => {
    const response = await apiClient.put('/auth/reset-password', payload, { timeout: AUTH_SLOW_TIMEOUT_MS });
    return response.data;
  },
  changePassword: async (payload) => {
    const response = await apiClient.put('/auth/change-password', payload);
    return response.data;
  },
  authErrorMessage,
  updateProfile: async (formData) => {
    const response = await apiClient.put('/auth/profile', formData);
    return response.data;
  },
  updateSignature: async (formData) => {
    const response = await apiClient.put('/auth/signature', formData);
    return response.data;
  },
};
