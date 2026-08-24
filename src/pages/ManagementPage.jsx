import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Tag, Package, Settings, Users, FileText, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManageServices = user?.role === 'admin' || user?.role === 'head_quarter' || user?.role === 'warefare' || user?.role === 'it' || user?.role === 'wadden';

  const managementCards = [
    {
      id: 'categories',
      title: 'Categories',
      description: 'Create and manage reporting categories (e.g. HOUSING & ACCOMMODATION, HEALTH SERVICES)',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-indigo-500',
      path: '/management/categories'
    },
    {
      id: 'services',
      title: 'Service Reports',
      description: 'Manage service reports and What to Report guidance under each category',
      icon: <Tag className="h-8 w-8" />,
      color: 'bg-blue-500',
      path: '/management/services'
    },
    ...(user?.role === 'head_quarter' || user?.role === 'admin' ? [{
      id: 'campuses',
      title: 'Campus Management',
      description: 'Manage university campuses, their locations, and operational status',
      icon: <Building className="h-8 w-8" />,
      color: 'bg-purple-500',
      path: '/management/campuses'
    }] : [])
  ];

  if (!canManageServices) {
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
        <div className="flex items-center">
          <Wrench className="h-8 w-8 text-gray-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Management Center</h1>
            <p className="mt-2 text-gray-600">Manage university services, categories, and campuses</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Services & Categories</h3>
              <p className="text-sm text-gray-600">Manage services and categories</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Campuses</h3>
              <p className="text-sm text-gray-600">Manage campus locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {managementCards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.path)}
            className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className={`${card.color} p-6`}>
              <div className="text-white">
                {card.icon}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4">{card.description}</p>
              <div className="flex items-center text-blue-600 font-medium hover:text-blue-700">
                <span>Manage {card.title.split(' ')[0]}</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Management Access</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>As a {user?.role}, you have access to manage services and categories for your campus.</p>
              <p className="mt-1">These tools allow you to configure the university's service infrastructure and organizational structure.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
