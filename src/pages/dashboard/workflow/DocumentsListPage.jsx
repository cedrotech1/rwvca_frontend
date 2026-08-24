import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Eye, FolderOpen, Plus, Trash2, Users } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { downloadProtectedFile } from '../../../services/api/config';
import { useAuth } from '../../../contexts/AuthContext';
import { canSeeAllDocumentsTab } from '../../../utils/rwvcaAccess';
import { formatPhpDate, formatPhpDateTime } from './helpers';

export default function DocumentsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isEd = canSeeAllDocumentsTab(user?.role);
  const tab = searchParams.get('tab') || 'mine';
  const [items, setItems] = useState([]);
  const [tabCounts, setTabCounts] = useState({});
  const [error, setError] = useState('');
  const [sharedModal, setSharedModal] = useState(null);

  const tabs = useMemo(() => {
    const list = [
      { value: 'mine', label: 'My Documents' },
      { value: 'shared', label: 'Shared with Me' },
    ];
    if (isEd) list.push({ value: 'all', label: 'All Documents' });
    return list;
  }, [isEd]);

  const load = async () => {
    try {
      const res = await api.get('/documents', { tab, limit: 500 });
      setItems(res.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load documents');
    }
  };

  const loadCounts = async () => {
    const entries = await Promise.all(tabs.map(async (item) => {
      try {
        const res = await api.get('/documents', { tab: item.value, limit: 1 });
        return [item.value, res.data?.pagination?.total ?? 0];
      } catch {
        return [item.value, 0];
      }
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    load().catch(() => {});
    loadCounts().catch(() => {});
  }, [tab, isEd]);

  const setTab = (value) => setSearchParams({ tab: value });

  const downloadRow = async (row) => {
    if (!row.can_download) return;
    if (row.status !== 'open' && !window.confirm('This document is closed. Are you sure you want to download it?')) return;
    try {
      await downloadProtectedFile(`/documents/${row.id}/file`, row.title || 'document');
    } catch (err) {
      setError(err.message || 'Could not download document');
    }
  };

  const deleteRow = async (row) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      await api.del(`/documents/${row.id}`);
      await load();
      await loadCounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete document');
    }
  };

  const toggleStatus = async (row) => {
    try {
      await api.post(`/documents/${row.id}/status`, { new_status: row.status === 'open' ? 'closed' : 'open' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status');
    }
  };

  const columns = useMemo(() => {
    if (tab === 'shared') {
      return [
        { key: 'title', label: 'Title', render: (row) => (
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-gray-500">{formatPhpDate(row.shared_date || row.created_at)}</p>
          </div>
        ) },
        { key: 'type', label: 'Type' },
        { key: 'file_type', label: 'File Type', render: (row) => row.file_type ? String(row.file_type).charAt(0).toUpperCase() + String(row.file_type).slice(1) : '—' },
        { key: 'status', label: 'Status', render: (row) => (
          isEd
            ? <button type="button" className="text-sm font-medium capitalize text-[#2f5d31]" onClick={() => toggleStatus(row)}>{row.status}</button>
            : <StatusBadge value={row.status} />
        ) },
        { key: 'shared_by_name', label: 'Shared By', render: (row) => row.shared_by_name || '—' },
        { key: 'department_name', label: 'Department', render: (row) => row.department_name || 'N/A' },
        { key: 'shared_date', label: 'Shared On', render: (row) => formatPhpDateTime(row.shared_date) },
      ];
    }
    return [
      { key: 'title', label: 'Title', render: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-gray-500">{formatPhpDate(row.created_at)}</p>
        </div>
      ) },
      { key: 'type', label: 'Type' },
      { key: 'file_type', label: 'File Type', render: (row) => row.file_type ? String(row.file_type).charAt(0).toUpperCase() + String(row.file_type).slice(1) : '—' },
      { key: 'status', label: 'Status', render: (row) => (
        isEd
          ? <button type="button" className="text-sm font-medium text-[#2f5d31]" onClick={() => toggleStatus(row)}>{row.status}</button>
          : <StatusBadge value={row.status} />
      ) },
      { key: 'department_name', label: 'Department', render: (row) => row.department_name || 'N/A' },
      { key: 'share_count', label: 'Shared', render: (row) => (
        Number(row.share_count) > 0
          ? (
            <button type="button" className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700" onClick={() => setSharedModal(row)}>
              <Users size={12} /> {row.share_count} user{Number(row.share_count) === 1 ? '' : 's'}
            </button>
          )
          : <span className="text-xs text-gray-400">0 users</span>
      ) },
      { key: 'created_at', label: 'Created At', render: (row) => formatPhpDate(row.created_at) },
    ];
  }, [tab, isEd]);

  return (
    <div>
      <PageHeading
        icon={<FolderOpen className="h-6 w-6" />}
        title="My Documents"
        subtitle="Browse and manage shared documents"
        actions={[{ label: 'Upload New Document', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/dashboard/create/documents') }]}
      />
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === item.value ? 'bg-[#2f5d31] text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${tab === item.value ? 'bg-white/20' : 'bg-white text-gray-600'}`}>
                {tabCounts[item.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <DataTable
          columns={columns}
          rows={items}
          empty="No documents found"
          renderActions={(row) => (
            <>
              <button type="button" className="mr-2 inline-flex items-center gap-1 font-medium text-[#2f5d31]" onClick={() => navigate(`/dashboard/documents/${row.id}`)}>
                <Eye size={14} /> View
              </button>
              {row.can_download ? (
                <button type="button" className="mr-2 inline-flex items-center gap-1 text-gray-600" onClick={() => downloadRow(row)}>
                  <Download size={14} />
                </button>
              ) : (
                <span className="mr-2 inline-flex text-gray-300"><Download size={14} /></span>
              )}
              {tab === 'mine' && row.can_delete && (
                <button type="button" className="inline-flex items-center text-rose-600" onClick={() => deleteRow(row)}>
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        />
      </div>

      {sharedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Shared users — {sharedModal.title}</h3>
              <button type="button" className="text-sm text-gray-500" onClick={() => setSharedModal(null)}>Close</button>
            </div>
            <div className="space-y-2">
              {(sharedModal.shared_users || []).map((share, index) => (
                <div key={`${share.name}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <p className="font-medium text-gray-900">{share.name}</p>
                  <p className="text-xs text-gray-500">{share.department || 'No Department'} · {share.share_type} · {formatPhpDateTime(share.shared_date)}</p>
                </div>
              ))}
              {!sharedModal.shared_users?.length && <p className="text-sm text-gray-500">No users have access</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
