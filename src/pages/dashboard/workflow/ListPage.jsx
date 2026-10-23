import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Trash2, Download, FileText, List, Pencil } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { downloadProtectedFile, fileUrl } from '../../../services/api/config';
import { useAuth } from '../../../contexts/AuthContext';
import {
  canReviewLists,
  canSeeAllDocumentsTab,
  canSeeAllMembershipReports,
  canSeeAllTicketsTab,
  canSeeVehicleReceived,
} from '../../../utils/rwvcaAccess';
import { formatCell, isStatusColumn, useStaffOptions } from './helpers';

function cleanParams(values) {
  const next = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value !== '' && value != null) next[key] = value;
  });
  return next;
}

export default function ListPage({
  title,
  subtitle,
  apiPath,
  columns,
  openTo,
  createTo,
  createLabel,
  query = {},
  actionLabel = 'Actions',
  filters = [],
  tabs = [],
  defaultTab,
  searchPlaceholder = 'Search...',
  letterKey,
  fileKey,
  fileDownloadApi,
  documentTo,
  editTo,
  canDeleteRow,
  canEditRow,
  actionsIconOnly = false,
  hideHeading = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useStaffOptions();
  const visibleTabs = useMemo(() => tabs.filter((tab) => {
    if (tab.reviewerOnly && !canReviewLists(user)) return false;
    if (tab.edOnly && !canSeeAllDocumentsTab(user)) return false;
    if (tab.vehicleReceivedOnly && !canSeeVehicleReceived(user)) return false;
    if (tab.hrAdminOnly && !canSeeAllTicketsTab(user)) return false;
    if (tab.membershipAllOnly && !canSeeAllMembershipReports(user)) return false;
    return true;
  }), [tabs, user?.role]);
  const [tab, setTab] = useState(defaultTab || visibleTabs[0]?.value || query.tab || '');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [tabCounts, setTabCounts] = useState({});
  const [error, setError] = useState('');

  const listLimit = tab === 'all' ? 1000 : 200;

  const params = () => ({
    ...query,
    ...cleanParams(filterValues),
    ...(tab ? { tab } : {}),
    search,
    limit: listLimit,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(apiPath, params());
      setItems(res.data?.items || res.data || []);
      setTotal(res.data?.pagination?.total ?? (res.data?.items || res.data || []).length);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load records');
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    if (!visibleTabs.length) return;
    const entries = await Promise.all(visibleTabs.map(async (item) => {
      try {
        const res = await api.get(apiPath, { ...query, tab: item.value, limit: 1 });
        return [item.value, res.data?.pagination?.total ?? (res.data?.items || []).length];
      } catch {
        return [item.value, 0];
      }
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some((item) => item.value === tab)) {
      setTab(defaultTab && visibleTabs.some((item) => item.value === defaultTab) ? defaultTab : visibleTabs[0].value);
      return;
    }
    load().catch(() => {});
    loadCounts().catch(() => {});
  }, [apiPath, tab]);

  const applyFilters = (event) => {
    event?.preventDefault?.();
    load();
    loadCounts();
  };

  const resetFilters = () => {
    setSearch('');
    setFilterValues({});
    setTimeout(() => {
      api.get(apiPath, { ...query, ...(tab ? { tab } : {}), search: '', limit: listLimit })
        .then((res) => {
          setItems(res.data?.items || res.data || []);
          setTotal(res.data?.pagination?.total ?? (res.data?.items || res.data || []).length);
        })
        .catch((err) => setError(err.response?.data?.message || 'Could not load records'));
    }, 0);
  };

  const openRow = (row) => {
    if (openTo) navigate(`${openTo}/${row.id || row.product_id}`);
  };

  const deleteRow = async (row) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.del(`${apiPath}/${row.id}`);
      await load();
      await loadCounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete record');
    }
  };

  const exportRows = () => {
    exportCsv(String(title || 'export').toLowerCase().replace(/\s+/g, '-'), columns.map((col) => ({
      key: col.key,
      label: col.label,
      value: (row) => formatCell(row, col),
    })), items);
  };

  const tableColumns = columns.map((col) => ({
    ...col,
    render: (row) => {
      if (isStatusColumn(col)) return <StatusBadge value={row[col.key]} />;
      const formatted = formatCell(row, col);
      if (col.format === 'html' || col.format === 'plain' || col.format === 'richtext') {
        return (
          <span title={typeof formatted === 'string' && formatted !== '—' ? formatted : undefined} className="block max-w-md text-sm text-gray-600 line-clamp-2">
            {formatted}
          </span>
        );
      }
      return formatted;
    },
  }));

  return (
    <div>
      {!hideHeading && (
        <PageHeading
          icon={<List className="h-6 w-6" />}
          title={title}
          subtitle={subtitle}
          actions={[
            { label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: exportRows, disabled: !items.length },
            ...(createTo ? [{ label: createLabel || 'Create', variant: 'primary', onClick: () => navigate(createTo) }] : []),
          ]}
        />
      )}
      {hideHeading && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            onClick={exportRows}
            disabled={!items.length}
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
        {visibleTabs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-3">
            {visibleTabs.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  tab === item.value ? 'bg-[#2f5d31] text-white' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setTab(item.value)}
              >
                {item.label}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === item.value ? 'bg-white/20' : 'bg-white text-gray-600'}`}>
                  {tabCounts[item.value] ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={applyFilters} className="mb-4 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <label className="text-sm text-gray-600">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          {filters.map((filter) => (
            <label key={filter.name} className="text-sm text-gray-600">
              {filter.label}
              {filter.type === 'date' ? (
                <input
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={filterValues[filter.name] || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.name]: e.target.value }))}
                />
              ) : filter.type === 'applicant' ? (
                canReviewLists(user) ? (
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.name]: e.target.value }))}
                  >
                    <option value="">{filter.allLabel || 'All Users'}</option>
                    {users.map((item) => (
                      <option key={item.id} value={item.id}>{item.names}</option>
                    ))}
                  </select>
                ) : (
                  <input readOnly className={`mt-1 ${inputClass}`} value={user?.names || ''} />
                )
              ) : (
                <select
                  className={`mt-1 ${inputClass}`}
                  value={filterValues[filter.name] || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.name]: e.target.value }))}
                >
                  <option value="">{filter.allLabel || filter.label}</option>
                  {(filter.options || []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
            </label>
          ))}
          <div className="flex gap-2">
            <button type="submit" className="bg-[#2f5d31] text-white px-4 py-2.5 rounded-lg text-sm font-medium">Filter</button>
            <button type="button" onClick={resetFilters} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium">Reset</button>
          </div>
        </form>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {!loading && !error && (
          <p className="text-xs text-gray-500 mb-3">
            Showing {items.length} of {total} record{total === 1 ? '' : 's'}
            {tab === 'all' ? ' (All Requisitions)' : ''}
          </p>
        )}
        {loading && !items.length ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-gray-200/80" />
            ))}
          </div>
        ) : (
        <DataTable
          columns={tableColumns}
          rows={items}
          actionsLabel={actionLabel}
          renderActions={openTo ? (row) => (
            <>
              <button
                type="button"
                title="View"
                aria-label="View"
                className={`inline-flex items-center gap-1 text-[#2f5d31] font-medium mr-2 ${actionsIconOnly ? 'p-1.5 rounded-md hover:bg-green-50' : ''}`}
                onClick={() => openRow(row)}
              >
                <Eye size={16} />{actionsIconOnly ? null : ' View'}
              </button>
              {editTo && canEditRow?.(row, user) && (
                <button
                  type="button"
                  title="Edit"
                  aria-label="Edit"
                  className={`inline-flex items-center gap-1 text-amber-700 font-medium mr-2 ${actionsIconOnly ? 'p-1.5 rounded-md hover:bg-amber-50' : ''}`}
                  onClick={() => navigate(editTo.replace(':id', row.id))}
                >
                  <Pencil size={16} />{actionsIconOnly ? null : ' Edit'}
                </button>
              )}
              {documentTo && (
                <button
                  type="button"
                  title="Document"
                  aria-label="Document"
                  className={`inline-flex items-center gap-1 text-emerald-700 font-medium mr-2 ${actionsIconOnly ? 'p-1.5 rounded-md hover:bg-emerald-50' : ''}`}
                  onClick={() => navigate(documentTo.replace(':id', row.id))}
                >
                  <FileText size={16} />{actionsIconOnly ? null : ' Document'}
                </button>
              )}
              {letterKey && row[letterKey] && (
                <a
                  className="text-emerald-700 font-medium mr-2"
                  href={fileUrl(row[letterKey], { auth: true })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Letter
                </a>
              )}
              {(fileDownloadApi || (fileKey && row[fileKey])) && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-gray-700 font-medium mr-2"
                  onClick={() => {
                    if (fileDownloadApi) {
                      downloadProtectedFile(fileDownloadApi.replace(':id', row.id), row.title || 'document').catch(() => {});
                      return;
                    }
                    window.open(fileUrl(row[fileKey], { auth: true }), '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Download size={14} /> Download
                </button>
              )}
              {canDeleteRow?.(row, user) && (
                <button
                  type="button"
                  title="Delete"
                  aria-label="Delete"
                  className={`inline-flex items-center gap-1 text-red-600 font-medium ${actionsIconOnly ? 'p-1.5 rounded-md hover:bg-red-50' : ''}`}
                  onClick={() => deleteRow(row)}
                >
                  <Trash2 size={16} />{actionsIconOnly ? null : ' Delete'}
                </button>
              )}
            </>
          ) : undefined}
        />
        )}
      </div>
    </div>
  );
}
