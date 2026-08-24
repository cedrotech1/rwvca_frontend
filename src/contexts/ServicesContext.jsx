import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { servicesApi } from '../services/api/services';
import { useAuth } from './AuthContext';

const ServicesContext = createContext();

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

export const ServicesProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const { dataRefreshTrigger } = useAuth();

  // Fetch all services
  const fetchServices = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await servicesApi.getServices(filters);
      setServices(response.data || []);
      setLastFetched(new Date());
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch services');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get service by ID
  const getServiceById = async (id) => {
    try {
      const response = await servicesApi.getServiceById(id);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch service');
      throw err;
    }
  };

  // Create new service
  const createService = async (serviceData) => {
    try {
      const response = await servicesApi.createService(serviceData);
      // Refresh services list
      await fetchServices();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to create service');
      throw err;
    }
  };

  // Update service
  const updateService = async (id, serviceData) => {
    try {
      const response = await servicesApi.updateService(id, serviceData);
      // Update service in local state immediately
      setServices(prev => prev.map(service => 
        service.id === id ? { ...service, ...response.data.data || response.data } : service
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update service');
      throw err;
    }
  };

  // Delete service
  const deleteService = async (id) => {
    try {
      await servicesApi.deleteService(id);
      // Remove service from local state
      setServices(prev => prev.filter(service => service.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete service');
      throw err;
    }
  };

  // Get services by campus
  const getServicesByCampus = async (campusId) => {
    try {
      const response = await servicesApi.getServicesByCampus(campusId);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch services by campus');
      throw err;
    }
  };

  // Get services by category
  const getServicesByCategory = async (category) => {
    try {
      const response = await servicesApi.getServicesByCategory(category);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch services by category');
      throw err;
    }
  };

  // Refresh services (force refetch)
  const refreshServices = useCallback(() => {
    setLastFetched(null);
    return fetchServices();
  }, [fetchServices]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh services when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      refreshServices();
    }
  }, [dataRefreshTrigger]);

  const value = {
    services,
    loading,
    error,
    lastFetched,
    fetchServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getServicesByCampus,
    getServicesByCategory,
    refreshServices,
    clearError,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
