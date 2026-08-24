import apiClient from './config.js';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await apiClient.post('/users/addUser', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/update/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/delete/${id}`);
    return response.data;
  },

  // Activate user
  activateUser: async (id) => {
    const response = await apiClient.put(`/users/activate/${id}`);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (id) => {
    const response = await apiClient.put(`/users/deactivate/${id}`);
    return response.data;
  },

  // Get user statistics
  getStatistics: async () => {
    const response = await apiClient.get('/users/statistics');
    return response.data;
  },

  // Get campuses (alias for campusService.getAllCampuses)
  getCampuses: async () => {
    const response = await apiClient.get('/campuses');
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/users/changePassword', passwordData);
    return response.data;
  },
};

export const campusService = {
  // Get all campuses
  getAllCampuses: async () => {
    const response = await apiClient.get('/campuses');
    return response.data;
  },

  // Get campus by ID
  getCampusById: async (id) => {
    const response = await apiClient.get(`/campuses/${id}`);
    return response.data;
  },

  // Create campus
  createCampus: async (campusData) => {
    const response = await apiClient.post('/campuses', campusData);
    return response.data;
  },

  // Update campus
  updateCampus: async (id, campusData) => {
    const response = await apiClient.put(`/campuses/${id}`, campusData);
    return response.data;
  },

  // Delete campus
  deleteCampus: async (id) => {
    const response = await apiClient.delete(`/campuses/${id}`);
    return response.data;
  },
};
