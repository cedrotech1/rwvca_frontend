import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Archive, ArrowDownCircle, ArrowUpCircle, Boxes, ChevronDown, ChevronRight,
  ClipboardList, Edit2, PackagePlus, RefreshCw, Search, Trash2, TrendingDown, Warehouse, X,
} from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { DataTable, inputClass, labelClass, StatusBadge } from '../../components/ui/dataUi';
import { formatPhpDateTime } from './workflow/helpers';

const UNITS = ['pieces', 'kg', 'liters', 'meters', 'boxes', 'bottles', 'bags', 'sets'];

const normalizeRole = (role) => String(role || '').trim().toLowerCase();
const canManageInventory = (user) =>
  ['membership coordinator', 'logistic', 'ed', 'chairman', 'admin'].includes(normalizeRole(user?.role));

const emptyItemForm = { name: '', description: '', category: '', unit: 'pieces', min_stock: 10 };
const emptyMovementForm = { item_id: '', type: 'in', quantity: '', reason: '' };

function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-white ring-gray-100 text-gray-900',
    brand: 'bg-[#2f5d31]/5 ring-[#2f5d31]/10 text-[#2f5d31]',
    warning: 'bg-amber-50 ring-amber-100 text-amber-800',
    danger: 'bg-rose-50 ring-rose-100 text-rose-800',
    success: 'bg-emerald-50 ring-emerald-100 text-emerald-800',
  };
  const iconTones = {
    default: 'text-gray-400', brand: 'text-[#2f5d31]',
    warning: 'text-amber-500', danger: 'text-rose-500', success: 'text-emerald-500',
  };
  return (
    <div className={`rounded-2xl p-5 shadow-sm ring-1 ${tones[tone]}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl bg-white/60 p-2.5 ${iconTones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, iconColor = 'text-[#2f5d31]', children, actions, defaultOpen = true, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {actions && open && <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>{actions}</div>}
          {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      {open && <div className="border-t border-gray-50 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function QuickFormField({ label: lbl, children }) {
  return (
    <div>
      <label className={labelClass}>{lbl}</label>
      {children}
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const isManager = canManageInventory(user);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyItemForm);
  const [search, setSearch] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [activeTab, setActiveTab] = useState('items');

  const load = async () => {
    setLoading(true);
    try {
      const [itemsRes, summaryRes, txRes] = await Promise.all([
        api.get('/inventory', { limit: 200 }),
        api.get('/inventory/summary/report'),
        api.get('/inventory/transactions/log', { limit: 100 }),
      ]);
      setItems(itemsRes.data?.items || []);
      setSummary(summaryRes.data || []);
      setTransactions(txRes.data || []);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not load inventory data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const stats = useMemo(() => ({
    totalItems: items.length,
    lowStock: items.filter((i) => Number(i.current_quantity || 0) <= Number(i.min_stock || 0) && Number(i.current_quantity || 0) > 0).length,
    zeroStock: items.filter((i) => Number(i.current_quantity || 0) === 0).length,
    totalUnits: items.reduce((s, i) => s + Number(i.current_quantity || 0), 0),
  }), [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.category || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const submitItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory', itemForm);
      setItemForm(emptyItemForm);
      setShowAddItem(false);
      await load();
      flash('success', 'Item added successfully.');
    } catch (error) {
      flash('error', error.response?.data?.message || 'Could not add item.');
    } finally {
      setSaving(false);
    }
  };

  const submitMovement = async (e) => {
    e.preventDefault();
    if (!movementForm.item_id) return;
    setSaving(true);
    try {
      await api.post(`/inventory/${movementForm.item_id}/transactions`, movementForm);
      setMovementForm(emptyMovementForm);
      await load();
      flash('success', 'Stock movement recorded.');
    } catch (error) {
      flash('error', error.response?.data?.message || 'Could not record movement.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (itemId) => {
    try {
      const res = await api.get(`/inventory/${itemId}`);
      const row = res.data;
      setEditingItem(row);
      setEditForm({ name: row.name || '', description: row.description || '', category: row.category || '', unit: row.unit || 'pieces', min_stock: row.min_stock || 0 });
    } catch (error) {
      flash('error', error.response?.data?.message || 'Could not load item details.');
    }
  };

  const updateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    try {
      await api.put(`/inventory/${editingItem.id}`, editForm);
      setEditingItem(null);
      await load();
      flash('success', 'Item updated successfully.');
    } catch (error) {
      flash('error', error.response?.data?.message || 'Could not update item.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (txId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.del(`/inventory/transactions/${txId}`);
      await load();
      flash('success', 'Transaction deleted.');
    } catch (error) {
      flash('error', error.response?.data?.message || 'Could not delete transaction.');
    }
  };

  const truncateAll = async () => {
    if (window.prompt('Type "DELETE ALL" to clear everything.') !== 'DELETE ALL') return;
    if (!window.confirm('This permanently deletes ALL inventory data. Continue?')) return;
    try {
      await api.del('/inventory/truncate/all');
      await load();
      flash('success', 'All inventory data cleared.');
    } catch (error) {
      flash('error', error.response?.data?.message || 'Could not clear data.');
    }
  };

  const itemColumns = [
    { key: 'name', label: 'Item', render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        {row.description && <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{row.description}</p>}
      </div>
    )},
    { key: 'category', label: 'Category', render: (row) => row.category ? <StatusBadge value={row.category} /> : <span className="text-gray-300">—</span> },
    { key: 'current_quantity', label: 'Stock', render: (row) => {
      const qty = Number(row.current_quantity || 0);
      const min = Number(row.min_stock || 0);
      const color = qty === 0 ? 'text-rose-600 font-bold' : qty <= min ? 'text-amber-600 font-semibold' : 'text-gray-900 font-semibold';
      return <span className={color}>{qty} <span className="text-xs font-normal text-gray-400">{row.unit}</span></span>;
    }},
    { key: 'min_stock', label: 'Min', render: (row) => <span className="text-gray-500">{row.min_stock}</span> },
  ];

  const summaryColumns = [
    { key: 'category', label: 'Category', render: (row) => <span className="font-medium">{row.category}</span> },
    { key: 'item_names', label: 'Items', render: (row) => <span className="text-xs text-gray-500">{row.item_names}</span> },
    { key: 'total_stock', label: 'Total Stock', render: (row) => <span className="font-semibold">{row.total_stock}</span> },
    { key: 'low_stock_count', label: 'Low', render: (row) => Number(row.low_stock_count) > 0 ? <span className="font-semibold text-amber-600">{row.low_stock_count}</span> : <span className="text-gray-300">0</span> },
  ];

  const txColumns = [
    { key: 'transaction_date', label: 'Date', render: (row) => <span className="text-xs text-gray-500">{formatPhpDateTime(row.transaction_date)}</span> },
    { key: 'item.name', label: 'Item', render: (row) => <span className="font-medium">{row.item?.name || '—'}</span> },
    { key: 'type', label: 'Type', render: (row) => (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${row.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {row.type === 'in' ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
        {String(row.type || '').toUpperCase()}
      </span>
    )},
    { key: 'quantity', label: 'Qty', render: (row) => `${row.quantity} ${row.item?.unit || ''}`.trim() },
    { key: 'user.names', label: 'By', render: (row) => <span className="text-xs text-gray-500">{row.user?.names || '—'}</span> },
    { key: 'reason', label: 'Reason', render: (row) => <span className="text-xs text-gray-500">{row.reason || '—'}</span> },
  ];

  const TABS = [
    { id: 'items', label: 'Items', icon: Boxes, count: stats.totalItems },
    { id: 'summary', label: 'Categories', icon: Archive, count: summary.length },
    { id: 'activity', label: 'Activity', icon: ClipboardList, count: transactions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page Banner */}
      <PageHeading
        title="Inventory Management"
        subtitle="Track items, stock movements, categories, and activity history"
        icon={<Warehouse className="h-6 w-6" />}
        actions={[
          ...(isManager ? [{ label: 'New Item', variant: 'primary', icon: <PackagePlus className="h-4 w-4" />, onClick: () => setShowAddItem(true) }] : []),
          { label: 'Refresh', variant: 'secondary', icon: <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />, onClick: () => load() },
        ]}
      />

      {/* Toast */}
      {message && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="ml-3 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Warehouse} label="Total Items" value={stats.totalItems} tone="brand" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock} tone="warning" />
        <StatCard icon={TrendingDown} label="Out of Stock" value={stats.zeroStock} tone="danger" />
        <StatCard icon={Boxes} label="Total Units" value={stats.totalUnits.toLocaleString()} tone="success" />
      </div>

      {/* Stock Movement (manager only) */}
      {isManager && (
        <Section title="Record Stock Movement" icon={ArrowDownCircle} iconColor="text-emerald-600" defaultOpen={false}>
          <form onSubmit={submitMovement} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <QuickFormField label="Item">
              <select className={inputClass} value={movementForm.item_id} onChange={(e) => setMovementForm((p) => ({ ...p, item_id: e.target.value }))} required>
                <option value="">Select item...</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.current_quantity} {i.unit})</option>)}
              </select>
            </QuickFormField>
            <QuickFormField label="Type">
              <select className={inputClass} value={movementForm.type} onChange={(e) => setMovementForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </select>
            </QuickFormField>
            <QuickFormField label="Quantity">
              <input type="number" min="1" className={inputClass} value={movementForm.quantity} onChange={(e) => setMovementForm((p) => ({ ...p, quantity: e.target.value }))} required />
            </QuickFormField>
            <QuickFormField label="Reason / Note">
              <input className={inputClass} value={movementForm.reason} onChange={(e) => setMovementForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Optional" />
            </QuickFormField>
            <div className="flex items-end">
              <button disabled={saving} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
                Record
              </button>
            </div>
          </form>
        </Section>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-[#2f5d31] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? 'bg-[#2f5d31]/10 text-[#2f5d31]' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        {activeTab === 'items' && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-9 pr-4 text-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f5d31] sm:w-64"
            />
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'items' && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="px-5 pt-5 pb-2">
            {loading ? (
              <p className="py-16 text-center text-sm text-gray-400">Loading items...</p>
            ) : (
              <DataTable
                columns={itemColumns}
                rows={filtered}
                renderActions={isManager ? (row) => (
                  <button type="button" onClick={() => openEdit(row.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#2f5d31] hover:bg-[#2f5d31]/5">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                ) : undefined}
                empty="No inventory items yet"
                empty="No inventory items yet"
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-5">
          <DataTable columns={summaryColumns} rows={summary} empty="No category data" />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-5">
          {transactions.length ? (
            <DataTable
              columns={txColumns}
              rows={transactions}
              renderActions={isManager ? (row) => (
                <button type="button" onClick={() => deleteTransaction(row.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              ) : undefined}
            />
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">No activity yet</p>
          )}
        </div>
      )}

      {/* Danger zone */}
      {isManager && (
        <Section title="Danger Zone" icon={Trash2} iconColor="text-rose-500" defaultOpen={false} className="ring-rose-100">
          <p className="text-sm text-rose-600/80">Permanently delete all inventory items and transaction history. This cannot be undone.</p>
          <button type="button" onClick={truncateAll} className="mt-3 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700">
            Truncate All Inventory Data
          </button>
        </Section>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddItem(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Inventory Item</h3>
              <button type="button" onClick={() => setShowAddItem(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitItem} className="space-y-4 p-5">
              <QuickFormField label="Item Name"><input className={inputClass} value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} required /></QuickFormField>
              <QuickFormField label="Description"><textarea className={`${inputClass} min-h-20`} value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} /></QuickFormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <QuickFormField label="Category"><input className={inputClass} value={itemForm.category} onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))} /></QuickFormField>
                <QuickFormField label="Unit">
                  <select className={inputClass} value={itemForm.unit} onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </QuickFormField>
                <QuickFormField label="Min Stock"><input type="number" min="0" className={inputClass} value={itemForm.min_stock} onChange={(e) => setItemForm((p) => ({ ...p, min_stock: e.target.value }))} /></QuickFormField>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddItem(false)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                <button disabled={saving} className="rounded-xl bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e3a1e] disabled:opacity-50">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingItem(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Item</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={updateItem} className="space-y-4 p-5">
              <QuickFormField label="Item Name"><input className={inputClass} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required /></QuickFormField>
              <QuickFormField label="Description"><textarea className={`${inputClass} min-h-20`} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} /></QuickFormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <QuickFormField label="Category"><input className={inputClass} value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} /></QuickFormField>
                <QuickFormField label="Unit">
                  <select className={inputClass} value={editForm.unit} onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </QuickFormField>
                <QuickFormField label="Min Stock"><input type="number" min="0" className={inputClass} value={editForm.min_stock} onChange={(e) => setEditForm((p) => ({ ...p, min_stock: e.target.value }))} /></QuickFormField>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                <button disabled={saving} className="rounded-xl bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e3a1e] disabled:opacity-50">Update Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
