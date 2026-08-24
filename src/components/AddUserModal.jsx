import React from 'react';
import { UserPlus, X } from 'lucide-react';
import { requiresCampus, ROLES_WITHOUT_CAMPUS } from '../utils/roleHelpers';

export const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  errors = {},
  loading = false,
  campuses = [],
}) => {
  const campusRequired = requiresCampus(formData.role);
  const showCampusField = requiresCampus(formData.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gray-100"></div>
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-3">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Add New User
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="names"
                value={formData.names}
                onChange={onChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={onChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                required
              >
                <option value="warefare">Student Director Welfare</option>
                <option value="it">IT</option>
                <option value="wadden">Hostel Warden</option>
                <option value="head_quarter">Head Quarter</option>
                <option value="dvc">DVC</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {showCampusField && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Campus {campusRequired && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="campus"
                  value={formData.campus ?? ''}
                  onChange={onChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                  required={campusRequired}
                >
                  <option value="">Select Campus</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {ROLES_WITHOUT_CAMPUS.includes(formData.role) && (
              <div className="flex items-end">
                <p className="text-sm text-gray-500 pb-2">
                  Admin, Head Quarter, and DVC users are not assigned to a campus.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2f5d31] hover:bg-[#004a6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create User'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
