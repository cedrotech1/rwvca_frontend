import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Calendar, User, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';

export const ViewServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { getServiceById, deleteService, loading } = useServices();

  const [service, setService] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);

  const canManageServices = user?.role === 'admin' || user?.role === 'head_quarter';

  useEffect(() => {
    const loadService = async () => {
      try {
        const serviceData = await getServiceById(parseInt(id, 10));
        setService(serviceData);
        setError(null);
      } catch (err) {
        console.error('Error loading service:', err);
        setError('Failed to load service');
        showError('Failed to load service details');
      }
    };

    if (id) {
      loadService();
    }
  }, [id, getServiceById, showError]);

  const handleDelete = async () => {
    try {
      await deleteService(service.id);
      showSuccess('Service deleted successfully');
      navigate('/management/services');
    } catch (deleteError) {
      console.error('Error deleting service:', deleteError);
      showError('Failed to delete service');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-500">Loading service details...</div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error || 'Service not found'}</div>
            <button
              onClick={() => navigate('/management/services')}
              className="px-4 py-2 bg-[#2f5d31] text-white rounded-lg hover:bg-[#004a6b] transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/management/services')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Services
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
              <p className="text-gray-600 mt-1">Service report details</p>
            </div>
          </div>

          {canManageServices && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/services/edit/${service.id}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Service
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Service
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Service Status</h2>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {service.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Created</div>
              <div className="font-medium">{formatDate(service.createdAt)}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="font-medium">{formatDate(service.updatedAt)}</div>
            </div>
          </div>

          {service.creator && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Created By</div>
                <div className="font-medium">{service.creator.names}</div>
              </div>
            </div>
          )}

          {service.updater && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Updated By</div>
                <div className="font-medium">{service.updater.names}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Category</h2>
        <p className="text-gray-700 leading-relaxed">
          {service.category?.name || 'Uncategorized'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-700 leading-relaxed">
          {service.description || 'No description available for this service.'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Report</h2>
        <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans m-0">
          {service.whatToReport || 'No reporting guidance defined for this service.'}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Information</h2>
        <div className="space-y-2 max-w-md">
          <div className="flex justify-between">
            <span className="text-gray-600">Service ID:</span>
            <span className="font-medium">#{service.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${service.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {service.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Service</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete service &quot;
                  <span className="font-semibold">{service.name}</span>&quot;?
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewServicePage;
