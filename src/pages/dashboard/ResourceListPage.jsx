import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import RichTextEditor from '../../components/RichTextEditor';
import { DataTable, StatusBadge, exportCsv, inputClass, labelClass } from '../../components/ui/dataUi';
import api from '../../services/api';
import { fileUrl } from '../../services/api/config';
import { useAuth } from '../../contexts/AuthContext';
import { cellValue, formatCell, isStatusColumn } from './workflow/helpers';

function rowId(row, idKey) {
  return row?.[idKey] ?? row?.id ?? row?.product_id ?? row?.category_id;
}

export default function ResourceListPage({
  title,
  subtitle,
  path,
  columns,
  createFields = [],
  fileField,
  fileLabel = 'Image',
  imageField,
  extraFileField,
  extraFileLabel = 'Extra image',
  extraFilePath,
  moreFiles = [],
  createTransform,
  idKey = 'id',
  defaults = {},
  fileRequired = true,
  allowCreate,
  allowDelete = true,
}) {
  const canCreate = allowCreate ?? Boolean(createFields.length || fileField);
  const canEdit = Boolean(createFields.length || fileField || moreFiles.length);
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...defaults });
  const [file, setFile] = useState(null);
  const [extraFile, setExtraFile] = useState(null);
  const [moreUploads, setMoreUploads] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);

  const isVisible = (field) => {
    if (typeof field.showIf === 'function') return field.showIf(user, form);
    return field.showIf !== false;
  };

  const load = async () => {
    const res = await api.get(path, { search, limit: 100 });
    setItems(res.data?.items || (Array.isArray(res.data) ? res.data : []) || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Could not load records'));
  }, [path]);

  useEffect(() => {
    if (!createFields.some((field) => field.optionsKey === 'assetTypes')) return;
    api.get('/asset-types', { limit: 200 }).then((res) => {
      setAssetTypes(res.data?.items || res.data || []);
    }).catch(() => {});
  }, [createFields]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaults });
    setFile(null);
    setExtraFile(null);
    setMoreUploads({});
    setError('');
    setOpen(true);
  };

  const openEdit = (row) => {
    const next = { ...defaults };
    createFields.forEach((field) => {
      let value = row[field.name] ?? defaults[field.name] ?? '';
      if (field.type === 'date' && value) value = String(value).slice(0, 10);
      next[field.name] = value;
    });
    setEditing(row);
    setForm(next);
    setFile(null);
    setExtraFile(null);
    setMoreUploads({});
    setError('');
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      const payload = createTransform ? createTransform({ ...form }, user) : form;
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      if (file && fileField) data.append(fileField, file);
      Object.entries(moreUploads).forEach(([name, value]) => {
        if (value) data.append(name, value);
      });
      const id = editing ? rowId(editing, idKey) : null;
      const saved = editing
        ? await api.upload('put', `${path}/${id}`, data)
        : await api.upload('post', path, data);
      const createdId = saved?.data?.[idKey] || saved?.data?.product_id || saved?.data?.category_id || saved?.data?.id || id;
      if (extraFile && extraFilePath && createdId) {
        const extra = new FormData();
        extra.append(extraFileField || 'image', extraFile);
        await api.upload('post', extraFilePath.replace(':id', String(createdId)), extra);
      }
      setOpen(false);
      setEditing(null);
      setForm({ ...defaults });
      setFile(null);
      setExtraFile(null);
      setMoreUploads({});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) return;
    try {
      await api.del(`${path}/${rowId(row, idKey)}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete');
    }
  };

  const rows = useMemo(() => items, [items]);
  const richtextKeys = useMemo(
    () => new Set(createFields.filter((field) => field.type === 'richtext').map((field) => field.name)),
    [createFields]
  );
  const tableColumns = columns.map((col) => {
    const resolvedCol = richtextKeys.has(col.key) && !col.format
      ? { ...col, format: 'plain', maxLength: col.maxLength || 120 }
      : col;
    return {
      ...resolvedCol,
      render: (row) => {
        if (resolvedCol.image) {
          return cellValue(row, resolvedCol.key) !== '—'
            ? <img src={fileUrl(cellValue(row, resolvedCol.key), { auth: Boolean(resolvedCol.private) })} alt="" className="h-12 w-16 object-cover rounded" />
            : '—';
        }
        if (isStatusColumn(resolvedCol) || resolvedCol.format === 'active') {
          return <StatusBadge value={resolvedCol.format === 'active' ? (Number(row.active) === 1 || row.active === true || Number(row.is_active) === 1 ? 'Active' : 'Inactive') : row[resolvedCol.key]} />;
        }
        const formatted = formatCell(row, resolvedCol);
        if (resolvedCol.format === 'plain' || resolvedCol.format === 'richtext' || resolvedCol.format === 'html') {
          return (
            <span title={typeof formatted === 'string' && formatted !== '—' ? formatted : undefined} className="block max-w-md text-sm text-gray-600 line-clamp-2">
              {formatted}
            </span>
          );
        }
        return formatted;
      },
    };
  });

  return (
    <div>
      <PageHeading
        title={title}
        subtitle={subtitle}
        icon={<ClipboardList className="h-6 w-6" />}
        actions={[
          { label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: () => exportCsv(String(title || 'export').toLowerCase().replace(/\s+/g, '-'), columns, rows), disabled: !rows.length },
          ...((canCreate) ? [{ label: 'Add', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: openCreate }] : []),
        ]}
      />
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onBlur={load} placeholder="Search..." className={`mb-4 max-w-sm ${inputClass}`} />
        {error && !open && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <DataTable
          columns={tableColumns}
          rows={rows}
          empty="No records yet"
          renderActions={(row) => (
            <div className="flex justify-end gap-2">
              {canEdit && (
                <button type="button" className="inline-flex items-center gap-1 font-medium text-[#2f5d31]" onClick={() => openEdit(row)}>
                  <Pencil size={14} /> Edit
                </button>
              )}
              {allowDelete && (
              <button type="button" className="inline-flex items-center gap-1 font-medium text-rose-600" onClick={() => remove(row)}>
                <Trash2 size={14} /> Delete
              </button>
              )}
            </div>
          )}
        />
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className={`bg-white rounded-xl p-6 w-full space-y-3 shadow-xl max-h-[90vh] overflow-y-auto ${createFields.some((field) => field.type === 'richtext') ? 'max-w-3xl' : 'max-w-lg'}`}>
            <h2 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} {title}</h2>
            {createFields.map((field) => (
              !isVisible(field) ? null : (
                <div key={field.name}>
                  <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
                  {field.type === 'richtext' ? (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <RichTextEditor
                        value={form[field.name] || ''}
                        onChange={(html) => setForm({ ...form, [field.name]: html })}
                        placeholder={field.placeholder || `Write ${field.label.toLowerCase()}...`}
                      />
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea required={field.required} className={inputClass} value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                  ) : field.type === 'select' ? (
                    <select required={field.required} className={inputClass} value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
                      <option value="">{field.placeholder || 'Select'}</option>
                      {((field.optionsKey === 'assetTypes'
                        ? assetTypes.map((item) => ({ value: item.id, label: item.name }))
                        : field.options) || []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input required={field.required} className={inputClass} type={field.type || 'text'} value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                  )}
                </div>
              )
            ))}
            {fileField && (
              <div>
                <label className={labelClass}>{fileLabel}{!editing && fileRequired ? ' *' : ''}</label>
                <input type="file" required={!editing && fileRequired} className={inputClass} onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            )}
            {moreFiles.map((item) => (
              <div key={item.name}>
                <label className={labelClass}>{item.label || item.name}</label>
                <input type="file" className={inputClass} onChange={(e) => setMoreUploads((prev) => ({ ...prev, [item.name]: e.target.files?.[0] || null }))} />
              </div>
            ))}
            {(extraFileField || extraFilePath) && (
              <div>
                <label className={labelClass}>{extraFileLabel}</label>
                <input type="file" className={inputClass} onChange={(e) => setExtraFile(e.target.files?.[0] || null)} />
              </div>
            )}
            {imageField && file && <p className="text-xs text-gray-500">{file.name}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={() => setOpen(false)}>Cancel</button>
              <button disabled={loading} className="px-4 py-2 rounded-lg bg-[#2f5d31] text-white">{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
