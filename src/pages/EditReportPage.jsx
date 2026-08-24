import { isCampusWelfareRole } from '../utils/roleHelpers';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  ArrowLeft,
  FileSpreadsheet,
  Save,
  Download,
  X,
  Info,
  AlertCircle,
  Type
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportsContext';
import { sanitizeHtml } from '../utils/sanitize';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';
import { useCampuses } from '../contexts/CampusesContext';
import { useUsers } from '../contexts/UsersContext';
import { 
  detectReportType, 
  getReportTypeDisplayName, 
  getReportTypeBadgeColor, 
  getReportTypeIcon,
  getReportContentDescription 
} from '../utils/reportTypeDetector';
import { academicYearService } from '../services/api/academicYearService';
import RichTextEditor from '../components/RichTextEditor';
import { EditReportHeading } from '../components/PageHeading';
import {
  clearTableData,
  generateSampleTableData,
  getHeadersFromServiceFields,
  createEmptyTableRow,
  getReportTableColumns,
  getRequestTableSchema,
} from '../utils/reportTableUtils';
import { canPublishReport, canEditReportContent } from '../utils/reportPermissions';

export const EditReportPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { 
    getReportById, 
    updateReport, 
    updateFileReport,
    clearError,
    loading
  } = useReports();
  const { showSuccess, showError } = useNotification();
  const { services, fetchServices } = useServices();
  const { campuses, fetchCampuses } = useCampuses();
  const { users } = useUsers();
  
  const [reportType, setReportType] = useState('data'); // 'data', 'file', or 'text'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    file: null,
    text_report: '',
    serviceId: '',
    academicYearId: '',
    challenge: '',
    wayForward: ''
  });
  const [report, setReport] = useState(null);
  const [originalReport, setOriginalReport] = useState(null);
  const [headers, setHeaders] = useState(['Column 1']);
  const [rows, setRows] = useState([['']]);
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const reportLoadedRef = useRef(false);
  const [filteredServices, setFilteredServices] = useState([]);
  const [serviceFields, setServiceFields] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [requestRowMode, setRequestRowMode] = useState(null);

  const renderReportingGuidance = () => (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 flex-shrink-0" />
        <div className="w-full">
          <h5 className="text-sm font-semibold text-amber-900">
            Report on the service fields below
          </h5>
          <p className="mt-1 text-sm text-amber-800">
            In this service, you are expected to report about the fields/cards shown below. Add a short paragraph or upload a file that clearly explains each relevant field so reviewers can understand what is being reported.
          </p>
          {serviceFields.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceFields.map((field) => (
                <div
                  key={field.id || field.label}
                  className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                >
                  <div className="font-medium">{field.label}</div>
                  <div className="text-xs text-gray-500">
                    {field.required ? 'Required field' : 'Optional field'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-700">
              Select a service first to see the fields you should report on.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Check permissions
  const permissions = {
    canEdit: currentUser?.role === 'admin' || isCampusWelfareRole(currentUser?.role) || currentUser?.role === 'wadden',
  };

  useEffect(() => {
    // Reset ref when id changes
    reportLoadedRef.current = false;
    
    if (!permissions.canEdit) {
      navigate('/reports');
      return;
    }

    // Prevent multiple API calls
    if (reportLoadedRef.current) {
      return;
    }

    // Load existing report data
    const loadReport = async () => {
      try {
        reportLoadedRef.current = true; // Mark as loading
        console.log('🔍 Loading report with ID:', id);
        console.log('👤 Current user:', currentUser);
        const report = await getReportById(id);
        console.log('📊 Retrieved report:', report);

        if (!canEditReportContent(currentUser?.role, report)) {
          showError(
            report?.status === 'published'
              ? 'Published reports cannot be edited.'
              : 'You do not have permission to edit this report.'
          );
          navigate('/reports');
          return;
        }
        
        // Store original report for validation
        setOriginalReport(report);
        
        // Detect report type using utility function
        const detectedType = detectReportType(report);
        setReportType(detectedType);

        // Set form data with all available fields
        setFormData({
          title: report.title || '',
          description: report.description || '',
          status: report.status || 'draft',
          file: null,
          text_report: report.text_report || '',
          serviceId: report.serviceId || '',
          academicYearId: report.academicYearId || report.academicYear?.id || '',
          challenge: report.challenge || '',
          wayForward: report.wayForward || ''
        });

        // Set data based on report type
        if (detectedType === 'file') {
          // File report - no table data needed
          console.log('📁 Loading file report');
        } else if (detectedType === 'text') {
          // Text report - no table data needed
          console.log('📝 Loading text report');
        } else {
          const requestSchema = getRequestTableSchema(report);
          const columns = getReportTableColumns(report);
          if (requestSchema?.rowMode) {
            setRequestRowMode(requestSchema.rowMode);
          } else if (report.reportRequestId) {
            setRequestRowMode('single');
          } else {
            setRequestRowMode(null);
          }

          if (columns.length > 0) {
            setServiceFields(columns);
            setHeaders(columns.map((field) => field.label));

            let dataRows = [];
            if (Array.isArray(report.data)) {
              dataRows = report.data.map((item) => {
                if (item && item.rowData) {
                  if (Array.isArray(item.rowData)) {
                    return item.rowData;
                  }
                  if (typeof item.rowData === 'object' && item.rowData.rowData && Array.isArray(item.rowData.rowData)) {
                    return item.rowData.rowData;
                  }
                  if (typeof item.rowData === 'object') {
                    const nestedData = item.rowData;
                    const arrayValue = Object.values(nestedData).find((val) => Array.isArray(val));
                    if (arrayValue) {
                      return arrayValue;
                    }
                    const metaFields = ['rowIndex'];
                    const filtered = Object.entries(nestedData)
                      .filter(([key]) => !metaFields.includes(key))
                      .map(([, value]) => value);
                    return filtered.length > 0 ? filtered : [''];
                  }
                }

                if (item && Array.isArray(item)) {
                  return item;
                }
                if (typeof item === 'object') {
                  const dbFields = ['id', 'reportId', 'rowIndex', 'status', 'createdAt', 'updatedAt'];
                  const filtered = Object.entries(item)
                    .filter(([key]) => !dbFields.includes(key))
                    .map(([, value]) => value);
                  return filtered.length > 0 ? filtered : [''];
                }
                return [''];
              });
            }

            const colCount = columns.length;
            dataRows = dataRows.map((row) => {
              const next = createEmptyTableRow(columns);
              for (let i = 0; i < Math.min(row.length, colCount); i += 1) {
                next[i] = row[i] ?? '';
              }
              return next;
            });

            if (requestSchema?.rowMode === 'single') {
              dataRows = dataRows.slice(0, 1);
            }

            setRows(dataRows.length > 0 ? dataRows : [createEmptyTableRow(columns)]);
          }
        }
      } catch (error) {
        console.error('Error loading report:', error);
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          showError('Request timeout. Please try again.');
        } else if (error.response?.status === 404) {
          showError('Report not found');
        } else if (error.response?.status === 403) {
          showError('You do not have permission to edit this report');
        } else {
          showError('Failed to load report. Please try again.');
        }
        navigate('/reports');
      } finally {
        setInitialLoading(false);
      }
    };

    loadReport();
    
    // Cleanup function
    return () => {
      reportLoadedRef.current = false;
    };
  }, [id]); // Only depend on id to prevent infinite loops

  // Load campuses and services
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCampuses(),
          fetchServices(),
          academicYearService.getAcademicYears().then((response) => {
            if (response.success) {
              setAcademicYears(response.data || []);
            }
          }),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    if (permissions.canEdit) {
      loadData();
    }
  }, [fetchCampuses, fetchServices, permissions.canEdit]);

  // Filter services - since services are shared across all campuses, show all active services
  useEffect(() => {
    const filtered = services.filter(service => service.isActive);
    setFilteredServices(filtered);
  }, [services]);

  // Handle service selection and load service fields
  const handleServiceChange = (serviceId) => {
    setFormData(prev => ({ ...prev, serviceId }));

    if (requestRowMode) {
      return;
    }

    if (reportType === 'table') {
      const service = services.find(s => s.id === parseInt(serviceId));
      setSelectedService(service);
      
      if (service && service.serviceFields && service.serviceFields.length > 0) {
        const fields = service.serviceFields;
        setServiceFields(fields);
        setHeaders(getHeadersFromServiceFields(fields));

        const existingRows = rows.length > 0 ? rows : [createEmptyTableRow(fields)];
        const adjustedRows = existingRows.map((row) => {
          const adjustedRow = createEmptyTableRow(fields);
          for (let i = 0; i < Math.min(row.length, fields.length); i++) {
            adjustedRow[i] = row[i];
          }
          return adjustedRow;
        });
        setRows(adjustedRows);

        setErrors(prev => ({ ...prev, serviceId: null }));
      } else {
        // Service has no fields
        setSelectedService(service);
        setServiceFields([]);
        setHeaders(['Column 1']);
        setRows([['']]);
        
        // Show error message
        setErrors(prev => ({ 
          ...prev, 
          serviceId: 'This service has no fields defined. Please choose a different service or change the report type to File or Text.' 
        }));
      }
    }
  };

  const resetForm = () => {
    // Don't reset on edit page - keep original data
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.serviceId) {
      newErrors.serviceId = 'Service selection is required';
    }
    if (!formData.academicYearId) {
      newErrors.academicYearId = 'Academic year is required';
    }
    if (reportType === 'table') {
      if (headers.some(h => !h.trim())) {
        newErrors.headers = 'All headers must have names';
      }
      if (rows.length === 0) {
        newErrors.rows = 'At least one row of data is required';
      }
      
      // Validate required fields in table data
      if (serviceFields.length > 0) {
        serviceFields.forEach((field, colIndex) => {
          if (field.required) {
            rows.forEach((row, rowIndex) => {
              if (!row[colIndex] || row[colIndex].trim() === '') {
                newErrors[`cell-${rowIndex}-${colIndex}`] = `${field.label} is required`;
              }
            });
          }
        });
      }
    }
    if (reportType === 'text' && !formData.text_report.trim()) {
      newErrors.text_report = 'Text content is required';
    }
    if (reportType === 'file' && !formData.file && !originalReport.fileName) {
      newErrors.file = 'File is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    setErrors({});

    const effectiveStatus = canPublishReport(currentUser?.role) ? formData.status : 'draft';

    try {
      let response;
      
      if (reportType === 'file') {
        // Handle file report update
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title);
        formDataObj.append('description', formData.description);
        formDataObj.append('status', effectiveStatus);
        formDataObj.append('serviceId', formData.serviceId);
        formDataObj.append('academicYearId', formData.academicYearId);
        formDataObj.append('challenge', formData.challenge);
        formDataObj.append('wayForward', formData.wayForward);
        if (formData.file) {
          formDataObj.append('file', formData.file);
        }
        response = await updateFileReport(id, formDataObj);
      } else if (reportType === 'text') {
        // Handle text report update
        const reportData = {
          title: formData.title,
          description: formData.description,
          status: effectiveStatus,
          text_report: formData.text_report,
          serviceId: formData.serviceId,
          academicYearId: formData.academicYearId,
          challenge: formData.challenge,
          wayForward: formData.wayForward,
          headers: [], // Empty headers for text reports
          data: [] // Empty data for text reports
        };
        response = await updateReport(id, reportData);
      } else {
        // Handle table report update
        const reportData = {
          title: formData.title,
          description: formData.description,
          status: effectiveStatus,
          headers: headers.filter(h => h.trim()),
          data: rows.map((row, index) => ({
            rowIndex: index + 1,
            rowData: row
          })),
          serviceId: formData.serviceId,
          academicYearId: formData.academicYearId,
          challenge: formData.challenge,
          wayForward: formData.wayForward
        };
        response = await updateReport(id, reportData);
      }
      
      if (response.success) {
        showSuccess(`Report "${formData.title}" updated successfully!`);
        setTimeout(() => {
          navigate('/reports');
          window.location.reload();
        }, 1500);
      } else {
        showError(response.message || 'Failed to update report');
        setErrors(response.message ? { general: response.message } : {});
      }
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message
        || error?.message
        || 'An error occurred. Please try again.';
      showError(apiMessage);
      setErrors({ general: apiMessage });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Helper function to get icon component
  const getReportTypeIconComponent = (type) => {
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

  const addRow = () => {
    if (requestRowMode === 'single') return;
    setRows([...rows, createEmptyTableRow(serviceFields)]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleClearTable = () => {
    const cleared = clearTableData(serviceFields);
    if (cleared.headers.length > 0) {
      setHeaders(cleared.headers);
    }
    setRows(cleared.rows);
  };

  const handleLoadSampleData = () => {
    if (!serviceFields.length) {
      showError('Please select a service with defined fields first');
      return;
    }
    const sample = generateSampleTableData(serviceFields);
    setHeaders(sample.headers);
    setRows(sample.rows);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
    
    // Validate required fields
    if (serviceFields[colIndex] && serviceFields[colIndex].required) {
      if (!value || value.trim() === '') {
        setErrors(prev => ({
          ...prev,
          [`cell-${rowIndex}-${colIndex}`]: `${serviceFields[colIndex].label} is required`
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`cell-${rowIndex}-${colIndex}`];
          return newErrors;
        });
      }
    }
  };

  // Render appropriate input type for each cell based on service field
  const renderCellInput = (rowIndex, colIndex, value) => {
    const field = serviceFields[colIndex];
    
    if (!field) {
      // Default text input if no field definition
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
          className={`w-full px-2 py-1 text-sm bg-gray-100 border-0 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
            errors[`cell-${rowIndex}-${colIndex}`] ? 'ring-2 ring-red-500' : ''
          }`}
          placeholder="Enter data..."
        />
      );
    }

    const hasError = errors[`cell-${rowIndex}-${colIndex}`];
    const isRequired = field.required;

    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className={`w-full px-2 py-1 text-sm bg-gray-100 border-0 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
              hasError ? 'ring-2 ring-red-500' : ''
            }`}
            placeholder="Enter number..."
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className={`w-full px-2 py-1 text-sm bg-gray-100 border-0 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
              hasError ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <option value="">Select...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.checked ? 'true' : 'false')}
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                hasError ? 'ring-2 ring-red-500' : ''
              }`}
            />
            <span className="ml-2 text-sm text-gray-600">
              {value === 'true' || value === true ? 'Yes' : 'No'}
            </span>
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            className={`w-full px-2 py-1 text-sm bg-gray-100 border-0 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
              hasError ? 'ring-2 ring-red-500' : ''
            }`}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            rows={2}
            className={`w-full px-2 py-1 text-sm bg-gray-100 border-0 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors resize-none ${
              hasError ? 'ring-2 ring-red-500' : ''
            }`}
            placeholder="Enter text..."
          />
        );
      
      default: // text
        return (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              className={`w-full px-2 py-1 text-sm bg-gray-100 border-0 rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                hasError ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="Enter text..."
            />
            {isRequired && !value && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-xs">*</span>
            )}
          </div>
        );
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f5d31] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <EditReportHeading 
        reportTitle={report?.title}
        actions={[
          {
            type: "outline",
            label: "Cancel",
            onClick: () => navigate('/reports')
          },
          {
            type: "primary",
            label: "Update Report",
            icon: <Save className="h-4 w-4" />,
            onClick: handleSubmit
          }
        ]}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Edit Report Information</h2>
            <p className="text-gray-600">Update the information below to modify the report.</p>
          </div>

          {/* Report Type Display (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
            <div className="grid grid-cols-3 gap-2">
              {/* Text Report */}
              <div
                className={`p-3 border-2 rounded-lg text-center ${
                  reportType === 'text' 
                    ? 'border-[#2f5d31] bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Type className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs font-medium text-gray-900">Text</div>
                <div className="text-xs text-gray-500">Rich text</div>
              </div>

              {/* Table Report */}
              <div
                className={`p-3 border-2 rounded-lg text-center ${
                  reportType === 'table' 
                    ? 'border-[#2f5d31] bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs font-medium text-gray-900">Table</div>
                <div className="text-xs text-gray-500">Data table</div>
              </div>

              {/* File Report */}
              <div
                className={`p-3 border-2 rounded-lg text-center ${
                  reportType === 'file' 
                    ? 'border-[#2f5d31] bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Upload className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs font-medium text-gray-900">File</div>
                <div className="text-xs text-gray-500">Upload file</div>
              </div>
            </div>
            
            {/* Current Type Badge */}
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600 mr-2">Current type:</span>
              <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getReportTypeBadgeColor(reportType)}`}>
                {(() => {
                  const IconComponent = getReportTypeIconComponent(reportType);
                  return <IconComponent className="h-4 w-4 mr-1" />;
                })()}
                {getReportTypeDisplayName(reportType)}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                    errors.title ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Enter report title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (if any)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                placeholder="Enter report description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge (if any)
                </label>
                <textarea
                  value={formData.challenge}
                  onChange={(e) => setFormData(prev => ({ ...prev, challenge: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Way Forward (if any)
                </label>
                <textarea
                  value={formData.wayForward}
                  onChange={(e) => setFormData(prev => ({ ...prev, wayForward: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              {canPublishReport(currentUser?.role) ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              ) : (
                <div className="mt-1 block w-full bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-700">
                  Draft
                  <p className="text-xs text-gray-500 mt-1">
                    Only campus welfare can publish. Headquarters is notified when the report is published.
                  </p>
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service *
                {currentUser?.campus && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {campuses.find(c => c.id === parseInt(currentUser.campus))?.name || 'Your Campus'}
                  </span>
                )}
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className={`mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                  errors.serviceId ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <option value="">Select service *</option>
                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {filteredServices.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">No active services available</p>
              )}
              {errors.serviceId && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>
              )}
            </div>

            {/* Academic Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <select
                value={formData.academicYearId}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                className={`mt-1 block w-full bg-gray-100 border-0 rounded-md px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                  errors.academicYearId ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <option value="">Select academic year *</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.label}
                  </option>
                ))}
              </select>
              {errors.academicYearId && (
                <p className="mt-1 text-sm text-red-600">{errors.academicYearId}</p>
              )}
            </div>

            {/* Table Report Section */}
            {reportType === 'table' && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Data Table</h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={addRow}
                      disabled={!serviceFields.length || requestRowMode === 'single'}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </button>
                  </div>
                </div>

                {/* Interactive Data Table */}
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, index) => {
                          const field = serviceFields[index];
                          return (
                          <th key={index} className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300 border-r group">
                            <div className="flex items-center">
                              <input
                                type="text"
                                value={header}
                                readOnly
                                className={`w-full px-2 py-1 text-sm font-medium bg-gray-100 border-0 rounded cursor-default ${
                                  errors.headers ? 'ring-2 ring-red-500' : ''
                                }`}
                                placeholder={`Column ${index + 1}`}
                              />
                              {field && field.required && (
                                <span className="ml-2 text-red-500 text-xs" title="Required field">*</span>
                              )}
                            </div>
                          </th>
                          );
                        })}
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 group">
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="px-4 py-2 border-b border-gray-200 border-r">
                              {renderCellInput(rowIndex, colIndex, cell)}
                              {errors[`cell-${rowIndex}-${colIndex}`] && (
                                <p className="mt-1 text-xs text-red-600">{errors[`cell-${rowIndex}-${colIndex}`]}</p>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-2 text-center border-b border-gray-200">
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRow(rowIndex)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td 
                          colSpan={headers.length} 
                          className="px-4 py-3 text-center text-sm text-gray-500 border-t border-gray-300 cursor-pointer hover:bg-gray-50"
                          onClick={addRow}
                        >
                          <Plus className="h-4 w-4 inline mr-2" />
                          Click to add new row
                        </td>
                        <td className="px-4 py-3 text-center border-t border-gray-300">
                          <button
                            type="button"
                            onClick={addRow}
                            className="text-blue-600 hover:text-blue-700"
                            title="Add Row"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Table Summary */}
                <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{headers.length}</span> columns × <span className="font-medium">{rows.length}</span> rows
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleClearTable}
                      disabled={!serviceFields.length}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Table
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      disabled={!serviceFields.length}
                      className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Load Sample Data
                    </button>
                  </div>
                </div>
                
                {errors.rows && (
                  <p className="text-sm text-red-600 mt-2">{errors.rows}</p>
                )}
              </div>
            )}

            {/* File Report Section */}
            {reportType === 'file' && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">File Upload</h4>

                {renderReportingGuidance()}
                
                {/* Current File Display */}
                {(originalReport?.fileName || formData.file) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Current File</h5>
                    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.file ? formData.file.name : originalReport?.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formData.file 
                              ? `New file • ${(formData.file.size / 1024).toFixed(2)} KB`
                              : `Existing file • ${originalReport?.fileSize ? `${(originalReport.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {originalReport?.fileName && !formData.file && (
                          <button
                            type="button"
                            onClick={() => window.open(`/api/v1/reports/download/${originalReport.id}`, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Download current file"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, file: null }));
                            if (errors.file) {
                              setErrors(prev => ({ ...prev, file: undefined }));
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.file ? 'Click to replace file' : 'Click to upload new file (optional)'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {originalReport?.fileName
                        ? 'Leave empty to keep existing file'
                        : 'Any file type — max 50MB'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, file }));
                          if (errors.file) {
                            setErrors(prev => ({ ...prev, file: undefined }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                
                {/* File Preview/Info */}
                {formData.file && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        <strong>New file selected:</strong> {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      This file will replace the current file when you update the report.
                    </p>
                  </div>
                )}
                
                {errors.file && (
                  <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                )}
              </div>
            )}

            {/* Text Report Section */}
            {reportType === 'text' && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Rich Text Content</h4>
                  <div className="text-sm text-gray-500">
                    Edit your report content using the rich text editor
                  </div>
                </div>

                {renderReportingGuidance()}
                
                <RichTextEditor
                  value={formData.text_report}
                  onChange={(value) => setFormData(prev => ({ ...prev, text_report: value }))}
                  placeholder="Edit your report content here..."
                />
                
                {errors.text_report && (
                  <p className="mt-2 text-sm text-red-600">{errors.text_report}</p>
                )}
                
                {/* Text Preview */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Preview</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, text_report: '' }))}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear Content
                    </button>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[100px] rich-text-preview">
                    {formData.text_report ? (
                      <div className="rich-text-editor" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.text_report) }} />
                    ) : (
                      <div className="text-gray-400 italic">Your content will appear here as you type...</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-[#2f5d31] text-white rounded-md hover:bg-[#004a6b] disabled:opacity-50"
              >
                {submitLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 inline mr-2" />
                    Update Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditReportPage;
