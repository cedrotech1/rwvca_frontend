import { detectReportType } from './reportTypeDetector';

export const computeReportListStats = (reports = []) => {
  const stats = {
    totalReports: reports.length,
    publishedReports: 0,
    draftReports: 0,
    archivedReports: 0,
    fileReports: 0,
    dataReports: 0,
    textReports: 0,
  };

  reports.forEach((report) => {
    if (report.status === 'published') stats.publishedReports += 1;
    else if (report.status === 'draft') stats.draftReports += 1;
    else if (report.status === 'archived') stats.archivedReports += 1;

    const type = detectReportType(report);
    if (type === 'file') stats.fileReports += 1;
    else if (type === 'text') stats.textReports += 1;
    else stats.dataReports += 1;
  });

  const total = stats.totalReports || 1;
  stats.publishedPercentage = Math.round((stats.publishedReports / total) * 100);
  stats.draftPercentage = Math.round((stats.draftReports / total) * 100);
  stats.filePercentage = Math.round((stats.fileReports / total) * 100);
  stats.dataPercentage = Math.round((stats.dataReports / total) * 100);

  return stats;
};

export const buildReportQueryFilters = (filters, pagination = {}) => ({
  search: filters.search || '',
  status: filters.status === 'all' ? '' : filters.status,
  campus: filters.campus === 'all' ? '' : filters.campus,
  type: filters.type === 'all' ? '' : filters.type,
  userId: filters.userId === 'all' ? '' : filters.userId,
  category: filters.category === 'all' ? '' : filters.category,
  service: filters.service === 'all' ? '' : filters.service,
  academicYear: filters.academicYear === 'all' ? '' : filters.academicYear,
  sortBy: filters.sortBy || 'createdAt',
  sortOrder: filters.sortOrder || 'desc',
  includeAllCampuses: filters.includeAllCampuses,
  page: pagination.page || 1,
  limit: pagination.limit || 5000,
});
