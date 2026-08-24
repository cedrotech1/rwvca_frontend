import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  FileText, 
  Upload,
  Filter,
  Calendar,
  User,
  Check,
  Building,
  BarChart3,
  TrendingUp,
  Users,
  FileSpreadsheet,
  ChevronDown,
  Type
} from 'lucide-react';
import { useReports } from '../contexts/ReportsContext';
import { academicYearService } from '../services/api/academicYearService';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { useCampuses } from '../contexts/CampusesContext';
import { useServices } from '../contexts/ServicesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { 
  detectReportType, 
  getReportTypeDisplayName, 
  getReportTypeBadgeColor, 
  getReportTypeIcon,
  getReportContentDescription 
} from '../utils/reportTypeDetector';
import { ReportsManagementHeading } from '../components/PageHeading';
import { ReportListStatsCards } from '../components/ReportListStatsCards';
import { reportService } from '../services/api/reportService';
import { useNotification } from '../contexts/NotificationContext';
import { computeReportListStats, buildReportQueryFilters } from '../utils/reportStatsUtils';
import { canCreateReport, getReportCampusLabel, canPublishReport, canEditReportContent } from '../utils/reportPermissions';
import { isCampusWelfareRole } from '../utils/roleHelpers';

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [showFilters, setShowFilters] = useState(false);
  const { 
    loading: contextLoading, 
    error,
    deleteReport,
    changeReportStatus,
    exportReport,
    clearError
  } = useReports();
  const { showSuccess, showError } = useNotification();

  const { users } = useUsers();
  const { campuses, fetchCampuses } = useCampuses();
  const { services, fetchServices } = useServices();
  const { categories, fetchCategories } = useCategories();

  // Debug: Check users data when it changes
  React.useEffect(() => {
    if (users.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('👥 Available users:', users.map(u => ({ id: u.id, name: u.names, email: u.email })));
    }
  }, [users]);
  
  // Comprehensive filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    campus: 'all', // All campuses available
    type: 'all',
    userId: 'all',
    category: 'all',
    service: 'all', // Service filter
    serviceSearch: '', // Service search functionality
    academicYear: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeAllCampuses: true
  });

  useEffect(() => {
    if (currentUser?.role === 'head_quarter' || currentUser?.role === 'dvc') {
      setFilters((prev) =>
        prev.status === 'published' ? prev : { ...prev, status: 'published' }
      );
    }
  }, [currentUser?.role]);

  const [academicYears, setAcademicYears] = useState([]);
  const [activeAcademicYearId, setActiveAcademicYearId] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [filteredReports, setFilteredReports] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const [yearsResponse, activeResponse] = await Promise.all([
          academicYearService.getAcademicYears(),
          academicYearService.getActiveAcademicYear(),
        ]);

        if (yearsResponse.success) {
          setAcademicYears(yearsResponse.data || []);
        }

        if (activeResponse?.data?.id) {
          setActiveAcademicYearId(String(activeResponse.data.id));
        }
      } catch (error) {
        console.error('Failed to load academic years:', error);
      }
    };

    loadAcademicYears();
  }, []);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // Check permissions based on user role
  const permissions = {
    canCreate: canCreateReport(currentUser?.role),
    canEdit: currentUser?.role === 'admin' || isCampusWelfareRole(currentUser?.role) || currentUser?.role === 'wadden',
    canDelete: currentUser?.role === 'admin',
    canViewAll: currentUser?.role === 'admin' || currentUser?.role === 'head_quarter' || currentUser?.role === 'dvc',
    canPublish: canPublishReport(currentUser?.role) && currentUser?.role !== 'head_quarter',
    isHeadQuarter: currentUser?.role === 'head_quarter',
    isDvc: currentUser?.role === 'dvc',
  };

  
  
  const loadFilteredReports = useCallback(async () => {
    setPageLoading(true);
    try {
      const query = buildReportQueryFilters(filters, { page: 1, limit: 5000 });
      const response = await reportService.getReports(query);
      const list = response?.reports || [];
      setFilteredReports(list);
      setPagination((prev) => {
        const totalPages = Math.max(1, Math.ceil(list.length / prev.itemsPerPage));
        return {
          ...prev,
          totalItems: list.length,
          totalPages,
          currentPage: Math.min(prev.currentPage, totalPages),
        };
      });
    } catch (fetchError) {
      console.error('Error fetching reports:', fetchError);
    } finally {
      setPageLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [
    filters.search,
    filters.status,
    filters.campus,
    filters.type,
    filters.userId,
    filters.category,
    filters.service,
    filters.academicYear,
    filters.sortBy,
    filters.sortOrder,
    filters.includeAllCampuses,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFilteredReports();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [loadFilteredReports, pagination.itemsPerPage]);
  
  // Listen for global refresh events
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadFilteredReports();
    };

    window.addEventListener('forceDataRefresh', handleGlobalRefresh);
    return () => window.removeEventListener('forceDataRefresh', handleGlobalRefresh);
  }, [loadFilteredReports]);

  // Fetch services and categories on component mount
  useEffect(() => {
    fetchCampuses();
    fetchServices();
    fetchCategories({ isActive: true });
  }, [fetchCampuses, fetchServices, fetchCategories]);

  // Fetch campuses on component mount
  useEffect(() => {
    if (campuses.length === 0) {
      fetchCampuses();
    }
  }, []);

  const getFilteredServices = () => {
    if (!services || services.length === 0) return [];

    return services.filter((service) => {
      if (!service.isActive) return false;
      if (filters.category !== 'all' && String(service.categoryId) !== String(filters.category)) {
        return false;
      }
      if (!filters.serviceSearch) return true;
      const q = filters.serviceSearch.toLowerCase();
      return (
        service.name?.toLowerCase().includes(q) ||
        service.description?.toLowerCase().includes(q) ||
        service.category?.name?.toLowerCase().includes(q)
      );
    });
  };

  const handleCategoryFilterChange = (categoryId) => {
    setFilters((prev) => {
      const next = { ...prev, category: categoryId };
      if (categoryId !== 'all' && prev.service !== 'all') {
        const selected = (services || []).find((s) => String(s.id) === String(prev.service));
        if (!selected || String(selected.categoryId) !== String(categoryId)) {
          next.service = 'all';
        }
      }
      return next;
    });
  };

  const handleServiceFilterChange = (serviceId) => {
    setFilters((prev) => {
      const next = { ...prev, service: serviceId };
      if (serviceId === 'all') return next;
      const selected = (services || []).find((s) => String(s.id) === String(serviceId));
      if (selected?.categoryId != null) {
        next.category = String(selected.categoryId);
      }
      return next;
    });
  };

  const listStats = useMemo(
    () => computeReportListStats(filteredReports),
    [filteredReports]
  );

  const displayedReports = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredReports.slice(start, start + pagination.itemsPerPage);
  }, [filteredReports, pagination.currentPage, pagination.itemsPerPage]);

  const filterSummaryLabel = useMemo(() => {
    const parts = [];
    if (filters.academicYear !== 'all') {
      const year = academicYears.find((y) => String(y.id) === String(filters.academicYear));
      if (year) parts.push(year.label);
    }
    parts.push(`${listStats.totalReports} matching`);
    return parts.join(' · ');
  }, [filters.academicYear, academicYears, listStats.totalReports]);

  // Extract and group services by campus
  const getServicesGroupedByCampus = () => {
    const campusGroups = new Map();
    
    filteredReports.forEach(report => {
      if (report.service) {
        const campusName = getReportCampusLabel(report);
        if (!campusGroups.has(campusName)) {
          campusGroups.set(campusName, []);
        }
        
        // Check if service already exists for this campus
        const existingService = campusGroups.get(campusName).find(s => s.id === report.service.id);
        if (!existingService) {
          campusGroups.get(campusName).push(report.service);
        }
      }
    });
    
    return campusGroups;
  };

  // Extract and group categories by campus
  const getCategoriesGroupedByCampus = () => {
    const campusGroups = new Map();
    
    filteredReports.forEach(report => {
      if (report.service?.serviceCategory) {
        const campusName = getReportCampusLabel(report);
        if (!campusGroups.has(campusName)) {
          campusGroups.set(campusName, []);
        }
        
        // Check if category already exists for this campus
        const existingCategory = campusGroups.get(campusName).find(c => c.id === report.service.serviceCategory.id);
        if (!existingCategory) {
          campusGroups.get(campusName).push(report.service.serviceCategory);
        }
      }
    });
    
    return campusGroups;
  };

  const servicesByCampus = getServicesGroupedByCampus();
  const categoriesByCampus = getCategoriesGroupedByCampus();

  const isLoading = pageLoading || contextLoading;
  const hasReports = filteredReports.length > 0;
  const hasActiveFilters = Boolean(
    filters.search || 
    filters.status !== 'all' || 
    filters.type !== 'all' || 
    filters.campus !== 'all' || 
    filters.userId !== 'all' ||
    filters.category !== 'all' ||
    filters.service !== 'all' ||
    filters.academicYear !== 'all' ||
    filters.serviceSearch
  );

  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getReportTypeName = (report) => {
    const type = detectReportType(report);
    return getReportTypeDisplayName(type);
  };

  const getReportTypeBadgeColorLocal = (report) => {
    const type = detectReportType(report);
    return getReportTypeBadgeColor(type);
  };

  const getReportTypeIconComponent = (report) => {
    const type = detectReportType(report);
    const iconName = getReportTypeIcon(type);
    
    switch (iconName) {
      case 'Type':
        return Type;
      case 'Upload':
        return Upload;
      case 'FileSpreadsheet':
        return FileSpreadsheet;
      default:
        return FileText;
    }
  };

  const getCampusName = (report) => getReportCampusLabel(report);

  const getUserName = (userId) => {
    const user = users.find(u => u.id === parseInt(userId));
    return user ? user.names : 'Unknown User';
  };

  
  const handleEdit = (report) => {
    navigate(`/reports/edit/${report.id}`);
  };

  const handleDelete = async () => {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const response = await deleteReport(selectedReport.id);
      
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedReport(null);
        await loadFilteredReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const response = await changeReportStatus(selectedReport.id, statusAction);
      
      if (response.success) {
        showSuccess(
          statusAction === 'published'
            ? 'Report published. Headquarters has been notified.'
            : `Report status changed to ${statusAction}.`
        );
        setShowStatusModal(false);
        setSelectedReport(null);
        setStatusAction(null);
        await loadFilteredReports();
      } else {
        showError(response.message || 'Failed to change report status');
      }
    } catch (error) {
      console.error('Error changing report status:', error);
      showError(error?.response?.data?.message || error?.message || 'Failed to change report status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (reportId, report) => {
    try {
      const response = await exportReport(reportId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determine filename based on report type
      if (report.fileName) {
        // File report - use original filename
        link.setAttribute('download', report.fileName);
      } else {
        // Data report - create Excel filename
        const fileName = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`;
        link.setAttribute('download', fileName);
      }
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Report "${report.title}" exported successfully!`);
    } catch (error) {
      console.error('Error exporting report:', error);
      showError('Failed to export report. Please try again.');
    }
  };

  const handleView = (report) => {
    navigate(`/reports/view/${report.id}`);
  };

  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <ReportsManagementHeading 
        actions={
          permissions.canCreate ? [
            {
              type: "primary",
              label: "Create Report",
              icon: <Plus className="h-4 w-4" />,
              onClick: () => navigate('/reports/create')
            }
          ] : []
        }
      />

      {/* Main Content */}
      <main className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReportListStatsCards
          stats={listStats}
          loading={pageLoading}
          filterLabel={filterSummaryLabel}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-100 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={clearError}
                    className="inline-flex bg-red-100 rounded-md p-1.5 text-red-1000 hover:bg-red-100"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filters and Search */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-1000" />
                <h3 className="text-lg font-medium text-gray-900">Report Filters</h3>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-1000 hover:text-gray-700"
              >
                <span className="text-sm">
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </span>
                <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="px-4 py-4">
              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search Filter */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Reports
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      placeholder="Search by title or description..."
                      className="block w-full pl-10 pr-3 py-3 bg-gray-100 rounded-sm leading-5 placeholder-gray-1000 focus:ring-2 focus:ring-blue-1000 transition-colors"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {permissions.isHeadQuarter || permissions.isDvc ? (
                    <div className="block w-full px-3 py-3 bg-gray-100 rounded-sm text-sm text-gray-700">
                      {permissions.isDvc ? 'Published HQ reports only' : 'Published only'}
                    </div>
                  ) : (
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  )}
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="file">File Reports</option>
                    <option value="text">Text Reports</option>
                    <option value="table">Table Reports</option>
                  </select>
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Campus Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus
                  </label>
                  <select
                    value={filters.campus}
                    onChange={(e) => setFilters({...filters, campus: e.target.value})}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="all">All Campuses</option>
                    {permissions.canViewAll && (
                      <option value="general">General</option>
                    )}
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created By
                  </label>
                  <select
                    value={filters.userId}
                    onChange={(e) => setFilters({...filters, userId: e.target.value})}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="all">All Users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.names} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Year Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={filters.academicYear}
                    onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="all">All Academic Years</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.label}{year.isActive ? ' (Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category + Service Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleCategoryFilterChange(e.target.value)}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {(categories || [])
                      .filter((c) => c.isActive !== false)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional — narrows services below to this category
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Report
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={filters.serviceSearch}
                        onChange={(e) => setFilters({...filters, serviceSearch: e.target.value})}
                        placeholder="Search services..."
                        className="block w-full pl-10 pr-3 py-2 bg-gray-100 rounded-sm text-sm focus:ring-2 focus:ring-blue-1000 transition-colors"
                      />
                    </div>

                    <select
                      value={filters.service}
                      onChange={(e) => handleServiceFilterChange(e.target.value)}
                      className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                    >
                      <option value="all">
                        {filters.category === 'all'
                          ? 'All Services'
                          : 'All services in category'}
                      </option>
                      {getFilteredServices().map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>

                    {getFilteredServices().length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        {filters.serviceSearch
                          ? `No services found matching "${filters.serviceSearch}"`
                          : filters.category !== 'all'
                            ? 'No services in this category'
                            : 'No services available'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Per Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Per Page
                  </label>
                  <select
                    value={pagination.itemsPerPage}
                    onChange={(e) => setPagination({...pagination, itemsPerPage: parseInt(e.target.value), currentPage: 1})}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value={5}>5 items</option>
                    <option value={10}>10 items</option>
                    <option value={25}>25 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                </div>
              </div>

              {/* Sort and Campus Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    <option value="title">Title</option>
                    <option value="totalRows">Total Rows</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                    className="block w-full px-3 py-3 bg-gray-100 rounded-sm focus:ring-2 focus:ring-blue-1000 transition-colors sm:text-sm"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>

                {/* Campus Toggle */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({...filters, includeAllCampuses: !filters.includeAllCampuses});
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-100 ${
                      filters.includeAllCampuses 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform hover:scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100 shadow-md transform hover:scale-105'
                    }`}
                  >
                    {filters.includeAllCampuses ? 'All Campuses' : 'My Campus'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setFilters({
                      search: '',
                      status: permissions.isHeadQuarter || permissions.isDvc ? 'published' : 'all',
                      campus: 'all',
                      type: 'all',
                      userId: 'all',
                      category: 'all',
                      service: 'all',
                      serviceSearch: '',
                      academicYear: 'all',
                      sortBy: 'createdAt',
                      sortOrder: 'desc',
                      includeAllCampuses: true
                    });
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="inline-flex items-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm transform hover:scale-105 transition-all duration-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>

                {/* Refresh */}
                <button
                  onClick={() => loadFilteredReports()}
                  className="inline-flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 shadow-sm transform hover:scale-105 transition-all duration-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>

              {/* Active Filters Display - Only show when filters are actually applied */}
              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.status !== 'all' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.type !== 'all' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Type: {filters.type}
                    </span>
                  )}
                  {filters.search && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.campus !== 'all' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    Campus: {filters.campus === 'general'
                      ? 'General'
                      : campuses.find(c => c.id.toString() === filters.campus.toString())?.name || filters.campus}
                  </span>
                )}
                {filters.userId !== 'all' && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    Creator: {getUserName(filters.userId)}
                  </span>
                )}
                {filters.academicYear !== 'all' && (
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                    Year: {academicYears.find((y) => String(y.id) === String(filters.academicYear))?.label || filters.academicYear}
                  </span>
                )}
                {filters.category !== 'all' && (
                  <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm">
                    Category:{' '}
                    {(categories || []).find((c) => String(c.id) === String(filters.category))?.name ||
                      filters.category}
                  </span>
                )}
                {filters.service !== 'all' && (
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                    Service: {services.find((s) => String(s.id) === String(filters.service))?.name || filters.service}
                  </span>
                )}
                                </div>
              )}
            </div>
          )}
        </div>

        {/* Reports Table - Only show when there are reports */}
        {hasReports && (
          <div key="reports-table" className="bg-white  overflow-hidden rounded-sm">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Reports List</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-1000">
              A list of all reports including their title, status, creator, and creation date.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    No.
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Report title
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Status
                  </th>
                
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Campus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-1000 uppercase tracking-wider border border-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {displayedReports.map((report, index) => (
                  <tr key={report.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-100">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border border-gray-100">
                      <div className="p-3">
                        <div className="text-sm font-medium text-blue-900">{report.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border border-gray-100">
                      <div className="">
                        <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getReportTypeBadgeColorLocal(report)}`}>
                          {(() => {
                            const IconComponent = getReportTypeIconComponent(report);
                            return <IconComponent className="h-3 w-3 mr-1 text-purple-700" />;
                          })()}
                          <span className="text-purple-900">{getReportTypeName(report)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border border-gray-100">
                      <div className="">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-100">
                      <div className="">
                        {getCampusName(report)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-100">
                      <div className="">
                        {report.service ? (
                          <div className="text-orange-900">
                            <div className="text-sm font-medium">{report.service.name}</div>
                          </div>
                        ) : (
                          <span className="text-orange-400 italic">No service</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-100">
                      {report.academicYear?.label || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-1000 border border-gray-100">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(report)}
                          className="text-blue-600 hover:text-blue-900 border border-gray-300 rounded p-1"
                          title="View Report"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {canEditReportContent(currentUser?.role, report) && (
                          <button
                            onClick={() => handleEdit(report)}
                            className="text-green-600 hover:text-green-900 border border-gray-300 rounded p-1"
                            title="Edit Report"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {permissions.canPublish && report.status === 'draft' && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setStatusAction('published');
                              setShowStatusModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 border border-gray-300 rounded p-1"
                            title="Publish Report"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        
                      
                        
                        {permissions.canDelete && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 border border-gray-300 rounded p-1"
                            title="Delete Report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Modern Pagination */}
        {hasReports && (
          <div className="bg-white shadow rounded-lg px-4 py-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {filteredReports.length === 0 ? 0 : ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => setPagination({...pagination, currentPage: Math.max(1, pagination.currentPage - 1)})}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      const total = pagination.totalPages || 1;
                      const current = pagination.currentPage;
                      if (total <= 7) return true;
                      return pageNum === 1 || pageNum === total || Math.abs(pageNum - current) <= 1;
                    })
                    .map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPagination({...pagination, currentPage: pageNum})}
                        className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                          pagination.currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={() => setPagination({...pagination, currentPage: Math.min(pagination.totalPages || 1, pagination.currentPage + 1)})}
                  disabled={pagination.currentPage === (pagination.totalPages || 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-100 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Only show when not loading and truly empty with stable condition */}
        {!pageLoading && !hasReports && (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
              <h3 className="text-lg leading-6 font-medium text-gray-900">No Reports Found</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-1000">
                Try adjusting your filters or searching for something else.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Change Report Status
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change the status of "{selectedReport?.title}" to <span className="font-semibold">{statusAction}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedReport(null);
                  setStatusAction(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Change to {statusAction}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
