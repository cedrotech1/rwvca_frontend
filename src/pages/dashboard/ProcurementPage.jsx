import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList, FileText, Package, Plus, RefreshCw, Search, Upload, X,
} from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { downloadProtectedFile, openProtectedFile } from '../../services/api/config';
import { DataTable, StatusBadge, inputClass, labelClass } from '../../components/ui/dataUi';
import { canAccessProcurement, canManageProcurement } from '../../utils/rwvcaAccess';

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'recorded', label: 'Recorded' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const emptyForm = {
  reference_no: '',
  title: '',
  category: '',
  description: '',
  supplier_name: '',
  amount: '',
  currency: 'RWF',
  status: 'recorded',
  requested_date: '',
  expected_date: '',
  completed_date: '',
  notes: '',
};

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function money(amount, currency = 'RWF') {
  const num = Number(amount || 0);
  return `${currency} ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function ProcurementPage() {
  const { user } = useAuth();
  const allowed = canAccessProcurement(user);
  const canManage = canManageProcurement(user);

  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError('');
    try {
      const [dashRes, listRes] = await Promise.all([
        api.get('/procurements/dashboard'),
        api.get('/procurements', { search: search || undefined, status: status || undefined, limit: 50 }),
      ]);
      setDashboard(dashRes?.data || null);
      setItems(listRes?.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load procurement data');
    } finally {
      setLoading(false);
    }
  }, [allowed, search, status]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const stats = dashboard?.stats;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      reference_no: row.reference_no || '',
      title: row.title || '',
      category: row.category || '',
      description: row.description || '',
      supplier_name: row.supplier_name || '',
      amount: row.amount ?? '',
      currency: row.currency || 'RWF',
      status: row.status || 'recorded',
      requested_date: row.requested_date || '',
      expected_date: row.expected_date || '',
      completed_date: row.completed_date || '',
      notes: row.notes || '',
    });
    setFile(null);
    setFormOpen(true);
  };

  const openDetail = async (row) => {
    try {
      const res = await api.get(`/procurements/${row.id}`);
      setDetail(res?.data || null);
      setNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open record');
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/procurements/${editingId}`, form);
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (value !== undefined && value !== null) fd.append(key, value);
        });
        if (file) fd.append('document', file);
        await api.upload('post', '/procurements', fd);
      }
      setFormOpen(false);
      setEditingId(null);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (row) => {
    if (!canManage) return;
    if (!window.confirm(`Delete procurement "${row.title}"?`)) return;
    try {
      await api.del(`/procurements/${row.id}`);
      if (detail?.id === row.id) setDetail(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const uploadDetailDoc = async (event) => {
    const chosen = event.target.files?.[0];
    if (!chosen || !detail?.id || !canManage) return;
    const fd = new FormData();
    fd.append('document', chosen);
    fd.append('title', chosen.name);
    try {
      const res = await api.upload('post', `/procurements/${detail.id}/documents`, fd);
      setDetail(res?.data || detail);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      event.target.value = '';
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!detail?.id || !note.trim() || !canManage) return;
    try {
      const res = await api.post(`/procurements/${detail.id}/notes`, { note });
      setDetail(res?.data || detail);
      setNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add note');
    }
  };

  const columns = useMemo(() => [
    { key: 'id', label: '#', render: (row, idx) => idx + 1 },
    { key: 'reference_no', label: 'Reference', render: (row) => row.reference_no || '—' },
    { key: 'title', label: 'Title' },
    { key: 'supplier_name', label: 'Supplier', render: (row) => row.supplier_name || '—' },
    { key: 'amount', label: 'Amount', render: (row) => money(row.amount, row.currency) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'documents', label: 'Docs', render: (row) => row.documents?.length || 0 },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="text-sm font-medium text-[#2f5d31]" onClick={() => openDetail(row)}>Open</button>
          {canManage ? (
            <>
              <button type="button" className="text-sm font-medium text-gray-700" onClick={() => openEdit(row)}>Edit</button>
              <button type="button" className="text-sm font-medium text-rose-600" onClick={() => removeRecord(row)}>Delete</button>
            </>
          ) : null}
        </div>
      ),
    },
  ], [canManage]);

  if (!allowed) {
    return (
      <div className="rounded-xl bg-white p-8 text-center ring-1 ring-gray-100">
        <p className="text-gray-600">You do not have access to the Procurement dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Procurement"
        subtitle="Store procurement records, documents, and read statistics. No tender workflow — registry only."
        icon={<Package className="h-6 w-6" />}
        actions={[
          {
            label: 'Refresh',
            variant: 'secondary',
            onClick: () => load(),
            icon: <RefreshCw className="h-4 w-4" />,
          },
          ...(canManage ? [{
            label: 'New record',
            onClick: openCreate,
            icon: <Plus className="h-4 w-4" />,
          }] : []),
        ]}
      />

      {error ? <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total records" value={stats?.total ?? '—'} />
        <StatCard label={`${stats?.year || new Date().getFullYear()} records`} value={stats?.year_total ?? '—'} />
        <StatCard label={`${stats?.year || new Date().getFullYear()} amount`} value={money(stats?.year_amount)} />
        <StatCard label="Documents" value={stats?.documents ?? '—'} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map((item) => (
          <div key={item.value} className="rounded-xl bg-white px-4 py-3 ring-1 ring-gray-100">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900">{stats?.by_status?.[item.value] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className={labelClass}>Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, reference, supplier..."
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {STATUSES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          empty={loading ? 'Loading...' : 'No procurement records yet.'}
        />
      </div>

      {formOpen && canManage ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submitForm} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit procurement' : 'New procurement record'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Title *</label>
                <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Reference</label>
                <input className={inputClass} value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="IT, Furniture, Services..." />
              </div>
              <div>
                <label className={labelClass}>Supplier</label>
                <input className={inputClass} value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Amount</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Requested date</label>
                <input type="date" className={inputClass} value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Expected date</label>
                <input type="date" className={inputClass} value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} min-h-24`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea className={`${inputClass} min-h-20`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {!editingId ? (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Attach document (optional)</label>
                  <input type="file" className={inputClass} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-lg bg-gray-100 px-4 py-2 text-sm" onClick={() => setFormOpen(false)}>Cancel</button>
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {detail ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{detail.reference_no || `PROC-${detail.id}`}</p>
                <h3 className="text-xl font-semibold text-gray-900">{detail.title}</h3>
                <div className="mt-2"><StatusBadge status={detail.status} /></div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <p><span className="text-gray-500">Supplier:</span> {detail.supplier_name || '—'}</p>
              <p><span className="text-gray-500">Amount:</span> {money(detail.amount, detail.currency)}</p>
              <p><span className="text-gray-500">Category:</span> {detail.category || '—'}</p>
              <p><span className="text-gray-500">Created by:</span> {detail.creator?.names || '—'}</p>
            </div>
            {detail.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{detail.description}</p> : null}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> Documents</h4>
                {canManage ? (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2f5d31] px-3 py-1.5 text-xs font-medium text-white">
                    <Upload className="h-3.5 w-3.5" /> Upload
                    <input type="file" className="hidden" onChange={uploadDetailDoc} />
                  </label>
                ) : null}
              </div>
              <div className="space-y-2">
                {(detail.documents || []).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                    <span>{doc.title || doc.file_name || `Document #${doc.id}`}</span>
                    <div className="flex gap-2">
                      <button type="button" className="text-[#2f5d31]" onClick={() => openProtectedFile(doc.file_path)}>Open</button>
                      <button type="button" className="text-gray-600" onClick={() => downloadProtectedFile(doc.file_path, doc.file_name || 'document')}>Download</button>
                    </div>
                  </div>
                ))}
                {!detail.documents?.length ? <p className="text-sm text-gray-500">No documents yet.</p> : null}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="mb-3 flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4" /> Notes</h4>
              <div className="space-y-2">
                {(detail.notes_list || []).map((entry) => (
                  <div key={entry.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap text-gray-800">{entry.note}</p>
                    <p className="mt-1 text-xs text-gray-500">{entry.author?.names || 'Staff'} · {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}</p>
                  </div>
                ))}
                {!detail.notes_list?.length ? <p className="text-sm text-gray-500">No notes yet.</p> : null}
              </div>
              {canManage ? (
                <form onSubmit={addNote} className="mt-3 flex gap-2">
                  <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." />
                  <button className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">Add</button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
