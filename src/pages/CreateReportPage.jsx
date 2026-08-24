import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Save,
  Upload,
  AlertCircle,
  Type,
  Check,
  FolderOpen,
  FileText,
  Layers,
  PenLine,
  FileSpreadsheet,
} from 'lucide-react';
import { useReports } from '../contexts/ReportsContext';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeHtml } from '../utils/sanitize';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { academicYearService } from '../services/api/academicYearService';
import { reportRequestService } from '../services/api/reportRequestService';
import {
  ReportRequestTableEditor,
  validateRequestTableRows,
} from '../components/reportRequests/ReportRequestTableEditor';
import { createEmptyTableRow } from '../utils/reportTableUtils';
import RichTextEditor from '../components/RichTextEditor';
import { CreateReportHeading } from '../components/PageHeading';
import { canCreateReport, createsGeneralReport, canPublishReport } from '../utils/reportPermissions';

const STEPS = [
  { id: 'category', label: 'Category', short: '1', icon: FolderOpen },
  { id: 'service', label: 'Service', short: '2', icon: Layers },
  { id: 'type', label: 'Report type', short: '3', icon: FileText },
  { id: 'content', label: 'Content', short: '4', icon: PenLine },
];

const StepBadge = ({ status, index }) => {
  if (status === 'done') {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === 'current') {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f5d31] text-white text-sm font-semibold shadow-sm ring-4 ring-[#2f5d31]/20">
        {index + 1}
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-sm font-semibold text-gray-400">
      {index + 1}
    </span>
  );
};

const StepPanel = ({ stepNumber, title, required, status, children, summary }) => {
  const isDone = status === 'done';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  return (
    <section
      className={`rounded-xl border transition-colors ${
        isLocked
          ? 'border-gray-100 bg-gray-50/80 opacity-60'
          : isDone
            ? 'border-emerald-200 bg-white'
            : isCurrent
              ? 'border-[#2f5d31]/40 bg-white shadow-sm'
              : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${
          isDone
            ? 'border-emerald-100 bg-emerald-50/50'
            : isCurrent
              ? 'border-[#2f5d31]/10 bg-[#2f5d31]/5'
              : 'border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StepBadge status={isLocked ? 'upcoming' : status} index={stepNumber - 1} />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Step {stepNumber} — {title}
              {required && <span className="text-red-500"> *</span>}
            </h3>
            {summary && (
              <p className="mt-0.5 truncate text-sm text-gray-600">{summary}</p>
            )}
          </div>
        </div>
        {isDone && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <Check className="h-3.5 w-3.5" />
            Done
          </span>
        )}
        {isCurrent && (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#2f5d31]/10 px-2.5 py-1 text-xs font-medium text-[#2f5d31]">
            In progress
          </span>
        )}
      </div>
      {!isLocked && <div className="px-5 py-5">{children}</div>}
      {isLocked && (
        <div className="px-5 py-4 text-sm text-gray-500">
          Complete the previous step to continue.
        </div>
      )}
    </section>
  );
};

export const CreateReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const { user: currentUser } = useAuth();
  const { createReportWithData, createReportWithFile } = useReports();
  const { showSuccess, showError } = useNotification();
  const { services, fetchServices } = useServices();
  const { categories, fetchCategories } = useCategories();

  const [reportType, setReportType] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    file: null,
    serviceId: '',
    academicYearId: '',
    challenge: '',
    wayForward: '',
    text_report: '',
  });
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [reportRequest, setReportRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [tableRows, setTableRows] = useState([]);

  const isRequestMode = Boolean(requestIdParam);
  const requestFormat = reportRequest?.submissionFormat || 'any';
  const requestTableSchema = reportRequest?.tableSchema;
  const allowFileAlternative = Boolean(reportRequest?.allowFileAlternative);

  const allowedReportTypes = useMemo(() => {
    if (!isRequestMode) return ['text', 'file'];
    if (requestFormat === 'table') {
      return allowFileAlternative ? ['table', 'file'] : ['table'];
    }
    if (requestFormat === 'file') return ['file'];
    if (requestFormat === 'text') return ['text'];
    return ['text', 'file'];
  }, [isRequestMode, requestFormat, allowFileAlternative]);

  useEffect(() => {
    if (!allowedReportTypes.length) return;
    if (reportType && !allowedReportTypes.includes(reportType)) {
      setReportType(allowedReportTypes[0]);
    }
  }, [allowedReportTypes, reportType]);

  const permissions = {
    canCreate: canCreateReport(currentUser?.role),
    isGeneralReport: createsGeneralReport(currentUser?.role),
  };

  const selectedCategory = useMemo(
    () =>
      categories.find((c) => String(c.id) === String(selectedCategoryId)) || null,
    [categories, selectedCategoryId]
  );

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(formData.serviceId)) || null,
    [services, formData.serviceId]
  );

  const categoryServices = useMemo(() => {
    if (!selectedCategoryId) return [];
    return (services || []).filter(
      (service) =>
        service.isActive &&
        String(service.categoryId) === String(selectedCategoryId)
    );
  }, [services, selectedCategoryId]);

  const stepDone = {
    category: Boolean(selectedCategoryId),
    service: Boolean(selectedService),
    type: Boolean(reportType),
    content: Boolean(
      reportType &&
        formData.title.trim() &&
        formData.academicYearId &&
        ((reportType === 'text' && formData.text_report.trim()) ||
          (reportType === 'file' && formData.file) ||
          (reportType === 'table' &&
            (requestTableSchema?.fields?.length || 0) > 0 &&
            tableRows.length > 0))
    ),
  };

  const currentStepId = !stepDone.category
    ? 'category'
    : !stepDone.service
      ? 'service'
      : !stepDone.type
        ? 'type'
        : 'content';

  const getStepStatus = (id) => {
    if (stepDone[id]) return 'done';
    if (id === currentStepId) return 'current';
    const order = STEPS.map((s) => s.id);
    const idx = order.indexOf(id);
    const currentIdx = order.indexOf(currentStepId);
    return idx < currentIdx ? 'done' : 'locked';
  };

  useEffect(() => {
    if (!permissions.canCreate) {
      navigate('/reports');
    }
  }, [permissions.canCreate, navigate]);

  useEffect(() => {
    if (currentUser?.role === 'head_quarter') {
      setFormData((prev) => ({ ...prev, status: 'published' }));
    }
  }, [currentUser?.role]);

  useEffect(() => {
    fetchServices();
    fetchCategories({ isActive: true });
  }, [fetchServices, fetchCategories]);

  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const response = await academicYearService.getAcademicYears();
        if (response.success) {
          setAcademicYears(response.data || []);
        }
      } catch (error) {
        console.error('Failed to load academic years:', error);
      }
    };
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (!requestIdParam) return;
    const loadRequest = async () => {
      setRequestLoading(true);
      try {
        const response = await reportRequestService.getById(requestIdParam);
        if (response.success && response.data) {
          const req = response.data;
          setReportRequest(req);
          const catId = req.categoryId || req.service?.categoryId || req.service?.category?.id;
          if (catId) setSelectedCategoryId(String(catId));
          const fmt = req.submissionFormat || 'any';
          if (fmt === 'table') {
            setReportType('table');
            const fields = req.tableSchema?.fields || [];
            setTableRows([createEmptyTableRow(fields)]);
          } else if (fmt === 'file') {
            setReportType('file');
          } else if (fmt === 'text') {
            setReportType('text');
          }
          setFormData((prev) => ({
            ...prev,
            serviceId: req.serviceId ? String(req.serviceId) : prev.serviceId,
            academicYearId: req.academicYearId ? String(req.academicYearId) : prev.academicYearId,
            title: req.title ? `${req.title} — Campus Report` : prev.title,
          }));
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to load report request');
      } finally {
        setRequestLoading(false);
      }
    };
    loadRequest();
  }, [requestIdParam, showError]);

  const requestGuidance = useMemo(() => {
    if (!reportRequest) return null;
    return reportRequest.effectiveWhatToReport || selectedService?.whatToReport || null;
  }, [reportRequest, selectedService]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setReportType(null);
    setFormData((prev) => ({
      ...prev,
      serviceId: '',
      title: '',
      file: null,
      text_report: '',
    }));
    setErrors({});
  };

  const handleServiceSelect = (serviceId) => {
    const service = services.find((s) => String(s.id) === String(serviceId));
    if (!isRequestMode) {
      setReportType(null);
    }
    setFormData((prev) => ({
      ...prev,
      serviceId: String(serviceId),
      title: service?.name ? `${service.name} Report` : '',
      file: null,
      text_report: '',
    }));
    setErrors((prev) => ({ ...prev, serviceId: undefined }));
  };

  const handleReportTypeSelect = (type) => {
    setReportType(type);
    setFormData((prev) => ({
      ...prev,
      file: type === 'file' ? prev.file : null,
      text_report: type === 'text' ? prev.text_report : '',
    }));
    if (type === 'table' && requestTableSchema?.fields?.length) {
      setTableRows([createEmptyTableRow(requestTableSchema.fields)]);
    }
    setErrors((prev) => ({ ...prev, file: undefined, text_report: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const newErrors = {};
    if (!selectedCategoryId) newErrors.categoryId = 'Category is required';
    if (!formData.serviceId) newErrors.serviceId = 'Service report is required';
    if (!reportType) newErrors.reportType = 'Select a report type';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.academicYearId) newErrors.academicYearId = 'Academic year is required';
    if (reportType === 'text' && !formData.text_report.trim()) {
      newErrors.text_report = 'Text content is required';
    }
    if (reportType === 'file' && !formData.file) {
      newErrors.file = 'File is required';
    }
    if (reportType === 'table' && requestTableSchema) {
      const tableErrors = validateRequestTableRows(requestTableSchema, tableRows);
      Object.assign(newErrors, tableErrors);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitLoading(false);
      return;
    }

    const status =
      currentUser?.role === 'head_quarter'
        ? 'published'
        : canPublishReport(currentUser?.role)
          ? formData.status
          : 'draft';

    try {
      let response;
      if (reportType === 'file') {
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title);
        formDataObj.append('description', formData.description);
        formDataObj.append('status', status);
        formDataObj.append('serviceId', formData.serviceId);
        formDataObj.append('academicYearId', formData.academicYearId);
        formDataObj.append('challenge', formData.challenge);
        formDataObj.append('wayForward', formData.wayForward);
        formDataObj.append('file', formData.file);
        if (requestIdParam) formDataObj.append('reportRequestId', requestIdParam);
        response = await createReportWithFile(formDataObj);
      } else if (reportType === 'table') {
        const fields = requestTableSchema?.fields || [];
        response = await createReportWithData({
          title: formData.title,
          description: formData.description,
          status,
          serviceId: formData.serviceId,
          academicYearId: formData.academicYearId,
          challenge: formData.challenge,
          wayForward: formData.wayForward,
          headers: fields.map((f) => f.label),
          data: tableRows.map((row, index) => ({
            rowIndex: index + 1,
            rowData: row,
          })),
          isFileReport: false,
          reportRequestId: requestIdParam ? Number(requestIdParam) : null,
        });
      } else {
        response = await createReportWithData({
          title: formData.title,
          description: formData.description,
          status,
          serviceId: formData.serviceId,
          academicYearId: formData.academicYearId,
          challenge: formData.challenge,
          wayForward: formData.wayForward,
          text_report: formData.text_report,
          headers: [],
          data: [],
          isFileReport: false,
          reportRequestId: requestIdParam ? Number(requestIdParam) : null,
        });
      }

      if (response?.success !== false) {
        showSuccess(isRequestMode ? 'Report submitted for request' : 'Report created successfully');
        navigate(isRequestMode ? `/report-requests/${requestIdParam}` : '/reports');
      } else {
        showError(response?.message || 'Failed to create report');
      }
    } catch (error) {
      showError(
        error?.response?.data?.message || error?.message || 'Failed to create report'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!permissions.canCreate) {
    return null;
  }

  const activeCategories = categories.filter((c) => c.isActive !== false);

  return (
    <div className="min-h-screen">
      <CreateReportHeading
        actions={[
          {
            type: 'outline',
            label: 'Cancel',
            onClick: () => navigate('/reports'),
          },
          {
            type: 'primary',
            label: submitLoading ? 'Creating...' : 'Create Report',
            icon: <Save className="h-4 w-4" />,
            onClick: handleSubmit,
            disabled: submitLoading || !stepDone.type,
          },
        ]}
      />

      {permissions.isGeneralReport && !isRequestMode && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
          <strong>General report.</strong> This report is not tied to any campus.
        </div>
      )}

      {isRequestMode && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-lg border border-[#2f5d31]/30 bg-[#2f5d31]/5 px-4 py-3 text-sm text-gray-800">
          {requestLoading ? (
            <span>Loading request details…</span>
          ) : (
            <>
              <strong className="text-[#2f5d31]">Responding to Head Office request:</strong>{' '}
              {reportRequest?.title || 'Report request'}
              {reportRequest?.description && (
                <p className="mt-1 text-gray-600">{reportRequest.description}</p>
              )}
            </>
          )}
        </div>
      )}

      <main className="mx-auto sm:px-6 lg:px-8 py-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-[#2f5d31]/8 via-white to-emerald-50/40 px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Service Report</h2>
            <p className="mt-1 text-sm text-gray-600">
              Complete each step in order: Category → Service → Report type → Content.
            </p>

            {/* Progress stepper */}
            <nav aria-label="Report creation steps" className="mt-6">
              <ol className="flex items-center">
                {STEPS.map((step, index) => {
                  const status = getStepStatus(step.id);
                  const isLast = index === STEPS.length - 1;
                  return (
                    <li
                      key={step.id}
                      className={`flex items-center ${isLast ? '' : 'flex-1'}`}
                    >
                      <div className="flex flex-col items-center gap-2 min-w-[4.5rem] sm:min-w-[6rem]">
                        <StepBadge status={status === 'locked' ? 'upcoming' : status} index={index} />
                        <span
                          className={`text-center text-xs font-medium sm:text-sm ${
                            status === 'done'
                              ? 'text-emerald-700'
                              : status === 'current'
                                ? 'text-[#2f5d31]'
                                : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={`mx-1 sm:mx-2 h-0.5 flex-1 rounded-full ${
                            stepDone[step.id] ? 'bg-emerald-400' : 'bg-gray-200'
                          }`}
                          aria-hidden
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Step 1: Category */}
            <StepPanel
              stepNumber={1}
              title="Category"
              required
              status={getStepStatus('category')}
              summary={selectedCategory?.name}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeCategories.map((category) => {
                  const selected = String(selectedCategoryId) === String(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-gray-200 hover:border-[#2f5d31]/40 hover:bg-[#2f5d31]/5'
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                      <div className="pr-8 font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {category.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.categoryId && (
                <p className="mt-3 text-sm text-red-600">{errors.categoryId}</p>
              )}
            </StepPanel>

            {/* Step 2: Service */}
            <StepPanel
              stepNumber={2}
              title="Service Report"
              required
              status={getStepStatus('service')}
              summary={selectedService?.name}
            >
              {categoryServices.length === 0 ? (
                <p className="text-sm text-gray-500">No service reports in this category.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => {
                    const selected = String(formData.serviceId) === String(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 hover:border-[#2f5d31]/40 hover:bg-[#2f5d31]/5'
                        }`}
                      >
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        )}
                        <div className="pr-8 font-medium text-gray-900">{service.name}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.serviceId && (
                <p className="mt-3 text-sm text-red-600">{errors.serviceId}</p>
              )}

              {selectedService && (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="w-full">
                      <h5 className="text-sm font-semibold text-amber-900">
                        What to report — {selectedService.name}
                      </h5>
                      <p className="mt-1 text-sm text-amber-800">
                        Cover the points below in your text report or uploaded file.
                      </p>
                      <pre className="mt-3 whitespace-pre-wrap rounded-md border border-amber-200 bg-white p-3 font-sans text-sm text-gray-800">
                        {requestGuidance ||
                          selectedService.whatToReport ||
                          'No reporting guidance defined for this service.'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </StepPanel>

            {/* Step 3: Report type */}
            <StepPanel
              stepNumber={3}
              title="Report type"
              required
              status={getStepStatus('type')}
              summary={
                reportType === 'text'
                  ? 'Text (summary)'
                  : reportType === 'file'
                    ? 'File upload'
                    : reportType === 'table'
                      ? 'Structured table'
                      : null
              }
            >
              {isRequestMode && requestFormat !== 'any' && (
                <p className="mb-3 text-sm text-[#2f5d31]">
                  Head Office requested:{' '}
                  <strong>
                    {requestFormat === 'table'
                      ? 'Table data'
                      : requestFormat === 'file'
                        ? 'File upload'
                        : 'Written summary'}
                  </strong>
                  {allowFileAlternative && ' (file upload allowed as alternative)'}
                </p>
              )}
              {allowedReportTypes.length === 1 ? (
                <div className="rounded-lg border border-[#2f5d31]/20 bg-[#2f5d31]/5 px-4 py-3 text-sm text-gray-800">
                  <strong className="text-[#2f5d31]">Required format:</strong>{' '}
                  {allowedReportTypes[0] === 'table'
                    ? 'Structured table (fill HQ-defined columns)'
                    : allowedReportTypes[0] === 'file'
                      ? 'File upload (Word, Excel, PDF…)'
                      : 'Written summary / narrative'}
                </div>
              ) : (
              <div className={`grid max-w-2xl gap-3 ${allowedReportTypes.length > 2 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                {allowedReportTypes.includes('text') && (
                <button
                  type="button"
                  onClick={() => handleReportTypeSelect('text')}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                    reportType === 'text'
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 hover:border-[#2f5d31]/40 hover:bg-[#2f5d31]/5'
                  }`}
                >
                  {reportType === 'text' && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <Type className="mx-auto mb-2 h-6 w-6 text-[#2f5d31]" />
                  <div className="text-sm font-medium text-gray-900">Text</div>
                  <div className="text-xs text-gray-500">Summary / narrative</div>
                </button>
                )}
                {allowedReportTypes.includes('table') && (
                <button
                  type="button"
                  onClick={() => handleReportTypeSelect('table')}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                    reportType === 'table'
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 hover:border-[#2f5d31]/40 hover:bg-[#2f5d31]/5'
                  }`}
                >
                  {reportType === 'table' && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <FileSpreadsheet className="mx-auto mb-2 h-6 w-6 text-[#2f5d31]" />
                  <div className="text-sm font-medium text-gray-900">Table</div>
                  <div className="text-xs text-gray-500">Fill HQ-defined columns</div>
                </button>
                )}
                {allowedReportTypes.includes('file') && (
                <button
                  type="button"
                  onClick={() => handleReportTypeSelect('file')}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                    reportType === 'file'
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 hover:border-[#2f5d31]/40 hover:bg-[#2f5d31]/5'
                  }`}
                >
                  {reportType === 'file' && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <Upload className="mx-auto mb-2 h-6 w-6 text-[#2f5d31]" />
                  <div className="text-sm font-medium text-gray-900">File</div>
                  <div className="text-xs text-gray-500">Word, Excel, PDF…</div>
                </button>
                )}
              </div>
              )}
              {errors.reportType && (
                <p className="mt-3 text-sm text-red-600">{errors.reportType}</p>
              )}
            </StepPanel>

            {/* Step 4: Content */}
            <StepPanel
              stepNumber={4}
              title="Content"
              required
              status={getStepStatus('content')}
              summary={
                stepDone.content
                  ? 'Details and content ready'
                  : reportType
                    ? 'Fill in title, academic year, and report content'
                    : null
              }
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className={`mt-1 block w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.title ? 'ring-2 ring-red-500' : ''
                      }`}
                      placeholder="Enter report title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    {currentUser?.role === 'head_quarter' ? (
                      <div className="mt-1 block w-full rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
                        Published
                      </div>
                    ) : canPublishReport(currentUser?.role) ? (
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="mt-1 block w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    ) : (
                      <div className="mt-1 block w-full rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
                        Draft
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Academic Year *
                    </label>
                    <select
                      value={formData.academicYearId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          academicYearId: e.target.value,
                        }))
                      }
                      className={`mt-1 block w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                </div>

                {reportType === 'table' && (
                  <div className="rounded-lg border border-gray-200 p-5">
                    <h4 className="mb-4 text-base font-medium text-gray-900">
                      Campus data table
                    </h4>
                    <ReportRequestTableEditor
                      tableSchema={requestTableSchema}
                      rows={tableRows}
                      onChange={setTableRows}
                      errors={errors}
                    />
                  </div>
                )}

                {reportType === 'text' && (
                  <div className="rounded-lg border border-gray-200 p-5">
                    <h4 className="mb-4 text-base font-medium text-gray-900">
                      Rich Text Content
                    </h4>
                    <RichTextEditor
                      value={formData.text_report}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, text_report: value }))
                      }
                      placeholder="Write your report covering the points listed in What to Report..."
                    />
                    {errors.text_report && (
                      <p className="mt-2 text-sm text-red-600">{errors.text_report}</p>
                    )}
                    <div className="rich-text-preview mt-4 min-h-[80px] rounded-lg border border-gray-300 bg-gray-50 p-4">
                      {formData.text_report ? (
                        <div
                          className="rich-text-editor"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(formData.text_report),
                          }}
                        />
                      ) : (
                        <div className="italic text-gray-400">Preview appears here...</div>
                      )}
                    </div>
                  </div>
                )}

                {reportType === 'file' && (
                  <div className="rounded-lg border border-gray-200 p-5">
                    <h4 className="mb-4 text-base font-medium text-gray-900">File Upload</h4>
                    <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-[#2f5d31]/50">
                      <Upload className="mb-2 h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.file
                          ? formData.file.name
                          : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-500">Any file type — max 50MB</span>
                      <input type="file" onChange={handleFileChange} className="hidden" />
                    </label>
                    {errors.file && (
                      <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description (if any)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter report description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Challenge (if any)
                    </label>
                    <textarea
                      value={formData.challenge}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, challenge: e.target.value }))
                      }
                      rows={3}
                      className="mt-1 block w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Way Forward (if any)
                    </label>
                    <textarea
                      value={formData.wayForward}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, wayForward: e.target.value }))
                      }
                      rows={3}
                      className="mt-1 block w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={() => navigate('/reports')}
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex items-center rounded-md bg-[#2f5d31] px-4 py-2 text-white hover:bg-[#004a6b] disabled:opacity-50"
                  >
                    {submitLoading ? (
                      'Creating Report...'
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </StepPanel>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateReportPage;
