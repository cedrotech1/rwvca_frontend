import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CalendarRange,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import RichHtml from '../../../components/RichHtml';
import RichTextEditor from '../../../components/RichTextEditor';
import { DataTable, StatusBadge, exportCsv, inputClass, labelClass } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { canMonitorPlans, canSeeAllStaffMonitoring } from '../../../utils/rwvcaAccess';

const PLAN_STATUSES = ['draft', 'pending', 'ongoing', 'complete', 'postponed'];
const REPORT_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

function useUsersAndDepartments() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    api.get('/users', { limit: 500, active: 1 }).then((res) => {
      setUsers(res.data?.items || res.data || []);
    }).catch(() => {});
    api.get('/departments', { limit: 200 }).then((res) => {
      setDepartments(res.data?.items || res.data || []);
    }).catch(() => {});
  }, []);
  return { users, departments };
}

function userDeptId(user) {
  return Number(user?.department_ID || user?.department?.id || 0) || 0;
}

function userDeptName(user, departments = []) {
  if (user?.department?.name) return user.department.name;
  const dept = departments.find((d) => Number(d.id) === userDeptId(user));
  return dept?.name || 'No department';
}

/** Pick specific users; departments only filter / select-all helpers. */
function UserSharePicker({
  users,
  departments = [],
  selectedIds,
  onChange,
  excludeUserId,
  label = 'Share with specific users (they get notified)',
  hint = 'Department filters help you find people. Only selected users are notified — not the whole department.',
}) {
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const selected = useMemo(() => new Set(selectedIds.map(Number)), [selectedIds]);

  const pool = useMemo(
    () => users.filter((u) => Number(u.id) !== Number(excludeUserId)),
    [users, excludeUserId]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const deptId = deptFilter ? Number(deptFilter) : 0;
    return pool
      .filter((u) => {
        if (deptId && userDeptId(u) !== deptId) return false;
        if (!needle) return true;
        const deptName = userDeptName(u, departments).toLowerCase();
        return (
          String(u.names || '').toLowerCase().includes(needle)
          || String(u.email || '').toLowerCase().includes(needle)
          || String(u.role || '').toLowerCase().includes(needle)
          || deptName.includes(needle)
        );
      })
      .slice(0, 120);
  }, [pool, q, deptFilter, departments]);

  const toggle = (userId) => {
    const id = Number(userId);
    if (selected.has(id)) onChange(selectedIds.filter((x) => Number(x) !== id));
    else onChange([...selectedIds, id]);
  };

  const selectAllVisible = () => {
    const ids = new Set(selectedIds.map(Number));
    filtered.forEach((u) => ids.add(Number(u.id)));
    onChange([...ids]);
  };

  const selectAllInDepartment = () => {
    if (!deptFilter) return;
    const deptId = Number(deptFilter);
    const ids = new Set(selectedIds.map(Number));
    pool.filter((u) => userDeptId(u) === deptId).forEach((u) => ids.add(Number(u.id)));
    onChange([...ids]);
  };

  const clearSelected = () => onChange([]);

  const selectedUsers = pool.filter((u) => selected.has(Number(u.id)));

  return (
    <div className="space-y-3 rounded-xl ring-1 ring-gray-200 bg-gray-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`${labelClass} mb-0`}>{label}</p>
        <span className="text-xs text-gray-500">{selectedUsers.length} selected</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pl-9 bg-white`}
            placeholder="Search name, email, role, department…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={`${inputClass} bg-white`}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectAllVisible}
          className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Select all shown
        </button>
        {deptFilter ? (
          <button
            type="button"
            onClick={selectAllInDepartment}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#2f5d31] ring-1 ring-[#2f5d31]/30 hover:bg-[#2f5d31]/5"
          >
            Select all in department
          </button>
        ) : null}
        {selectedUsers.length > 0 ? (
          <button
            type="button"
            onClick={clearSelected}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            Clear selected
          </button>
        ) : null}
      </div>
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className="inline-flex items-center gap-1 rounded-full bg-[#2f5d31] px-2.5 py-1 text-xs font-medium text-white"
              title="Remove"
            >
              {u.names}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <div className="max-h-56 overflow-y-auto rounded-lg bg-white ring-1 ring-gray-200 divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-gray-400">No staff match your search</p>
        ) : (
          filtered.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[#2f5d31]/5">
              <input type="checkbox" checked={selected.has(Number(u.id))} onChange={() => toggle(u.id)} />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-gray-800">{u.names}</span>
                <span className="ml-2 text-xs text-gray-400">{u.role}</span>
                <span className="block text-xs text-gray-400 truncate">
                  {userDeptName(u, departments)}
                  {u.email ? ` · ${u.email}` : ''}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function CollaboratorPicker({ users, departments, selectedIds, onChange, excludeUserId }) {
  return (
    <UserSharePicker
      users={users}
      departments={departments}
      selectedIds={selectedIds}
      onChange={onChange}
      excludeUserId={excludeUserId}
      label="Joint activity — search & select collaborators"
      hint="Selected collaborators get an immediate notification and can accept / decline with a reply."
    />
  );
}

function PlanForm({ initial, onSaved, onCancel, currentUserId }) {
  const { users, departments } = useUsersAndDepartments();
  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    start_date: initial?.start_date ? String(initial.start_date).slice(0, 10) : '',
    end_date: initial?.end_date ? String(initial.end_date).slice(0, 10) : '',
    status: initial?.status || 'draft',
    is_joint: Boolean(initial?.is_joint),
    collaborator_ids: (initial?.collaborators || []).map((c) => Number(c.user_id || c.user?.id)).filter(Boolean),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        is_joint: form.is_joint || form.collaborator_ids.length > 0 ? 1 : 0,
        collaborator_ids: form.collaborator_ids,
      };
      let saved;
      if (initial?.id) {
        const res = await api.put(`/employee-plans/${initial.id}`, payload);
        saved = res.data;
        await api.put(`/employee-plans/${initial.id}/collaborators`, { user_ids: form.collaborator_ids });
        if (form.status && form.status !== initial.status) {
          const statusRes = await api.post(`/employee-plans/${initial.id}/status`, { status: form.status });
          saved = statusRes.data;
        } else {
          const refreshed = await api.get(`/employee-plans/${initial.id}`);
          saved = refreshed.data;
        }
      } else {
        const res = await api.post('/employee-plans', payload);
        saved = res.data;
      }
      onSaved?.(saved);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-4">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div>
        <label className={labelClass}>Title *</label>
        <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What will you do?" />
      </div>
      <div>
        <label className={labelClass}>Description / planned activity</label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => setForm({ ...form, description: html })}
          placeholder="Describe the planned activity (bullets, numbers, formatting supported)…"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Start date *</label>
          <input required type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>End date *</label>
          <input required type="date" className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {PLAN_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.is_joint || form.collaborator_ids.length > 0}
          onChange={(e) => setForm({ ...form, is_joint: e.target.checked, collaborator_ids: e.target.checked ? form.collaborator_ids : [] })}
        />
        Joint activity (select collaborators)
      </label>
      {(form.is_joint || form.collaborator_ids.length > 0) && (
        <CollaboratorPicker
          users={users}
          departments={departments}
          selectedIds={form.collaborator_ids}
          excludeUserId={currentUserId}
          onChange={(ids) => setForm({ ...form, collaborator_ids: ids, is_joint: true })}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? 'Saving…' : initial?.id ? 'Update plan' : 'Create plan'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ReportGenerator({ users, departments, monitor, currentUserId }) {
  const [form, setForm] = useState({
    report_type: 'WEEKLY',
    title: '',
    period_start: '',
    period_end: '',
    content: '',
    shared_user_ids: [],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reports, setReports] = useState([]);
  const [scope, setScope] = useState('mine');

  const loadReports = async () => {
    try {
      const res = await api.get('/employee-plans/reports', { scope, limit: 100 });
      setReports(res.data?.items || []);
    } catch {
      setReports([]);
    }
  };

  useEffect(() => { loadReports().catch(() => {}); }, [scope]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/employee-plans/reports', {
        report_type: form.report_type,
        title: form.title.trim(),
        period_start: form.period_start,
        period_end: form.period_end,
        content: form.content || null,
        shared_user_ids: form.shared_user_ids,
      });
      const n = form.shared_user_ids.length;
      setMessage({
        type: 'success',
        text: n
          ? `Report created. ${n} selected user${n === 1 ? '' : 's'} notified.`
          : 'Report created (not shared with anyone).',
      });
      setForm((prev) => ({ ...prev, title: '', content: '', shared_user_ids: [] }));
      await loadReports();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not create report' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Generate plan report</h3>
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{message.text}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Type</label>
            <select className={inputClass} value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Period start</label>
            <input required type="date" className={inputClass} value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Period end</label>
            <input required type="date" className={inputClass} value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Content</label>
          <RichTextEditor
            value={form.content}
            onChange={(html) => setForm({ ...form, content: html })}
            placeholder="Write the plan report content…"
          />
        </div>
        <UserSharePicker
          users={users}
          departments={departments}
          selectedIds={form.shared_user_ids}
          onChange={(ids) => setForm((prev) => ({ ...prev, shared_user_ids: ids }))}
          excludeUserId={currentUserId}
          label="Share with specific users (they get notified)"
          hint="Use department filter to find people, or Select all in department. Only checked users are notified."
        />
        <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Create & share report'}
        </button>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Reports</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setScope('mine')} className={`rounded-lg px-3 py-1 text-xs font-medium ${scope === 'mine' ? 'bg-[#2f5d31] text-white' : 'bg-gray-100'}`}>Mine</button>
            <button type="button" onClick={() => setScope('shared')} className={`rounded-lg px-3 py-1 text-xs font-medium ${scope === 'shared' ? 'bg-[#2f5d31] text-white' : 'bg-gray-100'}`}>Shared with me</button>
            {monitor && (
              <button type="button" onClick={() => setScope('all')} className={`rounded-lg px-3 py-1 text-xs font-medium ${scope === 'all' ? 'bg-[#2f5d31] text-white' : 'bg-gray-100'}`}>All</button>
            )}
          </div>
        </div>
        <DataTable
          empty="No reports yet"
          columns={[
            { key: 'report_type', label: 'Type' },
            { key: 'title', label: 'Title' },
            { key: 'author', label: 'Author', value: (r) => r.author?.names || '—' },
            { key: 'period', label: 'Period', value: (r) => `${String(r.period_start || '').slice(0, 10)} → ${String(r.period_end || '').slice(0, 10)}` },
            { key: 'created_at', label: 'Created', value: (r) => String(r.created_at || '').slice(0, 10) },
          ]}
          rows={reports}
        />
        {reports[0]?.content && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Latest report preview</p>
            <RichHtml html={reports[0].content} />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmployeePlansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const monitor = canMonitorPlans(user);
  const { users, departments } = useUsersAndDepartments();
  const tabs = useMemo(() => {
    const list = [
      { value: 'mine', label: 'My plans' },
      { value: 'collaborations', label: 'Collaborations' },
    ];
    if (monitor) list.push({ value: 'all', label: 'All staff' });
    return list;
  }, [monitor]);

  const [tab, setTab] = useState('mine');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [section, setSection] = useState('plans');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee-plans', {
        tab,
        limit: 300,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setItems(res.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load plans');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, [tab, statusFilter]);

  if (!hasPrivilege(user, 'menu.employee_plans') && !hasPrivilege(user, 'plans.manage')) {
    return (
      <PageHeading icon={<CalendarRange className="h-6 w-6" />} title="Employee Plans" subtitle="Access denied" showBack backTo="/dashboard" />
    );
  }

  const stats = useMemo(() => {
    const by = Object.fromEntries(PLAN_STATUSES.map((s) => [s, 0]));
    let joint = 0;
    for (const p of items) {
      if (by[p.status] !== undefined) by[p.status] += 1;
      if (p.is_joint) joint += 1;
    }
    return { by, joint, total: items.length };
  }, [items]);

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<CalendarRange className="h-6 w-6" />}
        title="Employee Plans"
        subtitle="Plan activities, collaborate with notifications, comment, and share period reports"
        actions={[
          {
            label: showCreate ? 'Close form' : 'New plan',
            onClick: () => setShowCreate((v) => !v),
            icon: <Plus className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Listed plans" value={stats.total} />
        <MiniStat label="Joint" value={stats.joint} />
        <MiniStat label="Ongoing" value={stats.by.ongoing} />
        <MiniStat label="Complete" value={stats.by.complete} />
        <MiniStat label="Draft / pending" value={(stats.by.draft || 0) + (stats.by.pending || 0)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSection('plans')} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${section === 'plans' ? 'bg-[#2f5d31] text-white' : 'bg-white ring-1 ring-gray-200 text-gray-700'}`}>Plans</button>
        <button type="button" onClick={() => setSection('reports')} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${section === 'reports' ? 'bg-[#2f5d31] text-white' : 'bg-white ring-1 ring-gray-200 text-gray-700'}`}>Reports</button>
        <Link to="/dashboard/staff-monitoring" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-[#2f5d31]/10 text-[#2f5d31] ring-1 ring-[#2f5d31]/30">
          <BarChart3 className="h-4 w-4" /> {monitor ? 'Employee plan monitoring' : 'My plans monitoring'}
        </Link>
      </div>

      {section === 'reports' ? (
        <ReportGenerator users={users} departments={departments} monitor={monitor} currentUserId={user?.id} />
      ) : (
        <>
          {showCreate && (
            <PlanForm
              currentUserId={user?.id}
              onCancel={() => setShowCreate(false)}
              onSaved={(plan) => {
                setShowCreate(false);
                if (plan?.id) navigate(`/dashboard/employee-plans/${plan.id}`);
                else load();
              }}
            />
          )}

          <div className="flex flex-wrap gap-2 items-end">
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
              </button>
            ))}
            <form
              className="ml-auto flex flex-wrap gap-2"
              onSubmit={(e) => { e.preventDefault(); load(); }}
            >
              <select className={`${inputClass} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className={`${inputClass} w-52`} placeholder="Search plans / owners…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="submit" className="rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white">Search</button>
            </form>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <DataTable
            loading={loading}
            empty="No plans"
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'owner', label: 'Owner', value: (r) => r.owner?.names || '—' },
              {
                key: 'period',
                label: 'Timeline',
                value: (r) => `${String(r.start_date || '').slice(0, 10)} → ${String(r.end_date || '').slice(0, 10)}`,
              },
              { key: 'status', label: 'Status', value: (r) => <StatusBadge value={r.status} /> },
              {
                key: 'joint',
                label: 'Collaboration',
                value: (r) => (r.is_joint ? (
                  <span className="inline-flex items-center gap-1 text-cyan-700"><Users className="h-3.5 w-3.5" />{(r.collaborators || []).length}</span>
                ) : 'Solo'),
              },
            ]}
            rows={items}
            renderActions={(row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31]"
                  onClick={() => navigate(`/dashboard/employee-plans/${row.id}`)}
                >
                  <Eye className="h-4 w-4" /> View
                </button>
              </div>
            )}
          />
        </>
      )}
    </div>
  );
}

export function EmployeePlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [replyNote, setReplyNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get(`/employee-plans/${id}`);
    setPlan(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  if (!plan && !error) {
    return <PageHeading icon={<CalendarRange className="h-6 w-6" />} title="Plan" subtitle="Loading…" showBack backTo="/dashboard/employee-plans" />;
  }
  if (!plan) {
    return <PageHeading icon={<CalendarRange className="h-6 w-6" />} title="Plan" subtitle={error || 'Not found'} showBack backTo="/dashboard/employee-plans" />;
  }

  const isOwner = Number(plan.user_id) === Number(user?.id);
  const canManage = isOwner || canMonitorPlans(user);
  const myCollab = (plan.collaborators || []).find((c) => Number(c.user_id) === Number(user?.id));
  const pendingResponse = myCollab && myCollab.response_status === 'pending';

  const setStatus = async (status) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/employee-plans/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    } finally {
      setSaving(false);
    }
  };

  const respond = async (response) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/employee-plans/${id}/collaborators/respond`, {
        response,
        reply_note: replyNote.trim() || null,
      });
      setReplyNote('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not respond');
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!comment.trim() || comment === '<p></p>') return;
    setSaving(true);
    try {
      await api.post(`/employee-plans/${id}/comments`, { comment });
      setComment('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this plan? Collaborators will be notified.')) return;
    try {
      await api.del(`/employee-plans/${id}`);
      navigate('/dashboard/employee-plans');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<CalendarRange className="h-6 w-6" />}
        title={plan.title}
        subtitle={`${String(plan.start_date || '').slice(0, 10)} → ${String(plan.end_date || '').slice(0, 10)}`}
        showBack
        backTo="/dashboard/employee-plans"
        actions={[
          ...(canManage ? [
            { label: editing ? 'Close edit' : 'Edit', onClick: () => setEditing((v) => !v) },
            { label: 'Delete', onClick: remove, variant: 'danger' },
          ] : []),
        ]}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {editing ? (
        <PlanForm
          initial={plan}
          currentUserId={user?.id}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await load();
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={plan.status} />
                {plan.is_joint ? <span className="text-xs rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5">Joint activity</span> : null}
              </div>
              <RichHtml html={plan.description} empty="No description" />
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                <div><dt className="text-gray-500">Owner</dt><dd className="font-medium">{plan.owner?.names || '—'}</dd></div>
                <div><dt className="text-gray-500">Timeline</dt><dd className="font-medium">{String(plan.start_date || '').slice(0, 10)} → {String(plan.end_date || '').slice(0, 10)}</dd></div>
              </dl>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Collaborators</h3>
              {(plan.collaborators || []).length === 0 ? (
                <p className="text-sm text-gray-400">No collaborators</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(plan.collaborators || []).map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-2">
                      <span>
                        {c.user?.names || `User #${c.user_id}`}
                        {c.reply_note ? <span className="block text-xs text-gray-500 mt-0.5">{c.reply_note}</span> : null}
                      </span>
                      <StatusBadge value={c.response_status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Activity comments</h3>
              <ul className="space-y-3">
                {(plan.comments || []).map((c) => (
                  <li key={c.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-800">{c.author?.names || 'User'}</span>
                      <span>{String(c.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <RichHtml html={c.comment} />
                  </li>
                ))}
              </ul>
              <form onSubmit={addComment} className="space-y-2">
                <RichTextEditor
                  value={comment}
                  onChange={setComment}
                  placeholder="Add a comment on this activity…"
                />
                <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Post comment
                </button>
              </form>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Activity className="h-4 w-4" /> Activity log
              </h3>
              {(plan.logs || []).length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded yet</p>
              ) : (
                <ul className="space-y-2 text-sm max-h-80 overflow-y-auto">
                  {(plan.logs || []).map((log) => (
                    <li key={log.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-50 pb-2">
                      <span>
                        <span className="font-medium capitalize">{String(log.action || '').replace(/_/g, ' ')}</span>
                        {log.detail ? ` — ${log.detail}` : ''}
                        <span className="text-gray-400"> · {log.actor?.names || 'System'}</span>
                      </span>
                      <span className="text-xs text-gray-400">{String(log.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {pendingResponse && (
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-2">
                <p className="text-sm font-semibold text-gray-800">Collaboration invite</p>
                <textarea
                  className={`${inputClass} min-h-16`}
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                  placeholder="Optional reply note"
                />
                <div className="flex gap-2">
                  <button type="button" disabled={saving} onClick={() => respond('accepted')} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                    Accept
                  </button>
                  <button type="button" disabled={saving} onClick={() => respond('declined')} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                    Decline
                  </button>
                </div>
              </div>
            )}

            {canManage && (
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-2">
                <p className="text-sm font-semibold text-gray-800">Update status / mark task</p>
                <div className="flex flex-col gap-2">
                  {PLAN_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={saving || plan.status === s}
                      onClick={() => setStatus(s)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium capitalize disabled:opacity-40 ${
                        plan.status === s ? 'bg-[#2f5d31] text-white' : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffMonitoringPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments } = useUsersAndDepartments();
  const canSeeAll = canSeeAllStaffMonitoring(user);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('completed');
  const [departmentId, setDepartmentId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee-plans/monitoring', {
        period_start: periodStart,
        period_end: periodEnd,
        search: canSeeAll ? (search || undefined) : undefined,
        sort,
        department_id: canSeeAll ? (departmentId || undefined) : undefined,
      });
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load plan monitoring');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [canSeeAll, sort, departmentId]);

  const statusCounts = data?.status_counts || {};
  const maxStatus = Math.max(1, ...Object.values(statusCounts).map(Number));
  const ranking = data?.ranking || [];
  const collab = data?.collaboration || {};
  const login = data?.login || {};
  const deptStats = data?.department_stats || [];
  const maxDept = Math.max(1, ...deptStats.map((d) => Number(d.plans || 0)));
  const me = ranking[0] || null;

  const deletePlan = async (planId) => {
    if (!window.confirm(`Delete plan #${planId}?`)) return;
    try {
      await api.del(`/employee-plans/${planId}`);
      await load();
      if (selectedUser) {
        setSelectedUser((prev) => prev ? {
          ...prev,
          plans_preview: (prev.plans_preview || []).filter((p) => Number(p.id) !== Number(planId)),
        } : null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<BarChart3 className="h-6 w-6" />}
        title={canSeeAll ? 'Employee plan monitoring' : 'My plans monitoring'}
        subtitle={
          canSeeAll
            ? 'Organization-wide plan performance, collaboration, login activity, missing plans & report sharing'
            : 'Your personal plan performance, collaboration, login activity and reports for this period'
        }
        showBack
        backTo="/dashboard/employee-plans"
        actions={canSeeAll ? [
          {
            label: 'Export ranking CSV',
            onClick: () => exportCsv('staff-plan-ranking', [
              { key: 'rank', label: 'Rank' },
              { key: 'names', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'completed_plans', label: 'Completed' },
              { key: 'plan_count', label: 'Plans' },
              { key: 'completion_rate', label: 'Completion %' },
              { key: 'collaboration_rate', label: 'Collaboration %' },
              { key: 'last_login_at', label: 'Last login' },
            ], ranking),
          },
        ] : []}
      />

      {!canSeeAll && (
        <p className="rounded-lg bg-[#2f5d31]/5 px-3 py-2 text-xs text-[#2f5d31] ring-1 ring-[#2f5d31]/20">
          Showing My plans monitoring. Users with the Employee plan monitoring privilege can see all staff.
        </p>
      )}

      <form
        className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
        onSubmit={(e) => { e.preventDefault(); load(); }}
      >
        <label className="text-sm text-gray-600">
          Period start
          <input type="date" className={`mt-1 ${inputClass}`} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </label>
        <label className="text-sm text-gray-600">
          Period end
          <input type="date" className={`mt-1 ${inputClass}`} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </label>
        {canSeeAll && (
          <>
            <label className="text-sm text-gray-600">
              Department
              <select className={`mt-1 ${inputClass}`} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">All departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Sort by
              <select className={`mt-1 ${inputClass}`} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="completed">Completed plans</option>
                <option value="completion_rate">Completion %</option>
                <option value="collaboration_rate">Collaboration %</option>
                <option value="plans">Plan count</option>
                <option value="last_login">Last login</option>
                <option value="name">Name</option>
              </select>
            </label>
            <label className="text-sm text-gray-600 grow min-w-[180px]">
              Search staff
              <input className={`mt-1 ${inputClass}`} placeholder="Name, email, role, dept…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          </>
        )}
        <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">Apply</button>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading plan monitoring…</p>}

      {data && (
        <>
          <div className={`grid gap-3 sm:grid-cols-2 ${canSeeAll ? 'xl:grid-cols-4 2xl:grid-cols-8' : 'xl:grid-cols-4'}`}>
            {canSeeAll && <StatCard label="Staff" value={data.totals?.staff} />}
            {canSeeAll && <StatCard label="With plans" value={data.totals?.with_plans} />}
            {canSeeAll && <StatCard label="Missing plans" value={data.totals?.without_plans} tone="warn" />}
            <StatCard label="Plans" value={data.totals?.plans} />
            <StatCard label="Completed" value={data.totals?.completed} />
            <StatCard label="Joint rate" value={`${data.totals?.joint_rate_percent ?? 0}%`} />
            <StatCard label="Reports (month)" value={data.totals?.reports_this_month} />
            <StatCard label="Shared reports" value={data.totals?.shared_reports_this_month} />
          </div>

          {!canSeeAll && me && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{me.names}</h3>
                  <p className="text-xs text-gray-500">{me.role} · {me.department?.name || 'No dept'}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <InfoTile label="Done %" value={`${me.completion_rate}%`} />
                  <InfoTile label="Collab %" value={`${me.collaboration_rate}%`} />
                  <InfoTile label="Last login" value={me.last_login_at ? String(me.last_login_at).slice(0, 10) : '—'} />
                </div>
              </div>
              <ul className="space-y-2">
                {(me.plans_preview || []).length === 0 && <li className="text-sm text-gray-400">No plans in this period</li>}
                {(me.plans_preview || []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{p.title}</p>
                      <p className="text-xs text-gray-500">{String(p.start_date || '').slice(0, 10)} → {String(p.end_date || '').slice(0, 10)} · {p.status}</p>
                    </div>
                    <button type="button" className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-gray-200" onClick={() => navigate(`/dashboard/employee-plans/${p.id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white"
                onClick={() => navigate('/dashboard/employee-plans')}
              >
                Open my plans
              </button>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Plan status mix</h3>
              <div className="space-y-2">
                {Object.entries(statusCounts).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="capitalize">{key}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#2f5d31]" style={{ width: `${(Number(value) / maxStatus) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Collaboration</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <InfoTile label="Joint plans" value={collab.joint_plans} />
                <InfoTile label="Solo plans" value={collab.solo_plans} />
                <InfoTile label="Accepted" value={collab.accepted_invites} />
                <InfoTile label="Pending invites" value={collab.pending_invites} />
              </div>
              <p className="text-3xl font-bold text-[#2f5d31]">{collab.joint_rate_percent ?? 0}%</p>
              <p className="text-xs text-gray-500">of plans in period are joint / collaborated</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">{canSeeAll ? 'Portal access' : 'Your portal access'}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {canSeeAll ? (
                  <>
                    <InfoTile label="Active 7 days" value={login.active_7d} />
                    <InfoTile label="Active 30 days" value={login.active_30d} />
                    <InfoTile label="Older login" value={login.older} />
                    <InfoTile label="Never logged in" value={login.never_logged_in} tone="warn" />
                  </>
                ) : (
                  <>
                    <InfoTile label="Last login" value={me?.last_login_at ? String(me.last_login_at).slice(0, 10) : '—'} />
                    <InfoTile label="Login status" value={me?.login_bucket === 'never' ? 'Never' : me?.login_bucket || '—'} />
                  </>
                )}
              </div>
            </div>
          </div>

          {canSeeAll && (
            <>
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Staff ranking & plans</h3>
                  <div className="max-h-[28rem] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-wide text-gray-400 sticky top-0 bg-white">
                        <tr>
                          <th className="py-2 pr-2">#</th>
                          <th className="pr-2">Name</th>
                          <th className="pr-2">Dept</th>
                          <th className="pr-2">Plans</th>
                          <th className="pr-2">Done</th>
                          <th className="pr-2">Done %</th>
                          <th className="pr-2">Collab %</th>
                          <th className="pr-2">Login</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ranking.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="py-2 pr-2">{row.rank}</td>
                            <td className="pr-2 font-medium">{row.names}</td>
                            <td className="pr-2 text-xs text-gray-500">{row.department?.name || '—'}</td>
                            <td className="pr-2">{row.plan_count}</td>
                            <td className="pr-2">{row.completed_plans}</td>
                            <td className="pr-2">{row.completion_rate}%</td>
                            <td className="pr-2">{row.collaboration_rate}%</td>
                            <td className="pr-2 text-xs text-gray-500">{row.last_login_at ? String(row.last_login_at).slice(0, 10) : '—'}</td>
                            <td>
                              <button type="button" className="text-[#2f5d31] font-medium text-xs" onClick={() => setSelectedUser(row)}>
                                View plans
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Plans by department</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {deptStats.map((d) => (
                        <div key={d.department}>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{d.department}</span>
                            <span>{d.plans} plans · {d.completed} done</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-cyan-600" style={{ width: `${(Number(d.plans) / maxDept) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent activity</h3>
                    <ul className="space-y-2 text-xs max-h-64 overflow-y-auto">
                      {(data.recent_activity || []).length === 0 && <li className="text-gray-400">No recent logs</li>}
                      {(data.recent_activity || []).map((log) => (
                        <li key={log.id} className="border-b border-gray-50 pb-2">
                          <span className="font-medium capitalize">{String(log.action || '').replace(/_/g, ' ')}</span>
                          {log.plan?.title ? ` · ${log.plan.title}` : ''}
                          <div className="text-gray-400">{log.actor?.names || 'System'} · {String(log.created_at || '').slice(0, 16).replace('T', ' ')}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Staff missing plans</h3>
                  <DataTable
                    empty="Everyone has plans in this period"
                    columns={[
                      { key: 'names', label: 'Name' },
                      { key: 'role', label: 'Role' },
                      { key: 'department', label: 'Dept', value: (r) => r.department?.name || '—' },
                      { key: 'last_login_at', label: 'Last login', value: (r) => (r.last_login_at ? String(r.last_login_at).slice(0, 10) : '—') },
                    ]}
                    rows={data.staff_without_plans || []}
                  />
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">No shared report this month</h3>
                  <DataTable
                    empty="All shared reports"
                    columns={[
                      { key: 'names', label: 'Name' },
                      { key: 'role', label: 'Role' },
                      { key: 'reports_this_month', label: 'Reports' },
                      { key: 'shared_reports_this_month', label: 'Shared' },
                    ]}
                    rows={data.no_shared_reports_this_month || []}
                  />
                </div>
              </div>
            </>
          )}

          {!canSeeAll && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent activity</h3>
              <ul className="space-y-2 text-xs max-h-64 overflow-y-auto">
                {(data.recent_activity || []).length === 0 && <li className="text-gray-400">No recent logs</li>}
                {(data.recent_activity || []).map((log) => (
                  <li key={log.id} className="border-b border-gray-50 pb-2">
                    <span className="font-medium capitalize">{String(log.action || '').replace(/_/g, ' ')}</span>
                    {log.plan?.title ? ` · ${log.plan.title}` : ''}
                    <div className="text-gray-400">{log.actor?.names || 'System'} · {String(log.created_at || '').slice(0, 16).replace('T', ' ')}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {selectedUser && canSeeAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.names}</h3>
                <p className="text-sm text-gray-500">{selectedUser.role} · {selectedUser.department?.name || 'No dept'}</p>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <InfoTile label="Plans" value={selectedUser.plan_count} />
              <InfoTile label="Done %" value={`${selectedUser.completion_rate}%`} />
              <InfoTile label="Collab %" value={`${selectedUser.collaboration_rate}%`} />
            </div>
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {(selectedUser.plans_preview || []).length === 0 && <li className="text-sm text-gray-400">No plans in this period</li>}
              {(selectedUser.plans_preview || []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-500">{String(p.start_date || '').slice(0, 10)} → {String(p.end_date || '').slice(0, 10)} · {p.status}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-gray-200" onClick={() => navigate(`/dashboard/employee-plans/${p.id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="rounded-lg bg-white px-2 py-1 text-xs text-rose-600 ring-1 ring-gray-200" onClick={() => deletePlan(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white"
              onClick={() => navigate(`/dashboard/employee-plans?tab=all&search=${encodeURIComponent(selectedUser.names)}`)}
            >
              Open in plans list
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${tone === 'warn' ? 'ring-amber-200' : ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === 'warn' ? 'text-amber-600' : 'text-[#2f5d31]'}`}>{value ?? 0}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-[#2f5d31]">{value ?? 0}</p>
    </div>
  );
}

function InfoTile({ label, value, tone }) {
  return (
    <div className={`rounded-lg bg-gray-50 px-3 py-2 ${tone === 'warn' ? 'bg-amber-50' : ''}`}>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800">{value ?? 0}</p>
    </div>
  );
}

export default {
  EmployeePlansPage,
  EmployeePlanDetailPage,
  StaffMonitoringPage,
};
