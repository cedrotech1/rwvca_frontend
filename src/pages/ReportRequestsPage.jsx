import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Eye,
  Send,
  FileBarChart,
  FileText,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { reportRequestService } from '../services/api/reportRequestService';
import { PageHeading } from '../components/PageHeading';

const statusBadge = (status) => {
  const map = {
    open: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
    draft: 'bg-blue-100 text-blue-800',
    submitted: 'bg-emerald-100 text-emerald-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatLabel = (value) => {
  const map = {
    any: 'Campus chooses',
    text: 'Written summary',
    file: 'File upload',
    table: 'Structured table',
  };
  return map[value] || value || '—';
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status !== 'open') return false;
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
};

export const ReportRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    format: 'all',
    academicYear: 'all',
    myStatus: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const isHq = user?.role === 'head_quarter' || user?.role === 'admin';
  const isCampus = ['warefare', 'it', 'wadden'].includes(user?.role);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportRequestService.getAll();
      if (response.success) {
        setRequests(response.data || []);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load report requests');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filterOptions = useMemo(() => {
    const categories = new Map();
    const years = new Map();

    requests.forEach((r) => {
      const cat = r.category?.name || r.service?.category?.name;
      const catId = r.categoryId || r.service?.categoryId || r.service?.category?.id;
      if (cat && catId) categories.set(String(catId), cat);
      if (r.academicYear?.id) {
        years.set(String(r.academicYear.id), r.academicYear.label);
      }
    });

    return {
      categories: [...categories.entries()].map(([id, name]) => ({ id, name })),
      academicYears: [...years.entries()].map(([id, label]) => ({ id, label })),
    };
  }, [requests]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    let list = requests.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false;

      if (filters.category !== 'all') {
        const catId = String(r.categoryId || r.service?.categoryId || r.service?.category?.id || '');
        if (catId !== filters.category) return false;
      }

      if (filters.format !== 'all' && (r.submissionFormat || 'any') !== filters.format) {
        return false;
      }

      if (filters.academicYear !== 'all') {
        if (String(r.academicYear?.id || '') !== filters.academicYear) return false;
      }

      if (isCampus && filters.myStatus !== 'all') {
        const myStatus = r.mySubmission?.status || 'pending';
        if (myStatus !== filters.myStatus) return false;
      }

      if (search) {
        const haystack = [
          r.title,
          r.description,
          r.service?.name,
          r.category?.name,
          r.service?.category?.name,
          r.academicYear?.label,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });

    list = [...list].sort((a, b) => {
      let aVal;
      let bVal;

      switch (filters.sortBy) {
        case 'title':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [requests, filters, isCampus]);

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.format !== 'all' ||
    filters.academicYear !== 'all' ||
    filters.myStatus !== 'all';

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      format: 'all',
      academicYear: 'all',
      myStatus: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const pageTitle = isHq
    ? 'Report Requests — Head Quarter'
    : 'Report Requests from Head Quarter';

  const pageSubtitle = isHq
    ? 'Create report requests for campuses and track who has published.'
    : 'Open each request, prepare your campus report, and publish before the due date.';

  const colSpan = isHq ? 10 : 9;

  return (
    <div className="p-4 sm:p-6">
      <PageHeading
        title={pageTitle}
        subtitle={pageSubtitle}
        icon={<FileBarChart className="h-6 w-6" />}
        actions={
          isHq
            ? [
                {
                  label: 'Create Request',
                  onClick: () => navigate('/report-requests/create'),
                  variant: 'primary',
                  icon: <Plus className="h-4 w-4" />,
                },
              ]
            : []
        }
      />

      <div
        className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
          isHq
            ? 'border-[#2f5d31]/25 bg-[#2f5d31]/5 text-gray-800'
            : 'border-amber-200 bg-amber-50 text-amber-950'
        }`}
      >
        {isHq ? (
          <p>
            Create a report request, then use <strong>Track</strong> to see which campuses
            published and which are still pending.
          </p>
        ) : (
          <p>
            Head Quarter has requested these reports. Use <strong>Submit</strong> to fill and
            publish your campus response before the due date.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Filters</span>
            {hasActiveFilters && (
              <span className="rounded-full bg-[#2f5d31]/10 px-2 py-0.5 text-xs font-medium text-[#2f5d31]">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showFilters ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={loadRequests}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder="Title, service, category…"
                    className="w-full rounded-md border-0 bg-gray-100 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                >
                  <option value="all">All categories</option>
                  {filterOptions.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {isHq && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Format</label>
                  <select
                    value={filters.format}
                    onChange={(e) => updateFilter('format', e.target.value)}
                    className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                  >
                    <option value="all">All formats</option>
                    <option value="any">Campus chooses</option>
                    <option value="text">Written summary</option>
                    <option value="file">File upload</option>
                    <option value="table">Structured table</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Academic year
                </label>
                <select
                  value={filters.academicYear}
                  onChange={(e) => updateFilter('academicYear', e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                >
                  <option value="all">All years</option>
                  {filterOptions.academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>

              {isCampus && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Your submission
                  </label>
                  <select
                    value={filters.myStatus}
                    onChange={(e) => updateFilter('myStatus', e.target.value)}
                    className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Sort by</label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                  }}
                  className="w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                >
                  <option value="createdAt-desc">Newest first</option>
                  <option value="createdAt-asc">Oldest first</option>
                  <option value="dueDate-asc">Due date (soonest)</option>
                  <option value="dueDate-desc">Due date (latest)</option>
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Report requests ({filtered.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[14%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </th>
                <th className="w-[10%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Service
                </th>
                <th className="w-[11%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </th>
                <th className="w-[8%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Year
                </th>
                {isHq && (
                  <th className="w-[9%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Format
                  </th>
                )}
                <th className="w-[9%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Due
                </th>
                <th className="w-[7%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                {isHq ? (
                  <th className="w-[10%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Progress
                  </th>
                ) : (
                  <th className="w-[9%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Yours
                  </th>
                )}
                <th className="w-[8%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>
                <th className="sticky right-0 z-20 w-[130px] bg-gray-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500">
                    <RefreshCw className="mr-2 inline h-5 w-5 animate-spin" />
                    Loading requests…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="font-medium text-gray-700">
                      {requests.length === 0
                        ? isHq
                          ? 'No report requests yet'
                          : 'No open report requests from Head Quarter'
                        : 'No requests match your filters'}
                    </p>
                    {requests.length === 0 && isHq && (
                      <button
                        type="button"
                        onClick={() => navigate('/report-requests/create')}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e3a1e]"
                      >
                        <Plus className="h-4 w-4" />
                        Create first request
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((request) => {
                  const stats = request.stats || {};
                  const myStatus = request.mySubmission?.status || 'pending';
                  const overdue = isOverdue(request.dueDate, request.status);

                  return (
                    <tr key={request.id} className="group hover:bg-gray-50/80">
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate font-medium text-gray-900"
                          title={request.title}
                        >
                          {request.title}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate text-gray-700"
                          title={request.service?.name || ''}
                        >
                          {request.service?.name || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate text-gray-700"
                          title={
                            request.category?.name ||
                            request.service?.category?.name ||
                            ''
                          }
                        >
                          {request.category?.name ||
                            request.service?.category?.name ||
                            '—'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                        {request.academicYear?.label || '—'}
                      </td>
                      {isHq && (
                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                          {formatLabel(request.submissionFormat)}
                        </td>
                      )}
                      <td
                        className={`whitespace-nowrap px-3 py-2.5 ${
                          overdue ? 'font-medium text-red-600' : 'text-gray-700'
                        }`}
                      >
                        {formatDate(request.dueDate)}
                        {overdue && (
                          <span className="ml-1 text-xs text-red-500">!</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      {isHq ? (
                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                          <span className="text-emerald-700">{stats.submitted || 0}</span>
                          <span className="text-gray-400">/</span>
                          <span>{stats.total || 0}</span>
                          {(stats.pending || 0) > 0 && (
                            <span className="ml-1 text-xs text-amber-600">
                              ({stats.pending})
                            </span>
                          )}
                        </td>
                      ) : (
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(myStatus)}`}
                          >
                            {myStatus}
                          </span>
                        </td>
                      )}
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-3 py-2.5 text-right shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.08)] group-hover:bg-gray-50/80">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/report-requests/${request.id}`)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {isHq ? 'Track' : 'View'}
                          </button>
                          {isCampus &&
                            request.status === 'open' &&
                            myStatus !== 'submitted' && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/reports/create?requestId=${request.id}`)
                                }
                                className="inline-flex items-center gap-1 rounded-md bg-[#2f5d31] px-2 py-1 text-xs font-medium text-white hover:bg-[#1e3a1e]"
                              >
                                <Send className="h-3.5 w-3.5" />
                                {myStatus === 'draft' ? 'Go' : 'Submit'}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportRequestsPage;
