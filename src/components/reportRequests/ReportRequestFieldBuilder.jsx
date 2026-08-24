import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'date', label: 'Date' },
];

const AGG_TYPES = [
  { value: 'sum', label: 'Total (sum)' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count filled' },
];

const slugKey = (label, index) =>
  String(label || `field_${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || `field_${index + 1}`;

export const createEmptyField = (index = 0) => ({
  key: `field_${index + 1}`,
  label: '',
  type: 'text',
  required: false,
  options: [],
});

export const ReportRequestFieldBuilder = ({
  fields = [],
  onChange,
  rowMode = 'single',
  onRowModeChange,
  aggregations = [],
  onAggregationsChange,
}) => {
  const updateField = (index, patch) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const addField = () => {
    onChange([...fields, createEmptyField(fields.length)]);
  };

  const removeField = (index) => {
    const removed = fields[index];
    onChange(fields.filter((_, i) => i !== index));
    if (removed && onAggregationsChange) {
      onAggregationsChange(
        aggregations.filter((a) => a.fieldKey !== removed.key)
      );
    }
  };

  const numericFields = fields.filter((f) => f.type === 'number');

  const toggleAggregation = (fieldKey, type) => {
    if (!onAggregationsChange) return;
    const exists = aggregations.find((a) => a.fieldKey === fieldKey && a.type === type);
    if (exists) {
      onAggregationsChange(aggregations.filter((a) => !(a.fieldKey === fieldKey && a.type === type)));
      return;
    }
    const field = fields.find((f) => f.key === fieldKey);
    onAggregationsChange([
      ...aggregations,
      {
        fieldKey,
        type,
        label: `${AGG_TYPES.find((t) => t.value === type)?.label || type} — ${field?.label || fieldKey}`,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm font-medium text-gray-900">Table layout</div>
        <p className="mt-1 text-xs text-gray-600">
          Single row = one line per campus (summary matrix). Multiple rows = campuses can add many data lines.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <input
              type="radio"
              name="rowMode"
              checked={rowMode === 'single'}
              onChange={() => onRowModeChange?.('single')}
            />
            One row per campus
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <input
              type="radio"
              name="rowMode"
              checked={rowMode === 'multi'}
              onChange={() => onRowModeChange?.('multi')}
            />
            Multiple rows per campus
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Columns campuses must fill</span>
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-1 rounded-md bg-[#2f5d31] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1e3a1e]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add column
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            Add at least one column (e.g. Male students, Female students, Total beds).
          </p>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-start"
              >
                <GripVertical className="mt-2 hidden h-4 w-4 text-gray-300 sm:block" />
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-4">
                  <input
                    type="text"
                    placeholder="Column label *"
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateField(index, { label, key: slugKey(label, index) });
                    }}
                    className="rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    className="rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31]"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(field.required)}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  {field.type === 'select' ? (
                    <input
                      type="text"
                      placeholder="Options (comma separated)"
                      value={(field.options || []).join(', ')}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="rounded-md border-0 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31] sm:col-span-1"
                    />
                  ) : (
                    <div className="text-xs text-gray-400 sm:col-span-1 sm:pt-2">Key: {field.key}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="rounded-md p-2 text-red-500 hover:bg-red-50"
                  title="Remove column"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {numericFields.length > 0 && onAggregationsChange && (
        <div className="rounded-lg border border-[#2f5d31]/20 bg-[#2f5d31]/5 p-4">
          <div className="text-sm font-medium text-gray-900">HQ combined calculations (optional)</div>
          <p className="mt-1 text-xs text-gray-600">
            Head Office will see these totals across all campuses automatically.
          </p>
          <div className="mt-3 space-y-2">
            {numericFields.map((field) => (
              <div key={field.key} className="flex flex-wrap items-center gap-2">
                <span className="min-w-[8rem] text-sm font-medium text-gray-800">{field.label}</span>
                {AGG_TYPES.map((agg) => {
                  const active = aggregations.some(
                    (a) => a.fieldKey === field.key && a.type === agg.value
                  );
                  return (
                    <button
                      key={`${field.key}-${agg.value}`}
                      type="button"
                      onClick={() => toggleAggregation(field.key, agg.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? 'bg-[#2f5d31] text-white'
                          : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {agg.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportRequestFieldBuilder;
