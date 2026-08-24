export const inputClass =
  'w-full rounded-lg border-0 bg-gray-50 ring-1 ring-inset ring-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2f5d31]';

export const labelClass = 'block text-sm font-medium text-gray-600 mb-1.5';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  draft: 'bg-gray-100 text-gray-600',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  reverted: 'bg-orange-50 text-orange-700',
  verified_by_hr: 'bg-sky-50 text-sky-700',
  rejected_by_hr: 'bg-rose-50 text-rose-700',
  rejected_by_ed: 'bg-rose-50 text-rose-700',
  edited: 'bg-indigo-50 text-indigo-700',
  open: 'bg-sky-50 text-sky-700',
  closed: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-indigo-50 text-indigo-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  created: 'bg-emerald-50 text-emerald-700',
  submitted: 'bg-sky-50 text-sky-700',
  viewed: 'bg-gray-100 text-gray-600',
  assigned: 'bg-cyan-50 text-cyan-700',
  reviewed: 'bg-violet-50 text-violet-700',
  verification_process: 'bg-sky-50 text-sky-700',
  authorized: 'bg-emerald-50 text-emerald-700',
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  no_signature: 'bg-gray-100 text-gray-600',
  daily: 'bg-sky-50 text-sky-700',
  weekly: 'bg-indigo-50 text-indigo-700',
  monthly: 'bg-violet-50 text-violet-700',
  quarterly: 'bg-amber-50 text-amber-700',
  yearly: 'bg-emerald-50 text-emerald-700',
  paid: 'bg-emerald-50 text-emerald-700',
  not_paid: 'bg-rose-50 text-rose-700',
  partial: 'bg-amber-50 text-amber-700',
  platinum: 'bg-slate-800 text-white',
  gold: 'bg-amber-50 text-amber-700',
  silver: 'bg-slate-100 text-slate-700',
  bronze: 'bg-orange-50 text-orange-700',
  orange: 'bg-orange-50 text-orange-700',
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
  completed: 'bg-emerald-50 text-emerald-700',
  updated: 'bg-indigo-50 text-indigo-700',
  missed: 'bg-rose-50 text-rose-700',
};

export function statusLabel(value) {
  if (value == null || value === '') return '—';
  return String(value).replace(/_/g, ' ');
}

export function StatusBadge({ value }) {
  if (value == null || value === '' || value === '—') return <span className="text-gray-400">—</span>;
  const key = String(value).toLowerCase().replace(/\s+/g, '_');
  const style = STATUS_STYLES[key] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}>
      {statusLabel(value)}
    </span>
  );
}

export function money(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-RW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function exportCsv(filename, columns, rows) {
  const header = columns.map((col) => `"${String(col.label || col.key).replace(/"/g, '""')}"`).join(',');
  const body = rows.map((row) => columns.map((col) => {
    const raw = typeof col.value === 'function' ? col.value(row) : row[col.key];
    return `"${String(raw ?? '').replace(/"/g, '""')}"`;
  }).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function PaymentMethodBadge({ method }) {
  const value = String(method || '').replace(/_/g, ' ');
  const styles = {
    MOMO: 'bg-violet-50 text-violet-700',
    CASH: 'bg-emerald-50 text-emerald-700',
    BANK: 'bg-sky-50 text-sky-700',
    NOT_INVOICED: 'bg-amber-50 text-amber-700',
    MEMBERSHIP_FEES_REGISTRETION: 'bg-indigo-50 text-indigo-700',
    MEMBERSHIP_FEES_CONTRIBUTION: 'bg-teal-50 text-teal-700',
  };
  const style = styles[String(method || '').toUpperCase()] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${style}`}>
      {value}
    </span>
  );
}

export function DataTable({ columns, rows, empty = 'No records', renderActions, actionsLabel = 'Actions', rowClassName }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              {columns.map((col) => (
                <th key={col.key || col.label} className="px-3 py-2.5 font-semibold whitespace-nowrap">{col.label}</th>
              ))}
              {renderActions && <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">{actionsLabel}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length ? rows.map((row, index) => (
              <tr key={row.id || row.product_id || index} className={typeof rowClassName === 'function' ? rowClassName(row) : (rowClassName || 'hover:bg-gray-50')}>
                {columns.map((col) => (
                  <td key={col.key || col.label} className="px-3 py-3">
                    {typeof col.render === 'function' ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
                {renderActions && <td className="px-3 py-3 text-right whitespace-nowrap">{renderActions(row)}</td>}
              </tr>
            )) : (
              <tr>
                <td className="px-3 py-8 text-center text-gray-400" colSpan={columns.length + (renderActions ? 1 : 0)}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SheetTable({ title, tone = 'teal', columns, rows, empty, footer, exportName }) {
  const tones = {
    teal: 'bg-[#0f766e] text-white',
    red: 'bg-rose-600 text-white',
    green: 'bg-emerald-600 text-white',
    slate: 'bg-slate-700 text-white',
  };
  const csvColumns = columns.map((col) => ({
    key: col.key,
    label: col.label,
    value: (row) => {
      const rendered = typeof col.render === 'function' ? col.render(row) : row[col.key];
      return rendered && typeof rendered === 'object' ? row[col.key] : rendered;
    },
  }));
  return (
    <div className="mb-6 overflow-hidden rounded-xl ring-1 ring-gray-200 bg-white">
      {title && (
        <div className={`px-4 py-2.5 text-sm font-semibold tracking-wide flex items-center justify-between gap-3 ${tones[tone] || tones.teal}`}>
          <span>{title}</span>
          {exportName && rows.length > 0 && (
            <button
              type="button"
              className="text-xs font-medium bg-white/15 hover:bg-white/25 rounded-md px-2 py-1"
              onClick={() => exportCsv(exportName, csvColumns, rows)}
            >
              Export
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              {columns.map((col) => (
                <th key={col.key || col.label} className={`px-3 py-2.5 font-semibold ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length ? rows.map((row, index) => (
              <tr key={row.id || index} className={row.total ? 'bg-teal-50 font-semibold' : 'hover:bg-gray-50'}>
                {columns.map((col) => (
                  <td key={col.key || col.label} className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right tabular-nums' : ''}`}>
                    {typeof col.render === 'function' ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-400">{empty || 'No records'}</td>
              </tr>
            )}
          </tbody>
          {footer}
        </table>
      </div>
    </div>
  );
}
