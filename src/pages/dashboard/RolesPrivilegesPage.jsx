import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import { inputClass, StatusBadge } from '../../components/ui/dataUi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { canManageRoles } from '../../utils/rwvcaAccess';
import { toPlainText } from '../../utils/sanitize';

function groupPrivileges(privileges) {
  const groups = new Map();
  for (const item of privileges || []) {
    const cat = item.category || 'other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(item);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default function RolesPrivilegesPage() {
  const { user, refreshUser } = useAuth();
  const allowed = canManageRoles(user);

  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [baselineIds, setBaselineIds] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState({ role_name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [roleUsers, setRoleUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/roles/privileges/matrix');
      const nextRoles = res.data?.roles || [];
      const nextPrivs = res.data?.privileges || [];
      setRoles(nextRoles);
      setPrivileges(nextPrivs);
      setSelectedRoleId((prev) => {
        if (prev && nextRoles.some((r) => Number(r.id) === Number(prev))) return prev;
        return nextRoles[0]?.id || null;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load roles and privileges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load().catch(() => {});
  }, [allowed, load]);

  useEffect(() => {
    const role = roles.find((r) => Number(r.id) === Number(selectedRoleId));
    const ids = new Set((role?.privilege_ids || []).map(Number));
    setSelectedIds(ids);
    setBaselineIds(new Set(ids));
    setInfo('');
    setShowUsers(false);
    setRoleUsers([]);
    setUsersError('');
  }, [selectedRoleId, roles]);

  const loadRoleUsers = async () => {
    if (!selectedRoleId) return;
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await api.get(`/roles/${selectedRoleId}/users`);
      setRoleUsers(res.data?.users || []);
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Could not load users for this role');
      setRoleUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleUsersPanel = async () => {
    const next = !showUsers;
    setShowUsers(next);
    if (next) await loadRoleUsers();
  };

  const selectedRole = useMemo(
    () => roles.find((r) => Number(r.id) === Number(selectedRoleId)) || null,
    [roles, selectedRoleId]
  );

  const dirty = useMemo(() => {
    if (selectedIds.size !== baselineIds.size) return true;
    for (const id of selectedIds) if (!baselineIds.has(id)) return true;
    return false;
  }, [selectedIds, baselineIds]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => String(r.role_name || '').toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? privileges
      : privileges.filter(
          (p) =>
            String(p.name || '').toLowerCase().includes(q) ||
            String(p.code || '').toLowerCase().includes(q) ||
            String(p.description || '').toLowerCase().includes(q)
        );
    return groupPrivileges(list);
  }, [privileges, search]);

  const togglePrivilege = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const num = Number(id);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const toggleGroup = (items, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (checked) next.add(Number(item.id));
        else next.delete(Number(item.id));
      }
      return next;
    });
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError('');
    setInfo('');
    try {
      const res = await api.put(`/roles/${selectedRoleId}/privileges`, {
        privilege_ids: [...selectedIds],
      });
      setRoles(res.data?.roles || []);
      setPrivileges(res.data?.privileges || privileges);
      setInfo('Privileges saved. Users with this role get the new access on next login/refresh.');
      if (typeof refreshUser === 'function') await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save privileges');
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    if (!selectedRoleId) return;
    if (!window.confirm(`Restore seeded default privileges for ${selectedRole?.role_name}?`)) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/roles/${selectedRoleId}/privileges/restore-defaults`);
      setRoles(res.data?.roles || []);
      setPrivileges(res.data?.privileges || privileges);
      setInfo('Default privileges restored for this role.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not restore defaults');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (event) => {
    event.preventDefault();
    if (!newRole.role_name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post('/roles', newRole);
      setNewRole({ role_name: '', description: '' });
      await load();
      setInfo('Role created. Assign privileges on the right, then Save.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create role');
    } finally {
      setCreating(false);
    }
  };

  const removeRole = async (role) => {
    if (!window.confirm(`Delete role "${role.role_name}"? Users keeping this role name will lose mapped privileges.`)) return;
    try {
      await api.del(`/roles/${role.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete role');
    }
  };

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-4">
      <PageHeading
        title="Roles & Privileges"
        subtitle="Map each role to menus and capabilities. Seeded defaults match the previous hardcoded access."
        icon={<Shield className="h-6 w-6" />}
        actions={[
          {
            label: dirty ? 'Save changes' : 'Saved',
            variant: 'primary',
            icon: saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />,
            onClick: save,
            disabled: saving || !dirty || !selectedRoleId,
          },
          {
            label: 'Restore defaults',
            variant: 'secondary',
            icon: <RotateCcw className="h-4 w-4" />,
            onClick: restoreDefaults,
            disabled: saving || !selectedRoleId,
          },
        ]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}
      {info && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{info}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Roles</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} pl-8`}
                placeholder="Filter roles…"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && <p className="p-3 text-sm text-gray-500">Loading…</p>}
            {!loading && filteredRoles.map((role) => {
              const active = Number(role.id) === Number(selectedRoleId);
              const count = (role.privilege_ids || []).length;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition ${
                    active
                      ? 'bg-[#2f5d31] text-white shadow-sm'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{role.role_name}</span>
                    <span className={`text-[11px] shrink-0 ${active ? 'text-white/80' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </div>
                  {role.description && (
                    <p className={`mt-0.5 text-[11px] line-clamp-2 ${active ? 'text-white/75' : 'text-gray-500'}`}>
                      {toPlainText(role.description)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          <form onSubmit={createRole} className="p-3 border-t border-gray-100 space-y-2 bg-[#f7faf7]">
            <p className="text-xs font-semibold text-gray-600">Add role</p>
            <input
              className={inputClass}
              placeholder="Role name"
              value={newRole.role_name}
              onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
              required
            />
            <input
              className={inputClass}
              placeholder="Description (optional)"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#2f5d31] px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              <Plus size={14} /> {creating ? 'Creating…' : 'Create role'}
            </button>
          </form>
        </aside>

        <section className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm min-h-[520px] flex flex-col">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {selectedRole?.role_name || 'Select a role'}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedIds.size} privilege{selectedIds.size === 1 ? '' : 's'} selected
                {dirty ? ' · unsaved changes' : ''}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} pl-8`}
                placeholder="Search privileges…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedRole && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => removeRole(selectedRole)}
              >
                <Trash2 size={14} /> Delete role
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {loading && <p className="text-sm text-gray-500">Loading privileges…</p>}
            {!loading && filteredGroups.map(([category, items]) => {
              const allOn = items.every((item) => selectedIds.has(Number(item.id)));
              const someOn = items.some((item) => selectedIds.has(Number(item.id)));
              return (
                <div key={category} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#2f5d31]/8 to-transparent px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold capitalize text-[#2f5d31]">{category}</p>
                      <p className="text-[11px] text-gray-500">{items.length} items</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={(el) => {
                          if (el) el.indeterminate = someOn && !allOn;
                        }}
                        onChange={(e) => toggleGroup(items, e.target.checked)}
                      />
                      Select all
                    </label>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((item) => {
                      const checked = selectedIds.has(Number(item.id));
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition ${
                            checked ? 'bg-[#2f5d31]/[0.04]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={() => togglePrivilege(item.id)}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-900">{item.name}</span>
                            <span className="block text-[11px] font-mono text-gray-400">{item.code}</span>
                            {item.description && (
                              <span className="block text-xs text-gray-500 mt-0.5">{toPlainText(item.description)}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {selectedRole && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Users with this role</p>
                    <p className="text-xs text-gray-500">
                      Primary or acting assignment for {selectedRole.role_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleUsersPanel}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2f5d31]/30 bg-white px-3 py-2 text-sm font-medium text-[#2f5d31] hover:bg-[#2f5d31]/5"
                  >
                    <Users size={14} />
                    {showUsers ? 'Hide users list' : 'Show users list'}
                    {showUsers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {showUsers && (
                  <div className="p-4 border-t border-gray-100">
                    {usersLoading && (
                      <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 size={14} className="animate-spin" /> Loading users…
                      </p>
                    )}
                    {usersError && <p className="text-sm text-rose-600">{usersError}</p>}
                    {!usersLoading && !usersError && roleUsers.length === 0 && (
                      <p className="text-sm text-gray-500">No users currently have this role.</p>
                    )}
                    {!usersLoading && roleUsers.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#f7faf7] text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Name</th>
                              <th className="px-3 py-2 font-semibold">Email</th>
                              <th className="px-3 py-2 font-semibold">Primary role</th>
                              <th className="px-3 py-2 font-semibold">Assignment</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {roleUsers.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50/80">
                                <td className="px-3 py-2 font-medium text-gray-900">{row.names || '—'}</td>
                                <td className="px-3 py-2 text-gray-600">{row.email || '—'}</td>
                                <td className="px-3 py-2 text-gray-600">{row.role || '—'}</td>
                                <td className="px-3 py-2">
                                  <StatusBadge
                                    value={
                                      row.assignment === 'primary+acting'
                                        ? 'Primary + acting'
                                        : row.assignment === 'acting'
                                          ? 'Acting'
                                          : 'Primary'
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <StatusBadge value={Number(row.active) === 1 ? 'Active' : 'Inactive'} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="px-3 py-2 text-xs text-gray-500 border-t border-gray-50">
                          {roleUsers.length} user{roleUsers.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
