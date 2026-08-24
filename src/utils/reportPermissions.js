import { isCampusWelfareRole } from './roleHelpers';

export const canCreateReport = (role) =>
  isCampusWelfareRole(role) || role === 'wadden' || role === 'head_quarter';

/** Campus welfare/IT publishes; HQ/admin may also publish. Wardens submit drafts only. DVC is view-only. */
export const canPublishReport = (role) =>
  isCampusWelfareRole(role) || role === 'head_quarter' || role === 'admin';

/** HQ/DVC only see published reports; campus roles manage drafts. */
export const canEditReportContent = (role, report) => {
  if (!role || !report) return false;
  if (report.status === 'published') return false;
  if (role === 'head_quarter' || role === 'dvc') return false;
  return role === 'admin' || isCampusWelfareRole(role) || role === 'wadden';
};

export const createsGeneralReport = (role) => role === 'head_quarter';

/** DVC views published reports authored by head_quarter only. */
export const isDvcViewer = (role) => role === 'dvc';

export const GENERAL_CAMPUS_LABEL = 'General';

/** Display name for a campus row/chart (null campus → General). */
export const formatCampusDisplayName = (campusName, campusId = null) => {
  const id = campusId == null || campusId === '' ? null : Number(campusId);
  const name = campusName == null ? '' : String(campusName).trim();

  if (id == null || Number.isNaN(id)) {
    if (!name || name === 'Unknown Campus' || name === 'null' || name === 'undefined') {
      return GENERAL_CAMPUS_LABEL;
    }
    return name;
  }

  if (!name || name === 'Unknown Campus') {
    return `Campus ${id}`;
  }
  return name;
};

export const getReportCampusLabel = (report) => {
  if (report?.campus == null && !report?.reportCampus) {
    return GENERAL_CAMPUS_LABEL;
  }
  return formatCampusDisplayName(
    report?.reportCampus?.name,
    report?.campus ?? report?.reportCampus?.id
  );
};
