import React from 'react';
import { AlertTriangle, User, Trash2, Eye, EyeOff } from 'lucide-react';

export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'delete',
  userName = '',
  loading = false 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'activate':
        return <Eye className="h-6 w-6 text-green-600" />;
      case 'deactivate':
        return <EyeOff className="h-6 w-6 text-orange-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'activate':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'deactivate':
        return 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';
      default:
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
    }
  };

  const getConfirmText = () => {
    switch (type) {
      case 'delete':
        return 'Delete';
      case 'activate':
        return 'Activate';
      case 'deactivate':
        return 'Deactivate';
      default:
        return 'Confirm';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gray-100"></div>
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 z-10">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            {getIcon()}
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {title}
          </h3>
          {userName && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                User: <span className="font-semibold text-gray-900">{userName}</span>
              </p>
            </div>
          )}
          <div className="text-sm text-gray-500">
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              getConfirmText()
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
