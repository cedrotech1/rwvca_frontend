import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { CreateServiceHeading } from '../components/PageHeading';

export const CreateServicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { createService } = useServices();
  const { categories, fetchCategories } = useCategories();

  const canCreateService = user?.role === 'admin' || user?.role === 'head_quarter';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    whatToReport: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      await createService({
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: Number(formData.categoryId),
        whatToReport: formData.whatToReport.trim(),
        serviceFields: [],
        isActive: formData.isActive,
      });
      showSuccess('Service created successfully');
      navigate('/management/services');
    } catch (error) {
      console.error('Error creating service:', error);
      showError(error.response?.data?.message || 'Failed to create service');
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateService) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl font-semibold mb-4">Access Denied</div>
          <p className="text-gray-600">You don't have permission to create services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CreateServiceHeading
        onSave={handleSubmit}
        actions={[
          {
            type: 'outline',
            label: 'Cancel',
            onClick: () => navigate('/management/services'),
          },
          {
            type: 'primary',
            label: saving ? 'Creating...' : 'Create Service',
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
            placeholder="e.g., Student Accommodation Management"
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
            placeholder="Short description of this service report..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What to Report *</label>
          <textarea
            value={formData.whatToReport}
            onChange={(e) => setFormData({ ...formData, whatToReport: e.target.value })}
            rows={12}
            className="block w-full px-3 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder={'Indicator / Number of Activities:\n• Item one\n• Item two\n\nAlso Report:\n• Reporting Date\n• Challenges\n• Way forward'}
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
            {saving ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateServicePage;
