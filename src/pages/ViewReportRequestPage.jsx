import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  FileSearch,
  Send,
  Building2,
  Filter,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { reportRequestService } from '../services/api/reportRequestService';
import { PageHeading } from '../components/PageHeading';
import { ReportRequestCombinedView } from '../components/reportRequests/ReportRequestCombinedView';

const FORMAT_LABELS = {
  any: 'Campus chooses (text or file)',
  text: 'Written summary',
  file: 'File upload',
  table: 'Structured table',
};

const submissionStatusConfig = {
  pending: { label: 'Not started', color: 'bg-amber-100 text-amber-800', icon: Clock },
  draft: { label: 'Draft saved', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  submitted: { label: 'Published', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ViewReportRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [hqTab, setHqTab] = useState('submissions');
  const [combined, setCombined] = useState(null);
  const [combinedLoading, setCombinedLoading] = useState(false);

  const isHq = user?.role === 'head_quarter' || user?.role === 'admin';
  const isCampus = ['warefare', 'it', 'wadden'].includes(user?.role);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportRequestService.getById(id);
      if (response.success) setRequest(response.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load report request');
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const loadCombined = useCallback(async () => {
    if (!isHq) return;
    setCombinedLoading(true);
    try {
      const response = await reportRequestService.getCombined(id);
      if (response.success) setCombined(response.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load combined data');
    } finally {
      setCombinedLoading(false);
    }
  }, [id, isHq, showError]);

  useEffect(() => {
    if (isHq && hqTab === 'combined') {
      loadCombined();
    }
  }, [isHq, hqTab, loadCombined]);

  const submissions = useMemo(() => {
    const list = request?.submissions || [];
    if (submissionFilter === 'all') return list;
    return list.filter((s) => s.status === submissionFilter);
  }, [request, submissionFilter]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const response = await reportRequestService.updateStatus(id, newStatus);
      if (response.success) {
        setRequest(response.data);
        showSuccess(`Request marked as ${newStatus}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading report request…</div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-center text-gray-500">Report request not found.</div>
    );
  }

  const stats = request.stats || {};

  return (
    <div className="p-4 sm:p-6">
      <PageHeading
        title={request.title}
        subtitle={request.description || 'Head Office report request'}
        icon={<FileSearch className="h-6 w-6" />}
        showBack
        backTo="/report-requests"
        actions={
          isCampus && request.status === 'open' && request.mySubmission?.status !== 'submitted'
            ? [
                {
                  label: request.mySubmission?.status === 'draft' ? 'Continue report' : 'Submit report',
                  onClick: () => navigate(`/reports/create?requestId=${request.id}`),
                  variant: 'primary',
                  icon: <Send className="h-4 w-4" />,
                },
              ]
            : []
        }
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">Service</div>
          <div className="mt-1 font-semibold text-gray-900">{request.service?.name || '—'}</div>
          <div className="text-xs text-gray-500">{request.category?.name || request.service?.category?.name}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">Academic year</div>
          <div className="mt-1 font-semibold text-gray-900">{request.academicYear?.label || '—'}</div>
          <div className="text-xs text-gray-500">Due: {request.dueDate || 'No deadline'}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">Request status</div>
          {isHq ? (
            <select
              value={request.status}
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="mt-1 w-full rounded-md border-0 bg-gray-100 px-2 py-1.5 text-sm font-semibold capitalize focus:ring-2 focus:ring-[#2f5d31]"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : (
            <div className="mt-1 font-semibold capitalize text-gray-900">{request.status}</div>
          )}
        </div>
        {isHq && (
          <div className="rounded-xl border border-[#2f5d31]/20 bg-[#2f5d31]/5 p-4">
            <div className="text-xs font-medium uppercase text-[#2f5d31]">Campus progress</div>
            <div className="mt-1 text-2xl font-bold text-[#2f5d31]">
              {stats.submitted || 0}/{stats.total || 0}
            </div>
            <div className="text-xs text-gray-600">published reports</div>
          </div>
        )}
      </div>

      {/* What to report */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">What to report</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
          {request.effectiveWhatToReport || 'No guidance provided.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
            Format: {FORMAT_LABELS[request.submissionFormat] || FORMAT_LABELS.any}
          </span>
          {request.submissionFormat === 'table' && request.tableSchema?.fields?.length > 0 && (
            <span className="rounded-full bg-[#2f5d31]/10 px-3 py-1 font-medium text-[#2f5d31]">
              {request.tableSchema.fields.length} column(s) ·{' '}
              {request.tableSchema.rowMode === 'multi' ? 'multiple rows' : 'one row per campus'}
            </span>
          )}
          {request.allowFileAlternative && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
              File upload allowed as alternative
            </span>
          )}
        </div>
        {request.submissionFormat === 'table' && request.tableSchema?.fields?.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {request.tableSchema.fields.map((f) => (
                    <th key={f.key} className="px-3 py-2 text-left font-semibold text-gray-600">
                      {f.label}
                      {f.required && ' *'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {request.tableSchema.fields.map((f) => (
                    <td key={f.key} className="px-3 py-2 text-gray-500">
                      {f.type}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Campus campus user view */}
      {isCampus && request.mySubmission && (
        <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="text-sm font-semibold text-gray-900">Your campus status</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                submissionStatusConfig[request.mySubmission.status]?.color
              }`}
            >
              {submissionStatusConfig[request.mySubmission.status]?.label}
            </span>
            {request.mySubmission.report && (
              <Link
                to={`/reports/view/${request.mySubmission.report.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31] hover:underline"
              >
                View your report
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* HQ campus tracking + combined analytics */}
      {isHq && (
        <>
          <div className="mb-4 flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setHqTab('submissions')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                hqTab === 'submissions'
                  ? 'border-[#2f5d31] text-[#2f5d31]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Campus submissions
            </button>
            <button
              type="button"
              onClick={() => setHqTab('combined')}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                hqTab === 'combined'
                  ? 'border-[#2f5d31] text-[#2f5d31]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Combined view & analysis
            </button>
          </div>

          {hqTab === 'combined' ? (
            <section className="mb-6">
              <ReportRequestCombinedView combined={combined} loading={combinedLoading} />
            </section>
          ) : (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#2f5d31]" />
              <h3 className="text-base font-semibold text-gray-900">Campus submissions</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={submissionFilter}
                onChange={(e) => setSubmissionFilter(e.target.value)}
                className="rounded-md border-0 bg-gray-100 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2f5d31]"
              >
                <option value="all">All campuses ({stats.total || 0})</option>
                <option value="submitted">Published ({stats.submitted || 0})</option>
                <option value="pending">Not started ({stats.pending || 0})</option>
                <option value="draft">Draft ({stats.draft || 0})</option>
              </select>
              <button
                type="button"
                onClick={loadRequest}
                className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Campus</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Submitted by</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Submitted at</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                      No campuses match this filter.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => {
                    const cfg = submissionStatusConfig[sub.status] || submissionStatusConfig.pending;
                    const Icon = cfg.icon;
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/80">
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                          {sub.campus?.name || `Campus #${sub.campusId}`}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {sub.submitter?.names || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDateTime(sub.submittedAt)}
                        </td>
                        <td className="px-5 py-4">
                          {sub.report ? (
                            <Link
                              to={`/reports/view/${sub.report.id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31] hover:underline"
                            >
                              View report
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
          )}
        </>
      )}
    </div>
  );
};

export default ViewReportRequestPage;
