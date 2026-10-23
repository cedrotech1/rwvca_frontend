import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { looksLikeHtml, toPlainPreview } from '../../../utils/sanitize';

const RICH_TEXT_KEYS = new Set([
  'description', 'content', 'bio', 'message', 'purpose', 'notes', 'requirements',
  'why_apply', 'comment', 'comment_text', 'reply_text', 'what_to_report', 'whatToReport',
  'text_report', 'challenge', 'wayForward', 'way_forward',
]);

export function useStaffOptions() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/departments', { limit: 200 }).then((res) => {
      setDepartments(res.data?.items || res.data || []);
    }).catch(() => {});
    api.get('/users', { limit: 200, active: 1 }).then((res) => {
      setUsers(res.data?.items || res.data || []);
    }).catch(() => {});
  }, []);

  return { departments, users };
}

export function cellValue(row, key) {
  if (!key) return '—';
  const parts = String(key).split('.');
  let value = row;
  parts.forEach((part) => {
    value = value?.[part];
  });
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return value.names || value.name || value.title || JSON.stringify(value);
  return String(value);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatDate(value) {
  if (!value || value === '—') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTime(value) {
  if (!value || value === '—') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatPhpDate(value) {
  if (!value || value === '—') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatPhpDateTime(value, withSeconds = false) {
  if (!value || value === '—') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}${withSeconds ? `:${pad(date.getSeconds())}` : ''}`;
  return `${formatPhpDate(value)} at ${time}`;
}

export function formatMoney(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return amount.toLocaleString('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatPlainPreview(value, maxLength = 140) {
  const text = toPlainPreview(value, maxLength);
  return text || '—';
}

function shouldPlainPreview(col, raw) {
  if (col.format === 'plain' || col.format === 'richtext' || col.format === 'html') return true;
  const key = String(col.key || '').split('.').pop();
  if (RICH_TEXT_KEYS.has(key)) return true;
  return looksLikeHtml(raw);
}

export function formatCell(row, col) {
  if (col.format === 'id') return row.id ? `#${row.id}` : '—';
  if (col.format === 'date') return formatDate(cellValue(row, col.key));
  if (col.format === 'datetime') return formatDateTime(cellValue(row, col.key));
  if (col.format === 'money') return formatMoney(row[col.key] ?? cellValue(row, col.key));
  if (col.format === 'period') {
    return `${formatDate(cellValue(row, col.from))} – ${formatDate(cellValue(row, col.to))}`;
  }
  if (col.format === 'letter') {
    const url = cellValue(row, col.key);
    return url && url !== '—' ? 'View' : '—';
  }
  if (col.format === 'fileType') {
    const type = row.file_type || String(row.file_path || '').split('.').pop();
    return type && type !== '—' ? String(type).toUpperCase() : '—';
  }
  if (col.format === 'classification') {
    const amount = Number(row.total_amount_requested || 0);
    if (!amount) return 'Not Specified';
    return amount < 100000 ? 'Petty Cash' : 'Normal';
  }
  if (col.format === 'count') {
    const value = row[col.key];
    if (Array.isArray(value)) return String(value.length);
    return String(value ?? 0);
  }
  if (col.format === 'locationAssigned') {
    if (row.location === 'user' && row.user?.names) return row.user.names;
    if (row.location === 'office') return 'Office';
    return cellValue(row, col.key);
  }
  if (col.format === 'active') {
    return Number(row.active) === 1 || row.active === true ? 'Active' : 'Inactive';
  }
  if (col.format === 'yesno') {
    const value = row[col.key];
    return value === true || value === 1 || value === '1' ? 'Yes' : 'No';
  }
  if (col.format === 'status' || String(col.key || '').toLowerCase().includes('status')) {
    const value = cellValue(row, col.key);
    return value === '—' ? '—' : String(value).replace(/_/g, ' ');
  }

  const raw = row[col.key] ?? cellValue(row, col.key);
  if (raw === '—' || raw === null || raw === undefined || raw === '') return '—';
  if (shouldPlainPreview(col, raw)) {
    return formatPlainPreview(raw, col.maxLength || 140);
  }
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : cellValue(row, col.key);
}

export function isStatusColumn(col) {
  return col.format === 'status' || String(col.key || '').toLowerCase().includes('status');
}
