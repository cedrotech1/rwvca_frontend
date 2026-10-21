import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import RichHtml from '../../../components/RichHtml';
import { StatusBadge, inputClass } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { canAuthorizeSupply, canManageSupply } from '../../../utils/rwvcaAccess';

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

/** Legacy — kitchen/hygienic create is on Create → Requisition (type chooser). */
export function CreateSupplyRequisitionPage() {
  return <Navigate to="/dashboard/create/requisitions?type=kitchen" replace />;
}

/** Legacy — kitchen/hygienic list is under View → Requisitions type tabs. */
export function SupplyRequisitionsListPage() {
  return <Navigate to="/dashboard/requisitions?type=kitchen" replace />;
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

  const backTo = row?.supply_type
    ? `/dashboard/requisitions?type=${row.supply_type}`
    : '/dashboard/requisitions';

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
        <PageHeading icon={<ClipboardList className="h-6 w-6" />} title="Requisition" subtitle="Loading…" showBack backTo="/dashboard/requisitions" />
      </div>
    );
  }

  if (!row) {
    return (
      <div>
        <PageHeading icon={<ClipboardList className="h-6 w-6" />} title="Requisition" subtitle={error || 'Not found'} showBack backTo="/dashboard/requisitions" />
      </div>
    );
  }

  const status = String(row.status || '');
  const isOwner = Number(row.prepared_by) === Number(user?.id);
  const canSubmit = isOwner && ['draft', 'reverted'].includes(status);
  const canEdit = isOwner && ['draft', 'reverted'].includes(status);
  const canAssign = manage && ['pending', 'assigned'].includes(status);
  const canApprove = manage && status === 'assigned';
  const canReject = manage && ['pending', 'assigned'].includes(status);
  const canRevert = manage && ['pending', 'assigned'].includes(status);
  const canAuth = authorize && status === 'approved';

  const filteredUsers = assignDept
    ? users.filter((u) => String(u.department_ID || u.department_id || '') === String(assignDept))
    : users;

  const typeLabel = String(row.supply_type || '').replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<ClipboardList className="h-6 w-6" />}
        title={`Requisition #${row.id}`}
        subtitle={`${typeLabel} · ${status}`}
        showBack
        backTo={backTo}
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
                <RichHtml html={row.notes} />
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
          {(canSubmit || canEdit) && (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-2">
              <p className="text-sm font-semibold text-gray-800">Owner actions</p>
              {canEdit && (
                <Link
                  to={`/dashboard/create/requisitions?type=${row.supply_type || 'kitchen'}&supplyId=${row.id}`}
                  className="block w-full rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-800"
                >
                  Edit draft / revise
                </Link>
              )}
              {canSubmit && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => act('submit')}
                  className="w-full rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send to logistic
                </button>
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
            onClick={() => navigate(backTo)}
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
