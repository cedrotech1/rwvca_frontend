import React, { useMemo, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
} from 'lucide-react';

const countBadgeClass = (count) =>
  count > 0
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-500';

export const ServiceCoverageMatrix = ({
  campuses = [],
  services = [],
  academicYears = [],
  reports = [],
  loading = false,
  onRefresh,
  defaultCampusId = null,
  lockCampusFilter = false,
}) => {
  const resolveCampusFilter = (campusId, campusList) => {
    if (campusId != null && campusId !== '') {
      return String(campusId);
    }
    if (campusList.length > 0) {
      return String(campusList[0].id);
    }
    return '';
  };

  const [campusFilter, setCampusFilter] = useState(() =>
    resolveCampusFilter(defaultCampusId, campuses)
  );
  const [serviceSearch, setServiceSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');

  useEffect(() => {
    setCampusFilter(resolveCampusFilter(defaultCampusId, campuses));
  }, [defaultCampusId, campuses]);

  const sortedYears = useMemo(
    () =>
      [...academicYears].sort((a, b) =>
        (a.label || '').localeCompare(b.label || '')
      ),
    [academicYears]
  );

  const visibleYears = useMemo(() => {
    if (academicYearFilter === 'all') return sortedYears;
    return sortedYears.filter((y) => String(y.id) === String(academicYearFilter));
  }, [sortedYears, academicYearFilter]);

  const countMap = useMemo(() => {
    const map = new Map();
    reports.forEach((report) => {
      const campusId = report.campus ?? report.reportCampus?.id;
      const serviceId = report.serviceId ?? report.service?.id;
      const yearId = report.academicYearId ?? report.academicYear?.id;
      if (!campusId || !serviceId || !yearId) return;
      const key = `${campusId}-${serviceId}-${yearId}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [reports]);

  const allRows = useMemo(() => {
    const rows = [];
    campuses.forEach((campus) => {
      services.forEach((service) => {
        const yearCounts = {};
        let rowTotal = 0;

        sortedYears.forEach((year) => {
          const count =
            countMap.get(`${campus.id}-${service.id}-${year.id}`) || 0;
          yearCounts[year.id] = count;
          rowTotal += count;
        });

        rows.push({
          key: `${campus.id}-${service.id}`,
          campusId: campus.id,
          campusName: campus.name,
          serviceId: service.id,
          serviceName: service.name,
          yearCounts,
          rowTotal,
        });
      });
    });

    return rows.sort((a, b) => {
      const campusCmp = a.campusName.localeCompare(b.campusName);
      if (campusCmp !== 0) return campusCmp;
      return a.serviceName.localeCompare(b.serviceName);
    });
  }, [campuses, services, sortedYears, countMap]);

  const filteredRows = useMemo(() => {
    const search = serviceSearch.trim().toLowerCase();

    return allRows.filter((row) => {
      if (campusFilter && String(row.campusId) !== String(campusFilter)) {
        return false;
      }
      if (search && !row.serviceName.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });
  }, [allRows, campusFilter, serviceSearch]);

  const columnTotals = useMemo(() => {
    const totals = {};
    visibleYears.forEach((year) => {
      totals[year.id] = filteredRows.reduce(
        (sum, row) => sum + (row.yearCounts[year.id] || 0),
        0
      );
    });
    totals.grand = filteredRows.reduce((sum, row) => {
      return (
        sum +
        visibleYears.reduce((s, y) => s + (row.yearCounts[y.id] || 0), 0)
      );
    }, 0);
    return totals;
  }, [filteredRows, visibleYears]);

  const hasData = campuses.length > 0 && services.length > 0;
  const showCampusColumn = !campusFilter || campusFilter === 'all';
  const selectedCampusName =
    campuses.find((c) => String(c.id) === String(campusFilter))?.name || '';

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="h-5 w-5 text-[#2f5d31] shrink-0" />
          <h3 className="text-base font-semibold text-gray-900 truncate">
            Service Coverage Matrix
          </h3>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2f5d31] border border-[#2f5d31]/25 rounded hover:bg-[#2f5d31]/5 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="w-full bg-[#2f5d31] text-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75 shrink-0">
              Campus
            </span>
            <div className="h-5 w-px bg-white/25 shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold leading-none truncate">
              {selectedCampusName || '—'}
            </h2>
          </div>
          {!lockCampusFilter && campuses.length > 1 && (
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="max-w-[180px] shrink-0 rounded border-0 bg-white/15 text-white text-sm px-2 py-1.5 focus:ring-2 focus:ring-white/40 cursor-pointer"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id} className="text-gray-900">
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Search service..."
              className="w-full rounded border border-gray-300 bg-white pl-8 pr-2 py-1.5 text-sm focus:ring-1 focus:ring-[#2f5d31]/40 focus:border-[#2f5d31]"
            />
          </div>
          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#2f5d31]/40 focus:border-[#2f5d31]"
          >
            <option value="all">All academic years</option>
            {sortedYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isActive ? ' (active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          {filteredRows.length} service{filteredRows.length === 1 ? '' : 's'}
          {columnTotals.grand > 0 ? ` · ${columnTotals.grand} report${columnTotals.grand === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading matrix data...</div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No campuses or services available</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No rows match your filters</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">
                  No.
                </th>
                {showCampusColumn && (
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap min-w-[120px]">
                    Campus
                  </th>
                )}
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap min-w-[160px]">
                  Service
                </th>
                {visibleYears.map((year) => (
                  <th
                    key={year.id}
                    className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap min-w-[88px]"
                  >
                    {year.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 bg-gray-100 whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRows.map((row, index) => {
                const visibleTotal = visibleYears.reduce(
                  (s, y) => s + (row.yearCounts[y.id] || 0),
                  0
                );
                return (
                  <tr key={row.key} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 text-sm">
                      {index + 1}
                    </td>
                    {showCampusColumn && (
                      <td className="px-3 py-2 font-medium text-gray-900 text-sm">
                        <span className="truncate max-w-[140px] block" title={row.campusName}>
                          {row.campusName}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-gray-800 text-sm">
                      <span className="truncate max-w-[200px] block" title={row.serviceName}>
                        {row.serviceName}
                      </span>
                    </td>
                    {visibleYears.map((year) => {
                      const count = row.yearCounts[year.id] || 0;
                      return (
                        <td key={year.id} className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex min-w-[1.75rem] justify-center px-1.5 py-0.5 rounded text-xs font-semibold ${countBadgeClass(count)}`}
                          >
                            {count}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center bg-gray-50 font-semibold text-gray-800 text-sm">
                      {visibleTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={showCampusColumn ? 3 : 2}
                  className="px-3 py-2 text-right text-[11px] font-semibold text-gray-600 uppercase border-t border-gray-200"
                >
                  Totals
                </td>
                {visibleYears.map((year) => (
                  <td
                    key={year.id}
                    className="px-3 py-2 text-center text-sm font-bold text-gray-900 border-t border-gray-200"
                  >
                    {columnTotals[year.id] || 0}
                  </td>
                ))}
                <td className="px-3 py-2 text-center text-sm font-bold text-[#2f5d31] border-t border-gray-200 bg-gray-100">
                  {columnTotals.grand || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default ServiceCoverageMatrix;
