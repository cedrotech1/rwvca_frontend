import * as XLSX from 'xlsx';

export const getHeadersFromServiceFields = (serviceFields = []) =>
  serviceFields.map((field) => field.label);

export const createEmptyTableRow = (serviceFields = []) => {
  const columnCount = serviceFields.length > 0 ? serviceFields.length : 1;
  return new Array(columnCount).fill('');
};

export const clearTableData = (serviceFields = []) => ({
  headers: getHeadersFromServiceFields(serviceFields),
  rows: [createEmptyTableRow(serviceFields)],
});

export const generateSampleValue = (field, rowIndex = 0) => {
  if (!field) return '';

  const label = field.label || 'Value';

  switch (field.type) {
    case 'number':
      return String((rowIndex + 1) * 10);
    case 'select':
      if (field.options?.length > 0) {
        return field.options[rowIndex % field.options.length];
      }
      return 'Option 1';
    case 'boolean':
      return rowIndex % 2 === 0 ? 'true' : 'false';
    case 'date':
      return `2025-0${(rowIndex % 9) + 1}-15`;
    case 'textarea':
      return `Sample ${label} for row ${rowIndex + 1}`;
    case 'text':
    default:
      return `Sample ${label} ${rowIndex + 1}`;
  }
};

export const generateSampleTableData = (serviceFields = [], rowCount = 3) => {
  if (!serviceFields.length) {
    return {
      headers: ['Column 1'],
      rows: [['Sample value']],
    };
  }

  return {
    headers: getHeadersFromServiceFields(serviceFields),
    rows: Array.from({ length: rowCount }, (_, rowIndex) =>
      serviceFields.map((field) => generateSampleValue(field, rowIndex))
    ),
  };
};

export const parseTableSchema = (raw) => {
  if (!raw) return null;
  const schema = typeof raw === 'string' ? (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })() : raw;
  if (!schema || !Array.isArray(schema.fields) || schema.fields.length === 0) {
    return null;
  }
  return {
    ...schema,
    rowMode: schema.rowMode === 'multi' ? 'multi' : 'single',
    fields: schema.fields,
  };
};

/** HQ-defined columns for a request-linked report. Never fall back to service fields. */
export const getRequestTableSchema = (report) =>
  parseTableSchema(report?.reportRequest?.tableSchema);

export const getReportTableColumns = (report) => {
  const requestSchema = getRequestTableSchema(report);
  if (requestSchema?.fields?.length) {
    return requestSchema.fields;
  }

  // Request-linked table: use stored headers / submitted row width, not the service template
  if (report?.reportRequestId) {
    if (report?.headers?.length > 0) {
      return report.headers.map((label) => ({ label }));
    }
    const first = report?.data?.[0];
    const arr = Array.isArray(first?.rowData)
      ? first.rowData
      : Array.isArray(first)
        ? first
        : null;
    if (arr?.length) {
      return arr.map((_, i) => ({ label: `Column ${i + 1}` }));
    }
    return [];
  }

  if (report?.service?.serviceFields?.length > 0) {
    return report.service.serviceFields;
  }

  if (report?.headers?.length > 0) {
    return report.headers.map((label) => ({ label }));
  }

  return [];
};

export const getReportCellValue = (row, field, colIndex) => {
  if (!row) return '';

  if (row.rowData && Array.isArray(row.rowData.rowData)) {
    return row.rowData.rowData[colIndex] ?? '';
  }

  if (row.rowData && typeof row.rowData === 'object' && row.rowData[field?.label]) {
    return row.rowData[field.label] ?? '';
  }

  if (
    row.rowData?.rowData &&
    typeof row.rowData.rowData === 'object' &&
    row.rowData.rowData[field?.label]
  ) {
    return row.rowData.rowData[field.label] ?? '';
  }

  if (Array.isArray(row.rowData)) {
    return row.rowData[colIndex] ?? '';
  }

  if (Array.isArray(row)) {
    return row[colIndex] ?? '';
  }

  return '';
};

export const buildReportTableSheetData = (report) => {
  const columns = getReportTableColumns(report);
  const rows = report?.data ?? [];

  if (columns.length === 0 || rows.length === 0) {
    return null;
  }

  const headers = columns.map((field) => field.label);
  const dataRows = rows.map((row) =>
    columns.map((field, colIndex) => getReportCellValue(row, field, colIndex))
  );

  return { headers, rows: dataRows };
};

export const exportReportTableToExcel = (report, filename) => {
  const sheetData = buildReportTableSheetData(report);

  if (!sheetData) {
    return { success: false, message: 'No table data available to export' };
  }

  const worksheet = XLSX.utils.aoa_to_sheet([
    sheetData.headers,
    ...sheetData.rows,
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');

  const safeName = (filename || report?.title || 'report_data')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  XLSX.writeFile(workbook, `${safeName}.xlsx`);

  return { success: true };
};
