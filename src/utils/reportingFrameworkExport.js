import * as XLSX from 'xlsx';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Normalize common bullet prefixes to a consistent marker. */
const BULLET_LINE = /^\s*(?:[•●▪◦‣]|[-*–—]|\d+[.)])\s+(.*)$/;

const isBulletLine = (line) => BULLET_LINE.test(line);
const bulletText = (line) => {
  const match = String(line).match(BULLET_LINE);
  return match ? match[1].trim() : String(line).trim();
};

/**
 * Keep bullets readable in plain text (Excel / fallback).
 * Ensures each bullet starts with "• " and each item is on its own line.
 */
export const formatWhatToReportPlain = (text) => {
  const raw = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return '';

  return raw
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (isBulletLine(trimmed)) {
        return `• ${bulletText(trimmed)}`;
      }
      return trimmed;
    })
    .join('\n');
};

/**
 * Convert What to Report text into HTML that preserves section headings and bullet lists.
 */
export const formatWhatToReportHtml = (text) => {
  const raw = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return '<span style="color:#9ca3af;">—</span>';

  const lines = raw.split('\n');
  const parts = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    parts.push(
      `<ul style="margin:4px 0 8px 18px;padding:0;">${listItems
        .map(
          (item) =>
            `<li style="margin:2px 0;line-height:1.45;">${escapeHtml(item)}</li>`
        )
        .join('')}</ul>`
    );
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (isBulletLine(trimmed)) {
      listItems.push(bulletText(trimmed));
      return;
    }

    flushList();
    // Section headings (lines ending with ":" or short non-bullet labels)
    const isHeading = /:$/.test(trimmed) || trimmed.length < 80;
    if (isHeading && /:$/.test(trimmed)) {
      parts.push(
        `<div style="font-weight:700;margin:10px 0 4px;color:#111827;">${escapeHtml(trimmed)}</div>`
      );
    } else {
      parts.push(
        `<div style="margin:4px 0;line-height:1.45;">${escapeHtml(trimmed)}</div>`
      );
    }
  });

  flushList();
  return parts.join('');
};

export const buildReportingFrameworkRows = (tableRows = []) =>
  tableRows.map(({ service, categoryName }) => ({
    category: categoryName || 'Uncategorized',
    serviceReport: service?.name || '',
    whatToReport: formatWhatToReportPlain(service?.whatToReport),
    whatToReportHtml: formatWhatToReportHtml(service?.whatToReport),
    status: service?.isActive ? 'Active' : 'Inactive',
  }));

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const frameworkDocumentHtml = (rows, { forPrint = false } = {}) => {
  const dateLabel = new Date().toLocaleString();
  const bodyRows = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.serviceReport)}</td>
        <td class="what-to-report">${row.whatToReportHtml}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporting Framework</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 32px; color: #111827; }
    h1 { color: #00628b; font-size: 22px; margin: 0 0 4px; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; vertical-align: top; text-align: left; }
    th { background: #f3f4f6; color: #374151; font-weight: 700; }
    td.what-to-report ul { list-style-type: disc; list-style-position: outside; }
    td.what-to-report li { page-break-inside: avoid; }
    ${forPrint ? '@page { margin: 12mm; } @media print { body { margin: 8px; } }' : ''}
  </style>
</head>
<body>
  <h1>Reporting Framework</h1>
  <div class="meta">Category · Service Report · What to Report · ${rows.length} item(s) · Exported ${escapeHtml(dateLabel)}</div>
  <table>
    <thead>
      <tr>
        <th style="width:18%">Category</th>
        <th style="width:28%">Service Report</th>
        <th>What to Report</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</body>
</html>`;
};

export const exportReportingFrameworkToExcel = (tableRows, filename = 'reporting_framework') => {
  const rows = buildReportingFrameworkRows(tableRows);
  if (!rows.length) {
    return { success: false, message: 'No reporting framework items to export' };
  }

  const sheetData = [
    ['Category', 'Service Report', 'What to Report', 'Status'],
    ...rows.map((row) => [
      row.category,
      row.serviceReport,
      row.whatToReport,
      row.status,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Preserve bullet line breaks with wrap + taller rows
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; R += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 2 });
    const cell = worksheet[cellAddress];
    if (!cell) continue;
    cell.t = 's';
    cell.z = '@';
    if (!cell.s) cell.s = {};
    cell.s.alignment = { wrapText: true, vertical: 'top' };
  }

  worksheet['!cols'] = [{ wch: 28 }, { wch: 40 }, { wch: 70 }, { wch: 10 }];
  worksheet['!rows'] = sheetData.map((row, index) => {
    if (index === 0) return { hpt: 20 };
    const lines = String(row[2] || '').split('\n').length;
    return { hpt: Math.min(220, Math.max(36, lines * 14)) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporting Framework');
  const safeName = String(filename).replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  XLSX.writeFile(workbook, `${safeName}.xlsx`);
  return { success: true };
};

export const exportReportingFrameworkToWord = (tableRows, filename = 'reporting_framework') => {
  const rows = buildReportingFrameworkRows(tableRows);
  if (!rows.length) {
    return { success: false, message: 'No reporting framework items to export' };
  }

  const html = frameworkDocumentHtml(rows);
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword',
  });
  const safeName = String(filename).replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  downloadBlob(blob, `${safeName}.doc`);
  return { success: true };
};

export const exportReportingFrameworkToPdf = (tableRows) => {
  const rows = buildReportingFrameworkRows(tableRows);
  if (!rows.length) {
    return { success: false, message: 'No reporting framework items to export' };
  }

  const html = frameworkDocumentHtml(rows, { forPrint: true });
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!printWindow) {
    return {
      success: false,
      message: 'Pop-up blocked. Allow pop-ups to export PDF.',
    };
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);

  return { success: true };
};
