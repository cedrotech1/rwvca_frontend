import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createEmptyTableRow } from '../../utils/reportTableUtils';

const renderCellInput = (field, value, onChange, error) => {
  const baseClass = `w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31] ${
    error ? 'ring-2 ring-red-300' : ''
  }`;

  switch (field.type) {
    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    case 'textarea':
      return (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    case 'select':
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">— Select —</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'boolean':
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">—</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
  }
};

export const ReportRequestTableEditor = ({ tableSchema, rows, onChange, errors = {} }) => {
  const fields = tableSchema?.fields || [];
  const rowMode = tableSchema?.rowMode === 'multi' ? 'multi' : 'single';

  const normalizedRows = useMemo(() => {
    if (rows?.length) return rows;
    return [createEmptyTableRow(fields)];
  }, [rows, fields]);

  const setRows = (next) => onChange(next);

  const updateCell = (rowIndex, colIndex, value) => {
    const next = normalizedRows.map((row, ri) => {
      if (ri !== rowIndex) return row;
      const copy = [...row];
      copy[colIndex] = value;
      return copy;
    });
    setRows(next);
  };

  const addRow = () => {
    setRows([...normalizedRows, createEmptyTableRow(fields)]);
  };

  const removeRow = (rowIndex) => {
    if (normalizedRows.length <= 1) return;
    setRows(normalizedRows.filter((_, i) => i !== rowIndex));
  };

  if (!fields.length) {
    return (
      <p className="text-sm text-amber-700">This request has no table columns defined. Contact Head Office.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {rowMode === 'single'
          ? 'Fill one row with your campus data as requested by Head Office.'
          : 'Add as many rows as needed for your campus.'}
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {fields.map((field) => (
                <th key={field.key} className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </th>
              ))}
              {rowMode === 'multi' && <th className="w-12 px-2 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {normalizedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {fields.map((field, colIndex) => (
                  <td key={field.key} className="px-3 py-2 align-top">
                    {renderCellInput(
                      field,
                      row[colIndex] ?? '',
                      (value) => updateCell(rowIndex, colIndex, value),
                      errors[`cell-${rowIndex}-${colIndex}`]
                    )}
                    {errors[`cell-${rowIndex}-${colIndex}`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`cell-${rowIndex}-${colIndex}`]}</p>
                    )}
                  </td>
                ))}
                {rowMode === 'multi' && (
                  <td className="px-2 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      disabled={normalizedRows.length <= 1}
                      className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rowMode === 'multi' && (
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          Add row
        </button>
      )}
    </div>
  );
};

export const validateRequestTableRows = (tableSchema, rows) => {
  const fields = tableSchema?.fields || [];
  const errors = {};
  const dataRows = rows?.length ? rows : [createEmptyTableRow(fields)];

  dataRows.forEach((row, rowIndex) => {
    fields.forEach((field, colIndex) => {
      if (field.required && !(row[colIndex] ?? '').toString().trim()) {
        errors[`cell-${rowIndex}-${colIndex}`] = `${field.label} is required`;
      }
    });
  });

  return errors;
};

export default ReportRequestTableEditor;
