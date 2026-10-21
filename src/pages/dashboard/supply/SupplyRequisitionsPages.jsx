import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardList, Plus, Trash2, Eye } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, inputClass, labelClass } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { canAuthorizeSupply, canManageSupply, hasPrivilege } from '../../../utils/rwvcaAccess';

function emptyItem() {
  return { item_name: '', quantity: 1, description: '' };
}

function useDepartmentsAndUsers() {
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

export function CreateSupplyRequisitionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplyType, setSupplyType] = useState('kitchen');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const submit = async (submitFlag) => {
    setError('');
    const cleaned = items
      .map((item) => ({
        item_name: String(item.item_name || '').trim(),
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        description: String(item.description || '').trim() || null,
      }))
      .filter((item) => item.item_name);
    if (!cleaned.length) {
      setError('Add at least one item with a name.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/supply-requisitions', {
        supply_type: supplyType,
        notes: notes.trim() || null,
        items: cleaned,
        submit: submitFlag,
      });
      navigate('/dashboard/supply-requisitions');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save supply requisition');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPrivilege(user, 'menu.create.supply_requisition') && !hasPrivilege(user, 'menu.supply_requisitions')) {
    return (
      <div>
        <PageHeading icon={<ClipboardList className="h-6 w-6" />} title="Create Supply Requisition" subtitle="Access denied" showBack backTo="/dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<ClipboardList className="h-6 w-6" />}
        title="Create Supply Requisition"
        subtitle="Kitchen or hygienic supplies for logistics review"
        showBack
        backTo="/dashboard/supply-requisitions"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-5">
        <div>
          <p className={labelClass}>Supply type</p>
          <div className="flex flex-wrap gap-2">
            {['kitchen', 'hygienic'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSupplyType(type)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  supplyType === type
                    ? 'bg-[#2f5d31] text-white'
                    : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-[#2f5d31]/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            className={`${inputClass} min-h-20`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional overall note"
          />
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 w-14">No</th>
                <th className="px-3 py-2">Item name</th>
                <th className="px-3 py-2 w-28">Quantity</th>
                <th className="px-3 py-2">Note / description</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      className={inputClass}
                      value={item.item_name}
                      onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      placeholder="Item name"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      className={inputClass}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={inputClass}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Note or description"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                      disabled={items.length <= 1}
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => submit(false)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => submit(true)}
            className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Sending…' : 'Send to logistic'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupplyRequisitionsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const manage = canManageSupply(user);
  const authorize = canAuthorizeSupply(user);
  const tabs = useMemo(() => {
    const list = [{ value: 'my', label: 'My' }];
    if (manage) list.push({ value: 'logistic', label: 'Logistic' });
    if (manage || authorize) list.push({ value: 'all', label: 'All' });
    return list;
  }, [manage, authorize]);

  const [tab, setTab] = useState(tabs[0]?.value || 'my');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tabCounts, setTabCounts] = useState({});

  useEffect(() => {
    if (!tabs.some((t) => t.value === tab)) setTab(tabs[0]?.value || 'my');
  }, [tabs, tab]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/supply-requisitions', { tab, search: search || undefined, limit: 200 });
      setItems(res.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load supply requisitions');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    const entries = await Promise.all(tabs.map(async (t) => {
      try {
        const res = await api.get('/supply-requisitions', { tab: t.value, limit: 1 });
        return [t.value, res.data?.pagination?.total ?? (res.data?.items || []).length];
      } catch {
        return [t.value, 0];
      }
    }));
    setTabCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    load().catch(() => {});
    loadCounts().catch(() => {});
  }, [tab]);

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<ClipboardList className="h-6 w-6" />}
        title="Supply Requisitions"
        subtitle="Kitchen and hygienic supply requests"
        actions={[
          {
            label: 'Create',
            onClick: () => navigate('/dashboard/create/supply-requisitions'),
            icon: <Plus className="h-4 w-4" />,
          },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.value ? 'bg-[#2f5d31] text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'
            }`}
          >
            {t.label}
            {tabCounts[t.value] != null && (
              <span className="ml-1 opacity-80">({tabCounts[t.value]})</span>
            )}
          </button>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          className={`max-w-sm ${inputClass}`}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <DataTable
        loading={loading}
        empty="No supply requisitions"
        columns={[
          { key: 'id', label: 'ID', value: (row) => `#${row.id}` },
          { key: 'supply_type', label: 'Type', value: (row) => (
            <span className="capitalize">{row.supply_type}</span>
          ) },
          { key: 'status', label: 'Status', value: (row) => <StatusBadge value={row.status} /> },
          { key: 'preparer', label: 'Prepared by', value: (row) => row.preparer?.names || '—' },
          { key: 'items', label: 'Items', value: (row) => (row.items || []).length },
          { key: 'created_at', label: 'Created', value: (row) => String(row.created_at || '').slice(0, 10) },
        ]}
        rows={items}
        renderActions={(row) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31]"
            onClick={() => navigate(`/dashboard/supply-requisitions/${row.id}`)}
          >
            <Eye className="h-4 w-4" /> Open
          </button>
        )}
      />
    </div>
  );
}

export function SupplyRequisitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments, users } = useDepartmentsAndUsers();
  const manage = canManageSupply(user);
  const authorize = canAuthorizeSupply(user);
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignDept, setAssignDept] = useState('');
  const [assignUser, setAssignUser] = useState('');
  const [comment, setComment] = useState('');

  const load = async () => {
    const res = await api.get(`/supply-requisitions/${id}`);
    const data = res.data;
    setRow(data);
    setAssignDept(data.assigned_department_id ? String(data.assigned_department_id) : '');
    setAssignUser(data.assigned_to ? String(data.assigned_to) : '');
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  const act = async (path, body = {}) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/supply-requisitions/${id}/${path}`, body);
      setComment('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  if (!row && !error) {
    return (
      <div>
        <PageHeading icon={<ClipboardList className="h-6 w-6" />} title="Supply Requisition" subtitle="Loading…" showBack backTo="/dashboard/supply-requisitions" />
      </div>
    );
  }

  if (!row) {
    return (
      <div>
        <PageHeading icon={<ClipboardList className="h-6 w-6" />} title="Supply Requisition" subtitle={error || 'Not found'} showBack backTo="/dashboard/supply-requisitions" />
      </div>
    );
  }

  const status = String(row.status || '');
  const isOwner = Number(row.prepared_by) === Number(user?.id);
  const canSubmit = isOwner && ['draft', 'reverted'].includes(status);
  const canAssign = manage && ['pending', 'assigned'].includes(status);
  const canApprove = manage && status === 'assigned';
  const canReject = manage && ['pending', 'assigned'].includes(status);
  const canRevert = manage && ['pending', 'assigned'].includes(status);
  const canAuth = authorize && status === 'approved';

  const filteredUsers = assignDept
    ? users.filter((u) => String(u.department_ID || u.department_id || '') === String(assignDept))
    : users;

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<ClipboardList className="h-6 w-6" />}
        title={`Supply Requisition #${row.id}`}
        subtitle={`${String(row.supply_type || '').replace(/^\w/, (c) => c.toUpperCase())} · ${status}`}
        showBack
        backTo="/dashboard/supply-requisitions"
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={row.status} />
              <span className="text-sm capitalize text-gray-600">{row.supply_type}</span>
            </div>
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><dt className="text-gray-500">Prepared by</dt><dd className="font-medium">{row.preparer?.names || '—'}</dd></div>
              <div><dt className="text-gray-500">Requester dept</dt><dd className="font-medium">{row.requesterDepartment?.name || '—'}</dd></div>
              <div><dt className="text-gray-500">Assigned dept</dt><dd className="font-medium">{row.assignedDepartment?.name || '—'}</dd></div>
              <div><dt className="text-gray-500">Assigned to</dt><dd className="font-medium">{row.assignee?.names || '—'}</dd></div>
              <div><dt className="text-gray-500">Approved by</dt><dd className="font-medium">{row.approver?.names || '—'}</dd></div>
              <div><dt className="text-gray-500">Authorized by</dt><dd className="font-medium">{row.authorizer?.names || '—'}</dd></div>
            </dl>
            {row.notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Notes</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{row.notes}</p>
              </div>
            )}
            {row.reject_reason && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {row.reject_reason}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3">No</th>
                    <th className="py-2 pr-3">Item name</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(row.items || []).map((item) => (
                    <tr key={item.id || item.item_no}>
                      <td className="py-2 pr-3">{item.item_no}</td>
                      <td className="py-2 pr-3 font-medium">{item.item_name}</td>
                      <td className="py-2 pr-3">{item.quantity}</td>
                      <td className="py-2 text-gray-600">{item.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(row.logs || []).length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Activity</h3>
              <ul className="space-y-2 text-sm">
                {(row.logs || []).map((log) => (
                  <li key={log.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-50 pb-2">
                    <span>
                      <span className="font-medium capitalize">{String(log.action || '').replace(/_/g, ' ')}</span>
                      {log.comment ? ` — ${log.comment}` : ''}
                      <span className="text-gray-400"> · {log.actor?.names || 'System'}</span>
                    </span>
                    <span className="text-xs text-gray-400">{String(log.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {canSubmit && (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-2">
              <p className="text-sm font-semibold text-gray-800">Submit</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => act('submit')}
                className="w-full rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Send to logistic
              </button>
              {status === 'reverted' && (
                <Link to="/dashboard/create/supply-requisitions" className="block text-center text-sm text-[#2f5d31]">
                  Create a new request instead
                </Link>
              )}
            </div>
          )}

          {(canAssign || canApprove || canReject || canRevert || canAuth) && (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Actions</p>
              <label className="block text-sm text-gray-600">
                Comment / reason
                <textarea
                  className={`mt-1 ${inputClass} min-h-16`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>

              {canAssign && (
                <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assign</p>
                  <select className={inputClass} value={assignDept} onChange={(e) => setAssignDept(e.target.value)}>
                    <option value="">Department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <select className={inputClass} value={assignUser} onChange={(e) => setAssignUser(e.target.value)}>
                    <option value="">User…</option>
                    {filteredUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.names}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={saving || (!assignDept && !assignUser)}
                    onClick={() => act('assign', {
                      assigned_department_id: assignDept || null,
                      assigned_to: assignUser || null,
                      comment: comment || undefined,
                    })}
                    className="w-full rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {canApprove && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => act('approve', { comment })}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {canReject && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => act('reject', { reason: comment || 'Rejected', comment })}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
                {canRevert && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => act('revert', { reason: comment || 'Reverted for corrections', comment })}
                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Revert
                  </button>
                )}
                {canAuth && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => act('authorize', { comment })}
                    className="rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Authorize (ED)
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard/supply-requisitions')}
            className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700"
          >
            Back to list
          </button>
        </div>
      </div>
    </div>
  );
}

export default {
  CreateSupplyRequisitionPage,
  SupplyRequisitionsListPage,
  SupplyRequisitionDetailPage,
};
