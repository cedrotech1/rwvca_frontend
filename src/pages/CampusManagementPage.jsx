import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiClient } from '../services/api';
import { CampusManagementHeading } from '../components/PageHeading';

export const CampusManagementPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });

  // Check permissions
  const canManageCampuses = user?.role === 'admin' || user?.role === 'head_quarter';

  useEffect(() => {
    if (!canManageCampuses) {
      showError('You do not have permission to access this page');
      return;
    }
    fetchCampuses();
  }, [filters]);

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/campuses', { params: filters });
      if (response.data.success) {
        setCampuses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching campuses:', error);
      showError('Failed to fetch campuses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only send the fields that the backend expects
      const submitData = {
        name: formData.name,
        status: formData.status
      };
      
      if (showEditModal) {
        await apiClient.put(`/campuses/${selectedCampus.id}`, submitData);
        showSuccess('Campus updated successfully');
      } else {
        await apiClient.post('/campuses', submitData);
        showSuccess('Campus created successfully');
      }
      
      resetForm();
      fetchCampuses();
    } catch (error) {
      console.error('Error saving campus:', error);
      showError(error.response?.data?.message || 'Failed to save campus');
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/campuses/${selectedCampus.id}`);
      showSuccess('Campus deleted successfully');
      setShowDeleteModal(false);
      setSelectedCampus(null);
      fetchCampuses();
    } catch (error) {
      console.error('Error deleting campus:', error);
      showError('Failed to delete campus');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'active'
    });
    setSelectedCampus(null);
    setShowCreateModal(false);
    setShowEditModal(false);
  };

  const openEditModal = (campus) => {
    setSelectedCampus(campus);
    setFormData({
      name: campus.name,
      status: campus.status
    });
    setShowEditModal(true);
  };

  const getCampusStats = async (campusId) => {
    try {
      const response = await apiClient.get(`/users/statistics?campus=${campusId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching campus stats:', error);
      return { totalUsers: 0, activeUsers: 0 };
    }
  };

  if (!canManageCampuses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campus Management</h1>
            <p className="mt-2 text-gray-600">Manage university campuses and their configurations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Campus
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search campuses..."
                  className="block w-full pl-10 pr-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="block w-full px-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Campuses Grid */}
      <div className="bg-gray-150 rounded-sm overflow-hidden">
        <div className="border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Campuses ({campuses.length})</h3>
        </div>
        <div className="pt-3 py-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading campuses...</div>
            </div>
          ) : campuses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No campuses found</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campuses.map((campus) => (
                <div key={campus.id} className="bg-white  rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <Building className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{campus.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            campus.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {campus.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(campus)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCampus(campus);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-300 pt-4">
                      <div className="flex items-center justify-end text-sm">
                        <div className="text-gray-500">
                          Status: <span className={`font-medium ${
                            campus.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {campus.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {showEditModal ? 'Edit Campus' : 'Create Campus'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {showEditModal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Campus</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedCampus?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
