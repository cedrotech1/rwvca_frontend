import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api/config';
import { useAuth } from './AuthContext';

const CategoriesContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const { dataRefreshTrigger } = useAuth();

  // Fetch all categories
  const fetchCategories = useCallback(async (filters = {}) => {
    console.log('fetchCategories called with filters:', filters);
    try {
      setLoading(true);
      setError(null);
      
      // Remove 'all' values from filters
      const cleanFilters = Object.keys(filters).reduce((acc, key) => {
        if (filters[key] !== 'all' && filters[key] !== '') {
          acc[key] = filters[key];
        }
        return acc;
      }, {});
      
      const response = await apiClient.get('/service-categories', { params: cleanFilters });
      console.log('API Response:', response);
      if (response.data.success) {
        console.log('Setting categories from API response:', response.data);
        setCategories(response.data.data || []);
        setLastFetched(new Date());
      }
      return response.data;
    } catch (err) {
      console.log('API Error:', err);
      setError(err.message || 'Failed to fetch categories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get category by ID
  const getCategoryById = async (id) => {
    try {
      const response = await apiClient.get(`/service-categories/${id}`);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch category');
      throw err;
    }
  };

  // Create new category
  const createCategory = async (categoryData) => {
    try {
      const response = await apiClient.post('/service-categories', categoryData);
      // Refresh categories list
      await fetchCategories();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to create category');
      throw err;
    }
  };

  // Update category
  const updateCategory = async (id, categoryData) => {
    try {
      const response = await apiClient.put(`/service-categories/${id}`, categoryData);
      // Update category in local state immediately
      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, ...response.data.data || response.data } : category
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update category');
      throw err;
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    try {
      await apiClient.delete(`/service-categories/${id}`);
      // Remove category from local state
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      throw err;
    }
  };

  // Refresh categories (force refetch)
  const refreshCategories = useCallback(() => {
    setLastFetched(null);
    return fetchCategories();
  }, [fetchCategories]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh categories when user logs in (dataRefreshTrigger changes)
  useEffect(() => {
    if (dataRefreshTrigger > 0) {
      refreshCategories();
    }
  }, [dataRefreshTrigger]);

  const value = {
    categories,
    loading,
    error,
    lastFetched,
    fetchCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    clearError,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};
