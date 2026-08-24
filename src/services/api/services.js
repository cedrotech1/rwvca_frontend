import apiClient from './config.js';

const servicesApi = {
  // Get all services with optional filtering
  getServices: async (filters = {}) => {
    try {
      // Remove 'all' values from filters
      const cleanFilters = Object.keys(filters).reduce((acc, key) => {
        if (filters[key] !== 'all' && filters[key] !== '') {
          acc[key] = filters[key];
        }
        return acc;
      }, {});
      
      const response = await apiClient.get('/services', { params: cleanFilters });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Get service by ID
  getServiceById: async (id) => {
    try {
      const response = await apiClient.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  },

  // Create new service
  createService: async (serviceData) => {
    try {
      const response = await apiClient.post('/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Update service
  updateService: async (id, serviceData) => {
    try {
      const response = await apiClient.put(`/services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // Delete service
  deleteService: async (id) => {
    try {
      const response = await apiClient.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  // Get services by campus
  getServicesByCampus: async (campusId) => {
    try {
      const response = await apiClient.get(`/services/campus/${campusId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services by campus:', error);
      throw error;
    }
  },

  // Get services by category
  getServicesByCategory: async (category) => {
    try {
      const response = await apiClient.get(`/services/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services by category:', error);
      throw error;
    }
  },

  };

export { servicesApi };
