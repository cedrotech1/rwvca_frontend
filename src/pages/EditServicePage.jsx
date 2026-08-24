import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { EditServiceHeading } from '../components/PageHeading';

export const EditServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { getServiceById, updateService } = useServices();
  const { categories, fetchCategories } = useCategories();

  const canEditService = user?.role === 'admin' || user?.role === 'head_quarter';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    whatToReport: '',
    isActive: true,
  });
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceNotFound, setServiceNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const loadService = async () => {
      try {
        const service = await getServiceById(parseInt(id, 10));
        if (service) {
          setFormData({
            name: service.name || '',
            description: service.description || '',
            categoryId: service.categoryId ? String(service.categoryId) : '',
            whatToReport: service.whatToReport || '',
            isActive: service.isActive !== false,
          });
        } else {
          setServiceNotFound(true);
        }
      } catch (error) {
        console.error('Error loading service:', error);
        setServiceNotFound(true);
      } finally {
        setServiceLoading(false);
      }
    };

    loadService();
  }, [id, getServiceById]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!formData.name.trim()) {
      showError('Service name is required');
      return;
    }
    if (!formData.categoryId) {
      showError('Category is required');
      return;
    }
    if (!formData.whatToReport.trim()) {
      showError('What to Report is required');
      return;
    }

    try {
      setSaving(true);
      await updateService(parseInt(id, 10), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: Number(formData.categoryId),
        whatToReport: formData.whatToReport.trim(),
        serviceFields: [],
        isActive: formData.isActive,
      });
      showSuccess('Service updated successfully');
      navigate('/management/services');
    } catch (error) {
      console.error('Error updating service:', error);
      showError(error.response?.data?.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  if (!canEditService) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl font-semibold mb-4">Access Denied</div>
          <p className="text-gray-600">You don't have permission to edit services.</p>
        </div>
      </div>
    );
  }

  if (serviceLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">Loading service...</div>
      </div>
    );
  }

  if (serviceNotFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl font-semibold mb-4">Service Not Found</div>
          <button
            type="button"
            onClick={() => navigate('/management/services')}
            className="px-4 py-2 bg-[#2f5d31] text-white rounded-md"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditServiceHeading
        serviceName={formData.name}
        onUpdate={handleSubmit}
        actions={[
          {
            type: 'outline',
            label: 'Cancel',
            onClick: () => navigate('/management/services'),
          },
          {
            type: 'success',
            label: saving ? 'Updating...' : 'Update Service',
            icon: <Save className="h-4 w-4" />,
            onClick: handleSubmit,
            disabled: saving,
          },
        ]}
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Service Report Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="block w-full px-3 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select category *</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Report *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full px-3 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="block w-full px-3 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What to Report *</label>
          <textarea
            value={formData.whatToReport}
            onChange={(e) => setFormData({ ...formData, whatToReport: e.target.value })}
            rows={12}
            className="block w-full px-3 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter bullet points and headings exactly as reporters should see them.
          </p>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Active Service</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/management/services')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-[#2f5d31] text-white rounded-md hover:bg-[#004a6b] disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Updating...' : 'Update Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditServicePage;
