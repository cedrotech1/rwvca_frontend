import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const StatusModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'activate', // 'activate' or 'deactivate'
  userName = '',
  loading = false 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    return type === 'activate' 
      ? <Eye className="h-6 w-6 text-green-600" />
      : <EyeOff className="h-6 w-6 text-orange-600" />;
  };

  const getButtonColor = () => {
    return type === 'activate'
      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';
  };

  const getConfirmText = () => {
    return type === 'activate' ? 'Activate' : 'Deactivate';
  };

  const getIconBgColor = () => {
    return type === 'activate' ? 'bg-green-100' : 'bg-orange-100';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gray-100"></div>
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 z-10">
        {/* Header */}
        <div className="text-center mb-4">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${getIconBgColor()} mb-4`}>
            {getIcon()}
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {title}
          </h3>
          {userName && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to {type} <span className="font-semibold text-gray-900">{userName}</span>?
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
