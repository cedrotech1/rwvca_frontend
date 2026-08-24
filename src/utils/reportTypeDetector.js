/**
 * Utility functions to detect and handle report types
 */

/**
 * Detects the type of a report based on its data structure
 * @param {Object} report - The report object
 * @returns {string} - The report type: 'text', 'file', or 'table'
 */
export const detectReportType = (report) => {
  // Check for Text Report (has text_report content)
  if (report.text_report && report.text_report.trim() !== '') {
    return 'text';
  }
  
  // Check for File Report (has file information)
  if (report.fileName || report.filePath || report.fileSize) {
    return 'file';
  }
  
  // Check for Table Report (has data field with array content)
  if (report.data && Array.isArray(report.data) && report.data.length > 0) {
    return 'table';
  }
  
  // Default fallback
  return 'table';
};

/**
 * Gets the display name for a report type
 * @param {string} type - The report type
 * @returns {string} - The display name
 */
export const getReportTypeDisplayName = (type) => {
  const typeNames = {
    'text': 'Text Report',
    'file': 'File Report',
    'table': 'Table Report'
  };
  return typeNames[type] || 'Unknown Report';
};

/**
 * Gets the badge color class for a report type
 * @param {string} type - The report type
 * @returns {string} - The Tailwind CSS class for the badge
 */
export const getReportTypeBadgeColor = (type) => {
  const colors = {
    'text': 'bg-green-100 text-green-800',
    'file': 'bg-blue-100 text-blue-800',
    'table': 'bg-purple-100 text-purple-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

/**
 * Gets the icon component name for a report type
 * @param {string} type - The report type
 * @returns {string} - The icon component name from lucide-react
 */
export const getReportTypeIcon = (type) => {
  const icons = {
    'text': 'Type',
    'file': 'Upload',
    'table': 'FileSpreadsheet'
  };
  return icons[type] || 'FileText';
};

/**
 * Determines if a report can be exported as Excel
 * @param {Object} report - The report object
 * @returns {boolean} - Whether the report can be exported
 */
export const canExportAsExcel = (report) => {
  const type = detectReportType(report);
  return type === 'table' || type === 'file';
};

/**
 * Determines if a report has editable content
 * @param {Object} report - The report object
 * @returns {boolean} - Whether the report has editable content
 */
export const hasEditableContent = (report) => {
  const type = detectReportType(report);
  return type === 'text' || type === 'table';
};

/**
 * Gets a description of what the report contains
 * @param {Object} report - The report object
 * @returns {string} - Description of the report content
 */
export const getReportContentDescription = (report) => {
  const type = detectReportType(report);
  
  switch (type) {
    case 'text':
      return 'Rich text document with formatted content';
    case 'file':
      return `Uploaded file: ${report.fileName || 'Unknown file'}`;
    case 'table':
      const columnCount = report.data && Array.isArray(report.data) ? report.data[0]?.length || 0 : 0;
      const rowCount = report.totalRows || 0;
      return `Data table with ${columnCount} columns and ${rowCount} rows`;
    default:
      return 'Unknown report type';
  }
};

/**
 * Legacy function for backward compatibility
 * Detects report type based on the old logic
 * @param {Object} report - The report object
 * @returns {string} - The report type name
 */
export const getReportTypeName = (report) => {
  const type = detectReportType(report);
  return getReportTypeDisplayName(type);
};

/**
 * Legacy function for backward compatibility
 * Gets badge color based on the old logic
 * @param {Object} report - The report object
 * @returns {string} - The Tailwind CSS class
 */
export const getReportTypeBadgeColorLegacy = (report) => {
  const type = detectReportType(report);
  return getReportTypeBadgeColor(type);
};
