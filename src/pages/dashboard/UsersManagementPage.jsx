import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Building2, Plus, Shield, Trash2, RotateCcw, Pencil, CalendarDays, Users, UserCheck, UserX, KeyRound } from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass, labelClass } from '../../components/ui/dataUi';
import api from '../../services/api';
import { fileUrl } from '../../services/api/config';
import { useAuth } from '../../contexts/AuthContext';
import { canManageUsers, canReviewLists } from '../../utils/rwvcaAccess';

const emptyUser = { names: '', email: '', phone: '', gender: '', role: '', department_ID: '' };

function isAdminActor(role) {
  return ['admin', 'ed', 'chairman'].includes(String(role || '').trim().toLowerCase());
}

function signatureStatus(row) {
  if (!row.signature_url) return 'No signature';
  if (String(row.signature_approved) === '1') return 'Approved';
  return 'Pending';
}

function accountStatus(row) {
  if (Number(row.force_deactivated) === 1) return 'Deactivated';
  if (Number(row.active) === 1) return 'Active';
  return 'Pending profile';
}

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const manager = canManageUsers(user?.role);
  const adminActor = isAdminActor(user?.role);
  const canAnalyze = canReviewLists(user?.role);
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [leave, setLeave] = useState({ year: new Date().getFullYear(), allowed_days: 0, items: [] });
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [roleForm, setRoleForm] = useState({ role_name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailPassword, setEmailPassword] = useState(false);

  const roleOptions = (() => {
    const list = Array.isArray(roles) ? [...roles] : [];
    const names = new Set(list.map((item) => String(item.role_name || '').trim().toLowerCase()));
    if (adminActor && !names.has('admin')) {
      list.unshift({ id: 'admin-builtin', role_name: 'admin' });
    }
    if (!adminActor) {
      return list.filter((item) => String(item.role_name || '').trim().toLowerCase() !== 'admin');
    }
    return list;
  })();

  const load = async () => {
    try {
      const res = await api.get('/users', { search, show_deleted: showDeleted ? 1 : 0, limit: 200 });
      setItems(res.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users');
    }
  };

  const loadMeta = async () => {
      const deptRes = await api.get('/departments');
      const roleRes = await api.get('/roles');
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.items || []);
      setRoles(Array.isArray(roleRes.data) ? roleRes.data : roleRes.data?.items || []);
  };

  useEffect(() => {
    load().catch(() => {});
    loadMeta().catch(() => {});
  }, [showDeleted]);

  const openEdit = (row) => {
    setTempPassword('');
    setInfo('');
    setNewPassword('');
    setConfirmPassword('');
    setEmailPassword(false);
    setForm({
      id: row.id,
      names: row.names || '',
      email: row.email || '',
      phone: row.phone || '',
      gender: row.gender || '',
      role: row.role || '',
      department_ID: row.department_ID || '',
    });
    setModal('user');
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setInfo('');
    try {
      if (form.id) await api.put(`/users/${form.id}`, form);
      else await api.post('/users', form);
      setModal(null);
      setForm(emptyUser);
      setTempPassword('');
      await load();
      setInfo(form.id ? 'User updated.' : 'User created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save user');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!form.id) return;
    const password = String(newPassword || '').trim();
    if (password.length < 6) {
      setError('Enter a new password with at least 6 characters');
      return;
    }
    if (password !== String(confirmPassword || '').trim()) {
      setError('New password and confirmation do not match');
      return;
    }
    if (!window.confirm(`Set a new password for ${form.names || form.email}? You will give this password to the user.`)) return;
    setResetting(true);
    setError('');
    setInfo('');
    setTempPassword('');
    try {
      const res = await api.post(`/users/${form.id}/reset-password`, {
        password,
        notify_email: emailPassword ? 1 : 0,
      });
      const saved = res.data?.password || password;
      setTempPassword(saved);
      setNewPassword('');
      setConfirmPassword('');
      setInfo(res.message || 'New password saved. Share it with the user.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set password');
    } finally {
      setResetting(false);
    }
  };

  const grantAdmin = () => {
    if (!adminActor) return;
    setForm((prev) => ({ ...prev, role: 'admin' }));
    setInfo('Role set to admin. Click Save to apply Admin access.');
  };

  const removeUser = async (row) => {
    if (!window.confirm(`Deactivate ${row.names}? They will be moved to Deleted Users.`)) return;
    await api.del(`/users/${row.id}`);
    await load();
  };

  const restore = async (row) => {
    await api.post(`/users/${row.id}/restore`);
    await load();
  };

  const setActive = async (row, active) => {
    const action = active ? 'activate' : 'deactivate';
    const confirmMsg = active
      ? `Activate ${row.names}? They will be able to use the system.`
      : `Deactivate ${row.names}? They will not be able to log in until you activate them again (even if their profile is complete).`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.put(`/users/${row.id}/${action}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${action} user`);
    }
  };

  const signature = async (row, approved) => {
    const notes = window.prompt(approved ? 'Optional approval notes' : 'Rejection notes (optional)') || '';
    await api.put(`/users/${row.id}/signature/${approved ? 'approve' : 'reject'}`, { notes });
    await load();
  };

  const openLeave = async (row) => {
    const res = await api.get(`/users/${row.id}/leave-days`);
    setLeave({
      user: row,
      year: new Date().getFullYear(),
      allowed_days: row.allowed_leave_days || 0,
      items: Array.isArray(res.data) ? res.data : res.data?.items || [],
    });
    setModal('leave');
  };

  const saveLeave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/users/${leave.user.id}/leave-days`, { year: leave.year, allowed_days: leave.allowed_days });
      const res = await api.get(`/users/${leave.user.id}/leave-days`);
      setLeave((prev) => ({ ...prev, items: res.data || [] }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save leave days');
    } finally {
      setSaving(false);
    }
  };

  const saveDept = async (event) => {
    event.preventDefault();
    await api.post('/departments', deptForm);
    setDeptForm({ name: '' });
    await loadMeta();
  };

  const saveRole = async (event) => {
    event.preventDefault();
    await api.post('/roles', roleForm);
    setRoleForm({ role_name: '', description: '' });
    await loadMeta();
  };

  const columns = [
    { key: 'id', label: '#', render: (row, idx) => idx + 1 },
    {
      key: 'image',
      label: 'Photo',
      render: (row) => row.image
        ? <img src={fileUrl(row.image, { auth: true })} alt="" className="h-10 w-10 rounded-full object-cover" />
        : <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2f5d31]/10 text-[#2f5d31] text-xs font-semibold">{String(row.names || '?')[0]}</span>,
    },
    { key: 'names', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'gender', label: 'Gender' },
    { key: 'active', label: 'Status', render: (row) => <StatusBadge value={accountStatus(row)} /> },
    { key: 'role', label: 'Role', render: (row) => <StatusBadge value={row.role} /> },
    { key: 'department', label: 'Department', render: (row) => row.department?.name || '—' },
    {
      key: 'signature_url',
      label: 'Signature',
      render: (row) => row.signature_url
        ? <img src={fileUrl(row.signature_url, { auth: true })} alt="" className="h-8 w-16 object-contain bg-white rounded" />
        : '—',
    },
    { key: 'signature_approved', label: 'Signature Status', render: (row) => <StatusBadge value={signatureStatus(row)} /> },
  ];

  return (
    <div>
      <PageHeading
        title="User Management"
        subtitle="Manage user accounts, roles, and permissions"
        icon={<Users className="h-6 w-6" />}
        actions={[
          ...(canAnalyze ? [{ label: 'Employee analysis', variant: 'secondary', icon: <BarChart3 className="h-4 w-4" />, onClick: () => navigate('/dashboard/employee-analysis') }] : []),
          { label: 'Export', variant: 'secondary', onClick: () => exportCsv('users', [{ key: 'id', label: 'ID' }, { key: 'names', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'role', label: 'Role' }], items) },
          ...(manager ? [{ label: 'Add New User', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => { setForm(emptyUser); setModal('user'); } }] : []),
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {manager && (
            <>
              <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm" onClick={() => setModal('departments')}>
                <Building2 size={14} /> Manage Departments
              </button>
              <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm" onClick={() => setModal('roles')}>
                <Shield size={14} /> Manage Roles
              </button>
            </>
          )}
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${!showDeleted ? 'bg-[#2f5d31] text-white' : 'bg-gray-100'}`}
            onClick={() => setShowDeleted(false)}
          >
            Active Users
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${showDeleted ? 'bg-[#2f5d31] text-white' : 'bg-gray-100'}`}
            onClick={() => setShowDeleted(true)}
          >
            Deleted Users
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search name, email, phone..."
            className={`ml-auto max-w-xs ${inputClass}`}
          />
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {info && !modal && <p className="text-sm text-emerald-700 mb-3">{info}</p>}
        <DataTable
          columns={columns}
          rows={items}
          renderActions={(manager || canAnalyze) ? (row) => (
            showDeleted ? (
              manager ? (
                <button type="button" className="inline-flex items-center gap-1 text-emerald-700 font-medium" onClick={() => restore(row)}>
                  <RotateCcw size={14} /> Restore
                </button>
              ) : null
            ) : (
              <div className="flex justify-end gap-2">
                {canAnalyze && (
                  <button type="button" className="text-[#2f5d31]" onClick={() => navigate(`/dashboard/employee-analysis/${row.id}`)} title="Employee analysis"><BarChart3 size={14} /></button>
                )}
                {manager && row.signature_url && (
                  <>
                    <button type="button" className="text-emerald-700 text-xs font-medium" onClick={() => signature(row, true)}>Approve</button>
                    <button type="button" className="text-rose-600 text-xs font-medium" onClick={() => signature(row, false)}>Reject</button>
                  </>
                )}
                {manager && Number(row.force_deactivated) === 1 && (
                  <button type="button" className="text-emerald-700" onClick={() => setActive(row, true)} title="Activate account">
                    <UserCheck size={14} />
                  </button>
                )}
                {manager && Number(row.active) === 1 && Number(row.force_deactivated) !== 1 && (
                  <button type="button" className="text-amber-700" onClick={() => setActive(row, false)} title="Deactivate account">
                    <UserX size={14} />
                  </button>
                )}
                {manager && Number(row.active) !== 1 && Number(row.force_deactivated) !== 1 && (
                  <>
                    <button type="button" className="text-emerald-700" onClick={() => setActive(row, true)} title="Activate account">
                      <UserCheck size={14} />
                    </button>
                    <button type="button" className="text-amber-700" onClick={() => setActive(row, false)} title="Lock account (block login)">
                      <UserX size={14} />
                    </button>
                  </>
                )}
                {manager && <button type="button" className="text-[#2f5d31]" onClick={() => openLeave(row)} title="Leave days"><CalendarDays size={14} /></button>}
                {manager && <button type="button" className="text-[#2f5d31]" onClick={() => openEdit(row)}><Pencil size={14} /></button>}
                {manager && <button type="button" className="text-rose-600" onClick={() => removeUser(row)}><Trash2 size={14} /></button>}
              </div>
            )
          ) : undefined}
        />
      </div>

      {modal === 'user' && (
        <Modal title={form.id ? 'Edit User' : 'Add New User'} onClose={() => { setModal(null); setTempPassword(''); }}>
          <form onSubmit={saveUser} className="space-y-3">
            <Field label="Full Name *"><input required className={inputClass} value={form.names} onChange={(e) => setForm({ ...form, names: e.target.value })} /></Field>
            <Field label="Email *"><input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Gender">
              <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Role *">
              <select required className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="">Select role</option>
                {roleOptions.map((item) => <option key={item.id} value={item.role_name}>{item.role_name}</option>)}
              </select>
            </Field>
            {adminActor && form.id && String(form.role || '').toLowerCase() !== 'admin' && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-[#2f5d31]/30 bg-[#2f5d31]/5 px-3 py-2 text-sm font-medium text-[#2f5d31]"
                onClick={grantAdmin}
              >
                <Shield size={14} /> Give Admin access
              </button>
            )}
            <Field label="Department *">
              <select required className={inputClass} value={form.department_ID} onChange={(e) => setForm({ ...form, department_ID: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            {!form.id && (
              <p className="text-xs text-gray-500">
                A temporary password will be emailed. The account stays inactive until the user logs in and completes their profile (or you activate them).
              </p>
            )}
            {form.id && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
                <p className="text-sm font-medium text-gray-800">Set new password</p>
                <p className="text-xs text-gray-500">Type the password you want to give this user, then save it.</p>
                <Field label="New password *">
                  <input
                    type="text"
                    autoComplete="new-password"
                    className={inputClass}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </Field>
                <Field label="Confirm password *">
                  <input
                    type="text"
                    autoComplete="new-password"
                    className={inputClass}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={emailPassword} onChange={(e) => setEmailPassword(e.target.checked)} />
                  Also email this password to the user
                </label>
                <button
                  type="button"
                  disabled={resetting || !newPassword || !confirmPassword}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#2f5d31] px-3 py-2 text-sm text-white disabled:opacity-50"
                  onClick={resetPassword}
                >
                  <KeyRound size={14} /> {resetting ? 'Saving password...' : 'Save new password'}
                </button>
                {tempPassword && (
                  <div className="rounded-md bg-white border border-emerald-200 px-3 py-2 text-sm">
                    <span className="text-gray-600">Saved password: </span>
                    <code className="font-semibold text-emerald-800 select-all">{tempPassword}</code>
                    <button
                      type="button"
                      className="ml-2 text-xs text-[#2f5d31] underline"
                      onClick={() => navigator.clipboard?.writeText(tempPassword)}
                    >
                      Copy
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Give this password to the user so they can sign in.</p>
                  </div>
                )}
              </div>
            )}
            {error && modal === 'user' && <p className="text-sm text-red-600">{error}</p>}
            {info && modal === 'user' && <p className="text-sm text-emerald-700">{info}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-lg bg-gray-100 px-4 py-2" onClick={() => { setModal(null); setTempPassword(''); }}>Cancel</button>
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] text-white px-4 py-2">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'departments' && (
        <Modal title="Manage Departments" onClose={() => setModal(null)}>
          <form onSubmit={saveDept} className="flex gap-2 mb-4">
            <input required className={inputClass} placeholder="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} />
            <button className="rounded-lg bg-[#2f5d31] text-white px-4 py-2">Add</button>
          </form>
          <ul className="divide-y divide-gray-100 text-sm">
            {departments.map((item) => (
              <li key={item.id} className="py-2 flex justify-between">
                <span>{item.name}</span>
                <button type="button" className="text-rose-600" onClick={async () => { await api.del(`/departments/${item.id}`); await loadMeta(); }}>Delete</button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {modal === 'roles' && (
        <Modal title="Manage Roles" onClose={() => setModal(null)}>
          <form onSubmit={saveRole} className="space-y-2 mb-4">
            <input required className={inputClass} placeholder="Role name" value={roleForm.role_name} onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })} />
            <input className={inputClass} placeholder="Description" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
            <button className="rounded-lg bg-[#2f5d31] text-white px-4 py-2">Add role</button>
          </form>
          <ul className="divide-y divide-gray-100 text-sm">
            {roles.map((item) => (
              <li key={item.id} className="py-2 flex justify-between">
                <span>{item.role_name}</span>
                <button type="button" className="text-rose-600" onClick={async () => { await api.del(`/roles/${item.id}`); await loadMeta(); }}>Delete</button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {modal === 'leave' && leave.user && (
        <Modal title={`Leave days · ${leave.user.names}`} onClose={() => setModal(null)}>
          <form onSubmit={saveLeave} className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Year"><input type="number" className={inputClass} value={leave.year} onChange={(e) => setLeave({ ...leave, year: e.target.value })} /></Field>
            <Field label="Allowed days"><input type="number" min="0" className={inputClass} value={leave.allowed_days} onChange={(e) => setLeave({ ...leave, allowed_days: e.target.value })} /></Field>
            <button disabled={saving} className="col-span-2 rounded-lg bg-[#2f5d31] text-white px-4 py-2">Save</button>
          </form>
          <ul className="divide-y divide-gray-100 text-sm">
            {(leave.items || []).map((item) => (
              <li key={item.id} className="py-2 flex justify-between">
                <span>{item.year}: {item.allowed_days} days</span>
                <button type="button" className="text-rose-600" onClick={async () => { await api.del(`/users/${leave.user.id}/leave-days/${item.id}`); const res = await api.get(`/users/${leave.user.id}/leave-days`); setLeave((prev) => ({ ...prev, items: res.data || [] })); }}>Delete</button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="text-gray-400" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
