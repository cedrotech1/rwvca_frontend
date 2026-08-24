import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Table2, BarChart3, Filter } from 'lucide-react';
import apiClient from '../../services/api/config';
import { sanitizeHtml } from '../../utils/sanitize';
import { ReportRequestCombinedCharts } from './ReportRequestCombinedCharts';

const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return '—';
  if (Number.isInteger(value)) return value.toLocaleString();
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const toNumber = (value) => {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const groupRowsByCampus = (rows) => {
  const groups = [];
  let prev = null;
  for (const row of rows) {
    if (!prev || prev.campusId !== row.campusId) {
      prev = { campusId: row.campusId, campusName: row.campusName, rows: [] };
      groups.push(prev);
    }
    prev.rows.push(row);
  }
  return groups;
};

export const ReportRequestCombinedView = ({ combined, loading }) => {
  const [campusFilter, setCampusFilter] = useState('all');

  const tableSchema = combined?.tableSchema;
  const combinedRows = combined?.combinedRows || [];
  const campusSummaries = combined?.campusSummaries;
  const uniqueCampuses = combined?.uniqueCampuses;
  const fileSubmissions = combined?.fileSubmissions || [];
  const textSubmissions = combined?.textSubmissions || [];
  const calculations = combined?.calculations;
  const stats = combined?.stats;
  const charts = combined?.charts;
  const submissionFormat = combined?.submissionFormat;

  const fields = tableSchema?.fields || [];
  const numericFields = useMemo(() => fields.filter((f) => f.type === 'number'), [fields]);

  const filteredRows = useMemo(() => {
    if (campusFilter === 'all') return combinedRows;
    const id = Number(campusFilter);
    return combinedRows.filter((r) => r.campusId === id);
  }, [combinedRows, campusFilter]);

  const campusGroups = useMemo(() => groupRowsByCampus(filteredRows), [filteredRows]);

  const filteredSummaries = useMemo(() => {
    if (!campusSummaries) return [];
    if (campusFilter === 'all') return campusSummaries;
    const id = Number(campusFilter);
    return campusSummaries.filter((s) => s.campusId === id);
  }, [campusSummaries, campusFilter]);

  const overallTotals = useMemo(() => {
    if (!numericFields.length || !filteredRows.length) return null;
    const totals = {};
    numericFields.forEach((f) => {
      const nums = filteredRows.map((r) => toNumber(r.values?.[f.key])).filter((n) => n !== null);
      totals[f.key] = nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    });
    return totals;
  }, [numericFields, filteredRows]);

  if (loading) {
    return <div className="p-6 text-center text-sm text-gray-500">Loading combined data…</div>;
  }

  if (!combined) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        No combined data yet. Campuses must publish their reports first.
      </div>
    );
  }

  const isTableRequest = submissionFormat === 'table';
  const showTable = isTableRequest && (combined.primaryView === 'table' || combinedRows.length > 0);
  const showCharts = isTableRequest && charts?.enabled && combinedRows.length > 0;
  const showFiles = fileSubmissions.length > 0;
  const showText = textSubmissions.length > 0;
  const isMulti = tableSchema?.rowMode === 'multi';

  const downloadUrl = (filePath) => {
    if (!filePath) return '#';
    if (filePath.startsWith('http')) return filePath;
    const base = apiClient.defaults.baseURL || '';
    return `${base.replace(/\/$/, '')}/${String(filePath).replace(/^\//, '')}`;
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs text-gray-500">Published</div>
          <div className="text-xl font-bold text-[#2f5d31]">
            {stats.submitted}/{stats.totalCampuses}
          </div>
        </div>
        {combinedRows.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-xs text-gray-500">Data rows</div>
            <div className="text-xl font-bold text-gray-900">{stats.tableRowCount}</div>
          </div>
        )}
        {fileSubmissions.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-xs text-gray-500">File uploads</div>
            <div className="text-xl font-bold text-gray-900">{stats.fileCount}</div>
          </div>
        )}
        {textSubmissions.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-xs text-gray-500">Text summaries</div>
            <div className="text-xl font-bold text-gray-900">{stats.textCount}</div>
          </div>
        )}
      </div>

      {/* Calculation cards */}
      {calculations?.length > 0 && (
        <section className="rounded-xl border border-[#2f5d31]/20 bg-gradient-to-br from-[#2f5d31]/5 to-white p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <BarChart3 className="h-4 w-4 text-[#2f5d31]" />
            Combined analysis (all campuses)
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {calculations.map((calc) => (
              <div
                key={`${calc.fieldKey}-${calc.type}`}
                className="rounded-lg border border-white bg-white/90 p-4 shadow-sm"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {calc.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-[#2f5d31]">
                  {calc.isNumeric ? formatNumber(calc.value) : calc.value ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts */}
      {showCharts && (
        <ReportRequestCombinedCharts charts={charts} submissionFormat={submissionFormat} />
      )}

      {/* Combined table */}
      {showTable && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Table2 className="h-5 w-5 text-[#2f5d31]" />
              <h4 className="text-base font-semibold text-gray-900">
                Combined table — all campuses
              </h4>
            </div>
            {(uniqueCampuses?.length || 0) > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="rounded-md border-0 bg-gray-100 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                >
                  <option value="all">All campuses ({uniqueCampuses?.length || 0})</option>
                  {(uniqueCampuses || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filteredRows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No table submissions match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Campus
                    </th>
                    {fields.map((f) => (
                      <th
                        key={f.key}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
                      >
                        {f.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Report
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campusGroups.map((group) => {
                    const rowCount = group.rows.length;
                    const campusSummary = filteredSummaries.find(
                      (s) => s.campusId === group.campusId
                    );
                    const showCampusSubtotal =
                      isMulti && numericFields.length > 0 && rowCount > 1 && campusSummary;

                    return (
                      <React.Fragment key={group.campusId}>
                        {group.rows.map((row, rowIdx) => {
                          const isFirst = rowIdx === 0;
                          const isLast = rowIdx === rowCount - 1;
                          const borderBottom =
                            isLast && !showCampusSubtotal
                              ? 'border-b-2 border-gray-300'
                              : 'border-b border-gray-100';

                          return (
                            <tr
                              key={`${row.campusId}-${row.rowIndex}-${rowIdx}`}
                              className={`hover:bg-gray-50/80 ${borderBottom}`}
                            >
                              {isFirst && (
                                <td
                                  rowSpan={rowCount}
                                  className="whitespace-nowrap border-r border-gray-200 px-4 py-3 align-top font-semibold text-gray-900"
                                >
                                  {group.campusName}
                                </td>
                              )}
                              {fields.map((f) => (
                                <td key={f.key} className="px-4 py-2 text-gray-700">
                                  {row.values?.[f.key] ?? '—'}
                                </td>
                              ))}
                              {isFirst && (
                                <td
                                  rowSpan={rowCount}
                                  className="border-l border-gray-200 px-4 py-3 align-top"
                                >
                                  <Link
                                    to={`/reports/view/${row.reportId}`}
                                    className="text-[#2f5d31] hover:underline"
                                  >
                                    View
                                  </Link>
                                </td>
                              )}
                            </tr>
                          );
                        })}

                        {showCampusSubtotal && (
                          <tr className="border-b-2 border-gray-300 bg-blue-50/60 font-semibold text-[#2f5d31]">
                            <td className="border-r border-gray-200 px-4 py-2">
                              {group.campusName} subtotal
                            </td>
                            {fields.map((f) => (
                              <td key={f.key} className="px-4 py-2">
                                {f.type === 'number'
                                  ? formatNumber(campusSummary.values[f.key] ?? null)
                                  : ''}
                              </td>
                            ))}
                            <td />
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Overall grand total */}
                  {overallTotals && numericFields.length > 0 && (
                    <tr className="bg-[#2f5d31]/10 font-bold text-[#2f5d31]">
                      <td className="border-r border-gray-200 px-4 py-3">
                        Grand total
                      </td>
                      {fields.map((f) => (
                        <td key={f.key} className="px-4 py-3">
                          {f.type === 'number'
                            ? formatNumber(overallTotals[f.key])
                            : ''}
                        </td>
                      ))}
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Files */}
      {showFiles && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <Download className="h-5 w-5 text-[#2f5d31]" />
            <h4 className="text-base font-semibold text-gray-900">Uploaded files by campus</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Campus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    File
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fileSubmissions.map((f) => (
                  <tr key={`${f.campusId}-${f.reportId}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{f.campusName}</td>
                    <td className="px-4 py-3 text-gray-700">{f.fileName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {f.submittedAt ? new Date(f.submittedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={downloadUrl(f.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 text-[#2f5d31] hover:underline"
                      >
                        Download
                      </a>
                      <Link
                        to={`/reports/view/${f.reportId}`}
                        className="text-gray-600 hover:underline"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Text */}
      {showText && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <FileText className="h-5 w-5 text-[#2f5d31]" />
            <h4 className="text-base font-semibold text-gray-900">Text / summary responses</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {textSubmissions.map((t) => (
              <div key={t.reportId} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{t.campusName}</span>
                  <Link
                    to={`/reports/view/${t.reportId}`}
                    className="text-sm text-[#2f5d31] hover:underline"
                  >
                    Open report
                  </Link>
                </div>
                <div
                  className="rich-text-editor rich-text-preview mt-2 text-sm text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(t.text || ''),
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ReportRequestCombinedView;
