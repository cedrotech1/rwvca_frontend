import apiClient from './config.js';

const unwrap = (response) => response.data;

export const api = {
  get: (path, params) => apiClient.get(path, { params }).then(unwrap),
  post: (path, body) => apiClient.post(path, body).then(unwrap),
  put: (path, body) => apiClient.put(path, body).then(unwrap),
  del: (path) => apiClient.delete(path).then(unwrap),
  upload: (method, path, formData) => apiClient({ method, url: path, data: formData, timeout: 120000 }).then(unwrap),
};

export const publicApi = {
  ads: () => api.get('/public/ads'),
  events: () => api.get('/public/events'),
  event: (id) => api.get(`/public/events/${id}`),
  programs: (params) => api.get('/public/programs', params),
  program: (id) => api.get(`/public/programs/${id}`),
  gallery: () => api.get('/public/gallery'),
  partners: () => api.get('/public/partners'),
  team: () => api.get('/public/team'),
  company: () => api.get('/public/company'),
  organization: () => api.get('/public/organization'),
  platforms: () => api.get('/public/platforms'),
  platform: (id) => api.get(`/public/platforms/${id}`),
  memberProducts: () => api.get('/public/member-products'),
  membershipApplication: () => api.get('/public/membership-application'),
  membership: () => api.get('/public/membership'),
  contact: (payload) => api.post('/public/contact', payload),
  subscribe: (payload) => api.post('/public/subscribe', payload),
};

export default api;
