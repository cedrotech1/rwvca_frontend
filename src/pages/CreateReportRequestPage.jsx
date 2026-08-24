import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Check,
  FilePlus,
  FolderOpen,
  Layers,
  PenLine,
  Send,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useServices } from '../contexts/ServicesContext';
import { useCategories } from '../contexts/CategoriesContext';
import { useCampuses } from '../contexts/CampusesContext';
import { dedupeCampuses } from '../utils/campusUtils';
import { academicYearService } from '../services/api/academicYearService';
import { reportRequestService } from '../services/api/reportRequestService';
import { PageHeading } from '../components/PageHeading';
import {
  ReportRequestFieldBuilder,
  createEmptyField,
} from '../components/reportRequests/ReportRequestFieldBuilder';

const FORMAT_OPTIONS = [
  {
    value: 'any',
    label: 'Campus chooses',
    description: 'Campus picks text summary or file upload',
  },
  {
    value: 'text',
    label: 'Written summary',
    description: 'Narrative / summary text only',
  },
  {
    value: 'file',
    label: 'File upload',
    description: 'Word, Excel, PDF, or other document',
  },
  {
    value: 'table',
    label: 'Structured table',
    description: 'Define columns; campuses fill a matrix you design',
  },
];

const STEPS = [
  { id: 'category', label: 'Category' },
  { id: 'service', label: 'Service' },
  { id: 'details', label: 'Request details' },
];

export const CreateReportRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { services, fetchServices } = useServices();
  const { categories, fetchCategories } = useCategories();
  const { campuses } = useCampuses();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    academicYearId: '',
    dueDate: '',
    useServiceGuidance: true,
    whatToReport: '',
    targetCampuses: [],
    submissionFormat: 'any',
    allowFileAlternative: false,
    tableSchema: { fields: [createEmptyField(0)], rowMode: 'single' },
    aggregations: [],
  });
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(formData.serviceId)) || null,
    [services, formData.serviceId]
  );

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return services.filter((s) => s.isActive !== false);
    return services.filter(
      (s) => String(s.categoryId) === String(selectedCategoryId) && s.isActive !== false
    );
  }, [services, selectedCategoryId]);

  const activeCampuses = useMemo(
    () => dedupeCampuses((campuses || []).filter((c) => c.status === 'active')),
    [campuses]
  );

  useEffect(() => {
    if (user?.role !== 'head_quarter' && user?.role !== 'admin') {
      navigate('/report-requests');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchServices();
    fetchCategories({ isActive: true });
  }, [fetchServices, fetchCategories]);

  useEffect(() => {
    const loadYears = async () => {
      try {
        const response = await academicYearService.getAcademicYears();
        if (response.success) setAcademicYears(response.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadYears();
  }, []);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setFormData((prev) => ({ ...prev, serviceId: '', title: '' }));
    setErrors({});
  };

  const handleServiceSelect = (serviceId) => {
    const service = services.find((s) => String(s.id) === String(serviceId));
    setFormData((prev) => ({
      ...prev,
      serviceId: String(serviceId),
      title: service?.name ? `${service.name} — Campus Report Request` : prev.title,
    }));
  };

  const toggleCampus = (campusId) => {
    setFormData((prev) => {
      const id = Number(campusId);
      const selected = prev.targetCampuses.includes(id)
        ? prev.targetCampuses.filter((c) => c !== id)
        : [...prev.targetCampuses, id];
      return { ...prev, targetCampuses: selected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!selectedCategoryId) newErrors.categoryId = 'Category is required';
    if (!formData.serviceId) newErrors.serviceId = 'Service is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.academicYearId) newErrors.academicYearId = 'Academic year is required';
    if (!formData.useServiceGuidance && !formData.whatToReport.trim()) {
      newErrors.whatToReport = 'Enter custom guidance or use service default';
    }
    if (formData.submissionFormat === 'table') {
      const validFields = (formData.tableSchema?.fields || []).filter((f) => f.label?.trim());
      if (!validFields.length) {
        newErrors.tableSchema = 'Add at least one table column with a label';
      }
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        categoryId: Number(selectedCategoryId),
        serviceId: Number(formData.serviceId),
        academicYearId: Number(formData.academicYearId),
        dueDate: formData.dueDate || null,
        useServiceGuidance: formData.useServiceGuidance,
        whatToReport: formData.useServiceGuidance ? null : formData.whatToReport.trim(),
        targetCampuses: formData.targetCampuses.length ? formData.targetCampuses : null,
        submissionFormat: formData.submissionFormat,
        allowFileAlternative:
          formData.submissionFormat === 'table' ? formData.allowFileAlternative : false,
        tableSchema:
          formData.submissionFormat === 'table'
            ? {
                ...formData.tableSchema,
                fields: (formData.tableSchema?.fields || []).filter((f) => f.label?.trim()),
              }
            : null,
        aggregations: formData.submissionFormat === 'table' ? formData.aggregations : null,
      };

      const response = await reportRequestService.create(payload);
      if (response.success) {
        showSuccess('Report request sent to all campuses');
        navigate(`/report-requests/${response.data.id}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create report request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const guidancePreview = formData.useServiceGuidance
    ? selectedService?.whatToReport || 'Service default guidance will be used.'
    : formData.whatToReport || 'Enter custom guidance below.';

  return (
    <div className="p-4 sm:p-6">
      <PageHeading
        title="Create Report Request"
        subtitle="Create a new report request with custom fields"
        icon={<FilePlus className="h-6 w-6" />}
        showBack
        backTo="/report-requests"
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        {/* Step 1: Category */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <FolderOpen className="h-5 w-5 text-[#2f5d31]" />
            Step 1 — Category *
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter((c) => c.isActive !== false)
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(String(cat.id))}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    String(selectedCategoryId) === String(cat.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-[#2f5d31]/40'
                  }`}
                >
                  <div className="font-medium text-gray-900">{cat.name}</div>
                </button>
              ))}
          </div>
          {errors.categoryId && (
            <p className="mt-2 text-sm text-red-600">{errors.categoryId}</p>
          )}
        </section>

        {/* Step 2: Service */}
        <section
          className={`rounded-xl border bg-white p-5 shadow-sm ${
            selectedCategoryId ? 'border-gray-200' : 'border-gray-100 opacity-60'
          }`}
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <Layers className="h-5 w-5 text-[#2f5d31]" />
            Step 2 — Service report *
          </h3>
          {selectedCategoryId ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition ${
                    String(formData.serviceId) === String(service.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-[#2f5d31]/40'
                  }`}
                >
                  {String(formData.serviceId) === String(service.id) && (
                    <Check className="absolute right-3 top-3 h-5 w-5 text-emerald-600" />
                  )}
                  <div className="font-medium text-gray-900">{service.name}</div>
                  {service.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{service.description}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select a category first.</p>
          )}
          {errors.serviceId && (
            <p className="mt-2 text-sm text-red-600">{errors.serviceId}</p>
          )}
        </section>

        {/* Step 3: Details */}
        <section
          className={`rounded-xl border bg-white p-5 shadow-sm ${
            formData.serviceId ? 'border-gray-200' : 'border-gray-100 opacity-60'
          }`}
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <PenLine className="h-5 w-5 text-[#2f5d31]" />
            Step 3 — Request details *
          </h3>

          {formData.serviceId && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Request title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#2f5d31]"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#2f5d31]"
                  placeholder="Additional instructions for campuses"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Academic year *</label>
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => setFormData((p) => ({ ...p, academicYearId: e.target.value }))}
                    className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:ring-2 focus:ring-[#2f5d31]"
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.label}</option>
                    ))}
                  </select>
                  {errors.academicYearId && (
                    <p className="mt-1 text-sm text-red-600">{errors.academicYearId}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Due date (optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 focus:ring-2 focus:ring-[#2f5d31]"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[#2f5d31]/20 bg-[#2f5d31]/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.useServiceGuidance}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, useServiceGuidance: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2f5d31]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Use service default — What to report
                    </span>
                    <span className="text-xs text-gray-600">
                      Keep the guidance defined on the selected service report.
                    </span>
                  </span>
                </label>
                {!formData.useServiceGuidance && (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Custom — What to report *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.whatToReport}
                      onChange={(e) => setFormData((p) => ({ ...p, whatToReport: e.target.value }))}
                      className="w-full rounded-md border-0 bg-white px-3 py-2 focus:ring-2 focus:ring-[#2f5d31]"
                      placeholder="Override service guidance with your own instructions"
                    />
                    {errors.whatToReport && (
                      <p className="mt-1 text-sm text-red-600">{errors.whatToReport}</p>
                    )}
                  </div>
                )}
                <div className="mt-3 rounded-md bg-white/80 p-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Preview: </span>
                  {guidancePreview}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  How campuses should respond *
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          submissionFormat: opt.value,
                          tableSchema:
                            opt.value === 'table' && !(p.tableSchema?.fields?.length)
                              ? { fields: [createEmptyField(0)], rowMode: 'single' }
                              : p.tableSchema,
                        }))
                      }
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        formData.submissionFormat === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-[#2f5d31]/40'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{opt.label}</div>
                      <p className="mt-1 text-xs text-gray-600">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.submissionFormat === 'table' && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.allowFileAlternative}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, allowFileAlternative: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2f5d31]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Allow file upload instead of table
                      </span>
                      <span className="text-xs text-gray-600">
                        Campuses may skip the table and upload Word/Excel if they prefer.
                      </span>
                    </span>
                  </label>
                  <ReportRequestFieldBuilder
                    fields={formData.tableSchema?.fields || []}
                    onChange={(fields) =>
                      setFormData((p) => ({
                        ...p,
                        tableSchema: { ...p.tableSchema, fields },
                      }))
                    }
                    rowMode={formData.tableSchema?.rowMode || 'single'}
                    onRowModeChange={(rowMode) =>
                      setFormData((p) => ({
                        ...p,
                        tableSchema: { ...p.tableSchema, rowMode },
                      }))
                    }
                    aggregations={formData.aggregations}
                    onAggregationsChange={(aggregations) =>
                      setFormData((p) => ({ ...p, aggregations }))
                    }
                  />
                  {errors.tableSchema && (
                    <p className="text-sm text-red-600">{errors.tableSchema}</p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Target campuses (leave empty = all active campuses)
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeCampuses.map((campus) => {
                    const selected = formData.targetCampuses.includes(campus.id);
                    return (
                      <button
                        key={campus.id}
                        type="button"
                        onClick={() => toggleCampus(campus.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          selected
                            ? 'bg-[#2f5d31] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {campus.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/report-requests')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading || !formData.serviceId}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e3a1e] disabled:opacity-50"
          >
            {submitLoading ? (
              'Sending…'
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send request to campuses
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReportRequestPage;
