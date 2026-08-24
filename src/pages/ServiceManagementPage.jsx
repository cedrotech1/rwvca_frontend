import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { ServiceManagementHeading } from '../components/PageHeading';
import {
  exportReportingFrameworkToExcel,
  exportReportingFrameworkToWord,
  exportReportingFrameworkToPdf,
} from '../utils/reportingFrameworkExport';

const WhatToReportCell = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const content = String(text || '').trim();

  if (!content) {
    return <span className="text-sm text-gray-400 italic">No reporting guidance defined</span>;
  }

  const lines = content.split('\n');
  const isLong = lines.length > 10 || content.length > 500;
  const shown = !expanded && isLong ? `${lines.slice(0, 10).join('\n')}\n…` : content;

  return (
    <div>
      <pre className="m-0 whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
        {shown}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 inline-flex items-center text-xs font-medium text-[#2f5d31] hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Show full list
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const ServiceManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const {
    services,
    loading,
    fetchServices,
    deleteService,
  } = useServices();
  const { categories, fetchCategories } = useCategories();

  const canManageServices = user?.role === 'admin' || user?.role === 'head_quarter';

  const [filters, setFilters] = useState({
    search: '',
    isActive: 'all',
    categoryId: 'all',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return undefined;
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  useEffect(() => {
    fetchServices(filters);
    fetchCategories();
  }, [filters, fetchServices, fetchCategories]);

  const handleDelete = async () => {
    try {
      await deleteService(selectedService.id);
      showSuccess('Service deleted successfully');
      setShowDeleteModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      showError('Failed to delete service');
    }
  };

  const filteredServices = useMemo(() => {
    let filtered = services || [];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((service) =>
        service.name?.toLowerCase().includes(q) ||
        service.description?.toLowerCase().includes(q) ||
        service.whatToReport?.toLowerCase().includes(q) ||
        service.category?.name?.toLowerCase().includes(q)
      );
    }

    if (filters.isActive !== 'all') {
      filtered = filtered.filter((service) => service.isActive === (filters.isActive === 'true'));
    }

    if (filters.categoryId !== 'all') {
      filtered = filtered.filter((service) => String(service.categoryId) === String(filters.categoryId));
    }

    return filtered;
  }, [services, filters]);

  const tableRows = useMemo(() => {
    const categoryOrder = new Map(
      (categories || []).map((category, index) => [String(category.id), category.sortOrder ?? index])
    );

    const groups = new Map();

    filteredServices.forEach((service) => {
      const key = service.categoryId != null ? String(service.categoryId) : 'uncategorized';
      const name = service.category?.name || 'Uncategorized';
      const sortOrder =
        key === 'uncategorized'
          ? Number.MAX_SAFE_INTEGER
          : (categoryOrder.get(key) ?? Number.MAX_SAFE_INTEGER - 1);

      if (!groups.has(key)) {
        groups.set(key, { key, name, sortOrder, services: [] });
      }
      groups.get(key).services.push(service);
    });

    const orderedGroups = Array.from(groups.values())
      .map((group) => ({
        ...group,
        services: [...group.services].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''))
        ),
      }))
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });

    const rows = [];
    orderedGroups.forEach((group) => {
      group.services.forEach((service, index) => {
        rows.push({
          service,
          categoryName: group.name,
          showCategory: index === 0,
          categoryRowSpan: group.services.length,
        });
      });
    });

    return rows;
  }, [filteredServices, categories]);

  const handleExport = (format) => {
    if (!tableRows.length) {
      showError('No reporting framework items to export');
      setShowExportMenu(false);
      return;
    }

    const filename = `reporting_framework_${filteredServices.length}`;
    let result;

    if (format === 'excel') {
      result = exportReportingFrameworkToExcel(tableRows, filename);
    } else if (format === 'word') {
      result = exportReportingFrameworkToWord(tableRows, filename);
    } else {
      result = exportReportingFrameworkToPdf(tableRows);
    }

    setShowExportMenu(false);
    if (result.success) {
      showSuccess(
        format === 'pdf'
          ? 'Print dialog opened — choose Save as PDF'
          : `Reporting framework exported to ${format === 'excel' ? 'Excel' : 'Word'}`
      );
    } else {
      showError(result.message || 'Export failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ServiceManagementHeading
        actions={
          canManageServices
            ? [
                {
                  type: 'outline',
                  label: 'Manage Categories',
                  onClick: () => navigate('/management/categories'),
                },
                {
                  type: 'primary',
                  label: 'Add Service Report',
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => navigate('/services/create'),
                },
              ]
            : []
        }
      />

      <div className="bg-white rounded-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search category, service, what to report..."
                  className="block w-full pl-10 pr-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="block w-full px-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="block w-full px-3 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Reporting Framework ({filteredServices.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Category · Service Report · What to Report
            </p>
          </div>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((open) => !open)}
              disabled={!tableRows.length}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Export list
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('word')}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileType className="h-4 w-4 text-blue-600" />
                  Export Word
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Export Excel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading services...</div>
          ) : tableRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No service reports found</div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-1/5">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-1/4">
                      Service Report
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                      What to Report
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(({ service, categoryName, showCategory, categoryRowSpan }) => (
                    <tr key={service.id} className="align-top">
                      {showCategory && (
                        <td
                          rowSpan={categoryRowSpan}
                          className="px-4 py-4 border-b border-r border-gray-200 bg-gray-50 align-top"
                        >
                          <div className="text-sm font-semibold text-gray-900 sticky top-0">
                            {categoryName}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {categoryRowSpan} report{categoryRowSpan === 1 ? '' : 's'}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-4 border-b border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        <span
                          className={`mt-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            service.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-b border-r border-gray-200">
                        <WhatToReportCell text={service.whatToReport} />
                      </td>
                      <td className="px-4 py-4 border-b border-gray-200 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/services/view/${service.id}`)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="View service"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageServices && (
                            <>
                              <button
                                onClick={() => navigate(`/services/edit/${service.id}`)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit service"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedService(service);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete service"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Service</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete service &quot;
                  <span className="font-semibold">{selectedService.name}</span>&quot;?
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
