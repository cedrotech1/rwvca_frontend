import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Eye, Package, Pencil, RotateCcw, Search, Settings, Trash2, X } from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { inputClass, labelClass, DataTable, StatusBadge } from '../../components/ui/dataUi';
import { cellValue, formatPhpDate, formatPhpDateTime } from './workflow/helpers';

const normalizeRole = (role) => String(role || '').trim().toLowerCase();
const canManageAssets = (user) => ['logistic', 'membership coordinator'].includes(normalizeRole(user?.role));

const emptyCreateForm = {
  asset_type_id: '',
  name: '',
  serial_number: '',
  label_number: '',
  description: '',
  initial_location: 'office',
  condition_notes: '',
};

const emptyTypeForm = {
  name: '',
  description: '',
};

const emptyRequestForm = {
  reason: '',
};

const emptyReturnForm = {
  comment: '',
};

function Modal({ title, onClose, children, width = 'max-w-3xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${width} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function SearchTypeButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm ${active ? 'border-[#2f5d31] bg-[#2f5d31] text-white' : 'border-blue-200 bg-white text-[#2f5d31] hover:bg-blue-50'}`}
    >
      {label}
    </button>
  );
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isManager = canManageAssets(user);
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({
    search_type: 'all',
    search: '',
    status: '',
    asset_type: '',
    department: '',
    location: '',
  });
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);
  const [editForm, setEditForm] = useState(null);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [returnForm, setReturnForm] = useState(emptyReturnForm);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailAsset, setDetailAsset] = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const loadAssets = async (params = filters) => {
    setLoading(true);
    try {
      const res = await api.get('/assets', params);
      setAssets(res.data?.items || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load assets.' });
    } finally {
      setLoading(false);
    }
  };

  const loadAssetTypes = async () => {
    try {
      const res = await api.get('/asset-types', { limit: 200 });
      setAssetTypes(res.data?.items || []);
    } catch {
      setAssetTypes([]);
    }
  };

  const openDetails = async (assetId) => {
    try {
      const res = await api.get(`/assets/${assetId}`);
      setDetailAsset(res.data);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('asset', String(assetId));
        return next;
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load asset details.' });
    }
  };

  useEffect(() => {
    loadAssets(filters);
    loadAssetTypes();
  }, []);

  useEffect(() => {
    const assetId = searchParams.get('asset');
    if (assetId) openDetails(assetId);
  }, []);

  const closeDetails = () => {
    setDetailAsset(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('asset');
      return next;
    });
  };

  const columns = useMemo(() => [
    { key: 'rownum', label: '#', render: (row) => row.rownum },
    { key: 'asset_type.name', label: 'Asset Type', render: (row) => cellValue(row, 'asset_type.name') },
    { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-gray-900">{row.name}</span> },
    { key: 'serial_number', label: 'Serial #', render: (row) => cellValue(row, 'serial_number') },
    { key: 'label_number', label: 'Label #', render: (row) => cellValue(row, 'label_number') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'location_assigned', label: 'Location/Assigned', render: (row) => row.location_assigned || '—' },
    { key: 'user.department.name', label: 'Department', render: (row) => cellValue(row, 'user.department.name') },
    { key: 'created_at', label: 'Created', render: (row) => formatPhpDate(row.created_at) },
    { key: 'condition_notes', label: 'Condition Notes', render: (row) => cellValue(row, 'condition_notes') },
  ], []);

  const rows = assets.map((asset, index) => ({
    ...asset,
    rownum: index + 1,
    location_assigned: asset.location === 'office' ? 'Office' : (asset.user?.names || '—'),
  }));

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/assets', {
        ...createForm,
        initial_location: isManager ? createForm.initial_location : 'user',
      });
      setCreateForm(emptyCreateForm);
      await loadAssets();
      setMessage({ type: 'success', text: 'Asset recorded successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to record asset.' });
    } finally {
      setSaving(false);
    }
  };

  const submitAssetType = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/asset-types', typeForm);
      setTypeForm(emptyTypeForm);
      await loadAssetTypes();
      setMessage({ type: 'success', text: 'Asset type added successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add asset type.' });
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!selectedAsset) return;
    setSaving(true);
    try {
      await api.put(`/assets/${selectedAsset.id}`, editForm);
      setActiveModal(null);
      setSelectedAsset(null);
      setEditForm(null);
      await loadAssets();
      if (detailAsset?.id === selectedAsset.id) await openDetails(selectedAsset.id);
      setMessage({ type: 'success', text: 'Asset updated successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update asset.' });
    } finally {
      setSaving(false);
    }
  };

  const submitRequestEdit = async (event) => {
    event.preventDefault();
    if (!selectedAsset) return;
    setSaving(true);
    try {
      await api.post(`/assets/${selectedAsset.id}/request-edit`, requestForm);
      setActiveModal(null);
      setSelectedAsset(null);
      setRequestForm(emptyRequestForm);
      await loadAssets();
      setMessage({ type: 'success', text: 'Edit request submitted.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit request.' });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAsset) return;
    setSaving(true);
    try {
      await api.post(`/assets/${selectedAsset.id}/approve-edit`, {});
      setActiveModal(null);
      setSelectedAsset(null);
      await loadAssets();
      setMessage({ type: 'success', text: 'Edit request approved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to approve request.' });
    } finally {
      setSaving(false);
    }
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (!selectedAsset) return;
    setSaving(true);
    try {
      await api.post(`/assets/${selectedAsset.id}/reject-edit`, requestForm);
      setActiveModal(null);
      setSelectedAsset(null);
      setRequestForm(emptyRequestForm);
      await loadAssets();
      setMessage({ type: 'success', text: 'Edit request rejected.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reject request.' });
    } finally {
      setSaving(false);
    }
  };

  const submitReturn = async (event) => {
    event.preventDefault();
    if (!selectedAsset) return;
    setSaving(true);
    try {
      await api.post(`/assets/${selectedAsset.id}/return`, returnForm);
      setActiveModal(null);
      setSelectedAsset(null);
      setReturnForm(emptyReturnForm);
      await loadAssets();
      if (detailAsset?.id === selectedAsset.id) await openDetails(selectedAsset.id);
      setMessage({ type: 'success', text: 'Asset returned successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to return asset.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setSaving(true);
    try {
      await api.del(`/assets/${selectedAsset.id}`);
      setActiveModal(null);
      setSelectedAsset(null);
      if (detailAsset?.id === selectedAsset.id) closeDetails();
      await loadAssets();
      setMessage({ type: 'success', text: 'Asset deleted successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete asset.' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (asset) => {
    setSelectedAsset(asset);
    setEditForm({
      asset_type_id: asset.asset_type_id || '',
      name: asset.name || '',
      serial_number: asset.serial_number || '',
      label_number: asset.label_number || '',
      description: asset.description || '',
      condition_notes: asset.condition_notes || '',
    });
    setActiveModal('edit');
  };

  const renderActions = (asset) => (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => openDetails(asset.id)} className="rounded-md border border-blue-200 p-2 text-blue-600 hover:bg-blue-50" title="View Details">
        <Eye className="h-4 w-4" />
      </button>
      {isManager ? (
        <>
          <button type="button" onClick={() => startEdit(asset)} className="rounded-md border border-amber-200 p-2 text-amber-600 hover:bg-amber-50" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          {asset.revert_status === 'requested' && (
            <>
              <button type="button" onClick={() => { setSelectedAsset(asset); setActiveModal('approve'); }} className="rounded-md border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50" title="Approve Edit Request">
                <Check className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => { setSelectedAsset(asset); setRequestForm(emptyRequestForm); setActiveModal('reject'); }} className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title="Reject Edit Request">
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          {asset.status === 'issued' && (
            <button type="button" onClick={() => { setSelectedAsset(asset); setReturnForm(emptyReturnForm); setActiveModal('return'); }} className="rounded-md border border-cyan-200 p-2 text-cyan-600 hover:bg-cyan-50" title="Return Asset">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={() => { setSelectedAsset(asset); setActiveModal('delete'); }} className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : asset.status !== 'returned' ? (
        asset.revert_status === 'yes' ? (
          <button type="button" onClick={() => startEdit(asset)} className="rounded-md border border-amber-200 p-2 text-amber-600 hover:bg-amber-50" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
        ) : asset.revert_status === 'requested' ? (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Pending Approval</span>
        ) : (
          <button type="button" onClick={() => { setSelectedAsset(asset); setRequestForm(emptyRequestForm); setActiveModal('request'); }} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50" title="Request Edit">
            Request Edit
          </button>
        )
      ) : null}
    </div>
  );

  return (
    <div>
      <PageHeading
        title={isManager ? 'Assets Management' : 'My Assets'}
        subtitle={isManager ? 'Manage office and user assets with the same workflow as the PHP platform.' : 'View your recorded assets and request edit approval when needed.'}
        icon={<Package className="h-6 w-6" />}
        actions={[
          ...(isManager ? [{ label: 'Manage Asset Types', variant: 'secondary', icon: <Settings className="h-4 w-4" />, onClick: () => setShowTypeModal(true) }] : []),
        ]}
      />

      <div className="space-y-6 px-4 sm:px-6 lg:px-8 pb-8">
        {message && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="h-14 w-full bg-[linear-gradient(135deg,#1f4d2b_0%,#1f4d2b_12%,#f8fafc_12%,#f8fafc_18%,#1f4d2b_18%,#1f4d2b_30%,#f8fafc_30%,#f8fafc_36%,#1f4d2b_36%,#1f4d2b_48%,#f8fafc_48%,#f8fafc_54%,#1f4d2b_54%,#1f4d2b_66%,#f8fafc_66%,#f8fafc_72%,#1f4d2b_72%,#1f4d2b_84%,#f8fafc_84%,#f8fafc_90%,#1f4d2b_90%,#1f4d2b_100%)]" />
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-[#2f5d31]">{isManager ? 'All Assets (Office & Users)' : 'My Recorded Assets'}</h2>
          </div>
          <div className="p-5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-[#2f5d31]">Advanced Search</h3>
                <button type="button" onClick={() => setSearchOpen((v) => !v)} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                  {searchOpen ? 'Hide Options' : 'Toggle Options'}
                </button>
              </div>
              {searchOpen && (
                <div className="space-y-4 p-4">
                  <div>
                    <label className={labelClass}>Search By</label>
                    <div className="flex flex-wrap gap-2">
                      <SearchTypeButton active={filters.search_type === 'all'} label="All" onClick={() => setFilters((prev) => ({ ...prev, search_type: 'all' }))} />
                      <SearchTypeButton active={filters.search_type === 'user'} label="User Name" onClick={() => setFilters((prev) => ({ ...prev, search_type: 'user' }))} />
                      <SearchTypeButton active={filters.search_type === 'asset'} label="Asset Name" onClick={() => setFilters((prev) => ({ ...prev, search_type: 'asset' }))} />
                      <SearchTypeButton active={filters.search_type === 'serial'} label="Serial Number" onClick={() => setFilters((prev) => ({ ...prev, search_type: 'serial' }))} />
                      <SearchTypeButton active={filters.search_type === 'description'} label="Description" onClick={() => setFilters((prev) => ({ ...prev, search_type: 'description' }))} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="xl:col-span-2">
                      <label className={labelClass}>Search Term</label>
                      <input className={inputClass} value={filters.search} placeholder="Enter search term..." onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select className={inputClass} value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="issued">Issued</option>
                        <option value="returned">Returned</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Asset Type</label>
                      <select className={inputClass} value={filters.asset_type} onChange={(e) => setFilters((prev) => ({ ...prev, asset_type: e.target.value }))}>
                        <option value="">All Types</option>
                        {assetTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                      </select>
                    </div>
                    {isManager && (
                      <>
                        <div>
                          <label className={labelClass}>Department</label>
                          <input className={inputClass} value={filters.department} placeholder="Department name..." onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))} />
                        </div>
                        <div>
                          <label className={labelClass}>Location</label>
                          <select className={inputClass} value={filters.location} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}>
                            <option value="">All Locations</option>
                            <option value="office">Office</option>
                            <option value="user">User</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => loadAssets(filters)} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white hover:bg-[#005373]">
                      <Search className="h-4 w-4" />
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cleared = { search_type: 'all', search: '', status: '', asset_type: '', department: '', location: '' };
                        setFilters(cleared);
                        loadAssets(cleared);
                      }}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">Loading assets...</div>
              ) : (
                <DataTable
                  columns={columns}
                  rows={rows}
                  renderActions={renderActions}
                />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-[#2f5d31]">Record New Asset</h2>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>Asset Type</label>
                <select className={inputClass} value={createForm.asset_type_id} onChange={(e) => setCreateForm((prev) => ({ ...prev, asset_type_id: e.target.value }))} required>
                  <option value="">Select Type</option>
                  {assetTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Asset Name</label>
                <input className={inputClass} value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Serial Number</label>
                <input className={inputClass} value={createForm.serial_number} onChange={(e) => setCreateForm((prev) => ({ ...prev, serial_number: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Label Number</label>
                <input className={inputClass} value={createForm.label_number} onChange={(e) => setCreateForm((prev) => ({ ...prev, label_number: e.target.value }))} />
              </div>
              {isManager && (
                <div>
                  <label className={labelClass}>Initial Location</label>
                  <select className={inputClass} value={createForm.initial_location} onChange={(e) => setCreateForm((prev) => ({ ...prev, initial_location: e.target.value }))} required>
                    <option value="office">Office (Available)</option>
                    <option value="user">Personal (Issued)</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={inputClass}
                rows={6}
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter asset description..."
              />
            </div>
            <div>
              <label className={labelClass}>Condition Notes</label>
              <textarea className={inputClass} rows={3} value={createForm.condition_notes} onChange={(e) => setCreateForm((prev) => ({ ...prev, condition_notes: e.target.value }))} placeholder="Initial condition or notes..." />
            </div>
            <div className="flex justify-end">
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white hover:bg-[#005373] disabled:opacity-60">
                {saving ? 'Saving...' : (isManager ? 'Record Asset' : 'Record My Asset')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showTypeModal && (
        <Modal title="Manage Asset Types" onClose={() => setShowTypeModal(false)} width="max-w-4xl">
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h4 className="font-semibold text-[#2f5d31]">Add New Asset Type</h4>
              </div>
              <form onSubmit={submitAssetType} className="grid gap-4 p-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Type Name</label>
                  <input className={inputClass} value={typeForm.name} onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input className={inputClass} value={typeForm.description} onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white hover:bg-[#005373] disabled:opacity-60">
                    Add Asset Type
                  </button>
                </div>
              </form>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h4 className="font-semibold text-[#2f5d31]">Existing Asset Types</h4>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetTypes.length ? assetTypes.map((type) => (
                      <tr key={type.id} className="border-b border-gray-50">
                        <td className="px-3 py-2">{type.id}</td>
                        <td className="px-3 py-2">{type.name}</td>
                        <td className="px-3 py-2">{type.description || 'N/A'}</td>
                        <td className="px-3 py-2">{formatPhpDate(type.created_at)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No asset types found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {detailAsset && (
        <Modal title={`Asset Details: ${detailAsset.name}`} onClose={closeDetails} width="max-w-5xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Asset Type</p>
              <p className="mt-1 text-sm text-gray-800">{detailAsset.asset_type?.name || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
              <div className="mt-1"><StatusBadge value={detailAsset.status} /></div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned / Location</p>
              <p className="mt-1 text-sm text-gray-800">{detailAsset.location === 'office' ? 'Office' : (detailAsset.user?.names || '—')}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Department</p>
              <p className="mt-1 text-sm text-gray-800">{detailAsset.user?.department?.name || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Serial Number</p>
              <p className="mt-1 text-sm text-gray-800">{detailAsset.serial_number || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Label Number</p>
              <p className="mt-1 text-sm text-gray-800">{detailAsset.label_number || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-800">{formatPhpDateTime(detailAsset.created_at)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Returned Date</p>
              <p className="mt-1 text-sm text-gray-800">{detailAsset.returned_date ? formatPhpDate(detailAsset.returned_date) : 'N/A'}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Condition Notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-gray-800">{detailAsset.condition_notes || 'N/A'}</p>
          </div>
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
            <div className="prose prose-sm mt-2 max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: detailAsset.description || '<p>N/A</p>' }} />
          </div>
          <div className="mt-5">
            <h4 className="mb-3 text-base font-semibold text-[#2f5d31]">Asset Logs</h4>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Performed By</th>
                    <th className="px-3 py-2">Assigned To</th>
                    <th className="px-3 py-2">Comment</th>
                    <th className="px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailAsset.asset_logs_asset_id || []).length ? detailAsset.asset_logs_asset_id.map((log) => (
                    <tr key={log.id} className="border-t border-gray-100">
                      <td className="px-3 py-2"><StatusBadge value={log.action} /></td>
                      <td className="px-3 py-2">{log.performed_by_user?.names || '—'}</td>
                      <td className="px-3 py-2">{log.assigned_to_user?.names || '—'}</td>
                      <td className="px-3 py-2 whitespace-pre-wrap">{log.comment || '—'}</td>
                      <td className="px-3 py-2">{formatPhpDateTime(log.created_at)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-400">No asset logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'edit' && selectedAsset && editForm && (
        <Modal title={`Edit Asset: ${selectedAsset.name}`} onClose={() => { setActiveModal(null); setSelectedAsset(null); setEditForm(null); }} width="max-w-4xl">
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Asset Type</label>
                <select className={inputClass} value={editForm.asset_type_id} onChange={(e) => setEditForm((prev) => ({ ...prev, asset_type_id: e.target.value }))} required>
                  {assetTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>Serial Number</label>
                <input className={inputClass} value={editForm.serial_number} onChange={(e) => setEditForm((prev) => ({ ...prev, serial_number: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Label Number</label>
                <input className={inputClass} value={editForm.label_number} onChange={(e) => setEditForm((prev) => ({ ...prev, label_number: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={inputClass}
                rows={6}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter asset description..."
              />
            </div>
            <div>
              <label className={labelClass}>Condition Notes</label>
              <textarea className={inputClass} rows={3} value={editForm.condition_notes} onChange={(e) => setEditForm((prev) => ({ ...prev, condition_notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setActiveModal(null); setSelectedAsset(null); setEditForm(null); }} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white hover:bg-[#005373] disabled:opacity-60">Update</button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'request' && selectedAsset && (
        <Modal title={`Request Edit: ${selectedAsset.name}`} onClose={() => { setActiveModal(null); setSelectedAsset(null); setRequestForm(emptyRequestForm); }} width="max-w-xl">
          <form onSubmit={submitRequestEdit} className="space-y-4">
            <div>
              <label className={labelClass}>Reason for Edit</label>
              <textarea className={inputClass} rows={4} value={requestForm.reason} onChange={(e) => setRequestForm({ reason: e.target.value })} placeholder="Why do you need to edit this asset?" required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setActiveModal(null); setSelectedAsset(null); setRequestForm(emptyRequestForm); }} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white hover:bg-[#005373] disabled:opacity-60">Submit Request</button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'reject' && selectedAsset && (
        <Modal title={`Reject Edit Request: ${selectedAsset.name}`} onClose={() => { setActiveModal(null); setSelectedAsset(null); setRequestForm(emptyRequestForm); }} width="max-w-xl">
          <form onSubmit={submitReject} className="space-y-4">
            <div>
              <label className={labelClass}>Reason</label>
              <textarea className={inputClass} rows={4} value={requestForm.reason} onChange={(e) => setRequestForm({ reason: e.target.value })} placeholder="Reason for rejection (optional)" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setActiveModal(null); setSelectedAsset(null); setRequestForm(emptyRequestForm); }} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">Reject</button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'return' && selectedAsset && (
        <Modal title={`Return Asset: ${selectedAsset.name}`} onClose={() => { setActiveModal(null); setSelectedAsset(null); setReturnForm(emptyReturnForm); }} width="max-w-xl">
          <form onSubmit={submitReturn} className="space-y-4">
            <div>
              <label className={labelClass}>Return Notes</label>
              <textarea className={inputClass} rows={4} value={returnForm.comment} onChange={(e) => setReturnForm({ comment: e.target.value })} placeholder="Condition upon return..." required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setActiveModal(null); setSelectedAsset(null); setReturnForm(emptyReturnForm); }} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">Confirm Return</button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'approve' && selectedAsset && (
        <ConfirmationModal
          isOpen
          onClose={() => { setActiveModal(null); setSelectedAsset(null); }}
          onConfirm={handleApprove}
          title={`Approve Edit Request: ${selectedAsset.name}`}
          message="Approve this edit request? The user will be able to edit the asset."
          type="activate"
          loading={saving}
        />
      )}

      {activeModal === 'delete' && selectedAsset && (
        <ConfirmationModal
          isOpen
          onClose={() => { setActiveModal(null); setSelectedAsset(null); }}
          onConfirm={handleDelete}
          title={`Delete Asset: ${selectedAsset.name}`}
          message="Are you sure you want to delete this asset? This action cannot be undone."
          type="delete"
          loading={saving}
        />
      )}
    </div>
  );
}
