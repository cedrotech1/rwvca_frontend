import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  CalendarRange,
  Eye,
  Plus,
} from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import RichTextEditor from '../../../components/RichTextEditor';
import { DataTable, StatusBadge, exportCsv, inputClass, labelClass } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { canMonitorPlans, hasPrivilege } from '../../../utils/rwvcaAccess';

const PLAN_STATUSES = ['draft', 'pending', 'ongoing', 'complete', 'postponed'];
const REPORT_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

function useUsersAndDepartments() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    api.get('/users', { limit: 300, active: 1 }).then((res) => {
      setUsers(res.data?.items || res.data || []);
    }).catch(() => {});
    api.get('/departments', { limit: 200 }).then((res) => {
      setDepartments(res.data?.items || res.data || []);
    }).catch(() => {});
  }, []);
  return { users, departments };
}

function PlanForm({ initial, onSaved, onCancel }) {
  const { users } = useUsersAndDepartments();
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

  const toggleCollaborator = (userId) => {
    const id = Number(userId);
    setForm((prev) => {
      const has = prev.collaborator_ids.includes(id);
      return {
        ...prev,
        is_joint: true,
        collaborator_ids: has
          ? prev.collaborator_ids.filter((x) => x !== id)
          : [...prev.collaborator_ids, id],
      };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
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
        if (form.collaborator_ids) {
          await api.put(`/employee-plans/${initial.id}/collaborators`, {
            user_ids: form.collaborator_ids,
          });
          const refreshed = await api.get(`/employee-plans/${initial.id}`);
          saved = refreshed.data;
        }
        if (form.status && form.status !== initial.status) {
          const statusRes = await api.post(`/employee-plans/${initial.id}/status`, { status: form.status });
          saved = statusRes.data;
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
        <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => setForm({ ...form, description: html })}
          placeholder="Describe the planned activity…"
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
          onChange={(e) => setForm({ ...form, is_joint: e.target.checked })}
        />
        Joint activity (select collaborators)
      </label>
      {(form.is_joint || form.collaborator_ids.length > 0) && (
        <div className="max-h-48 overflow-y-auto rounded-lg ring-1 ring-gray-200 p-3 space-y-1">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.collaborator_ids.includes(Number(u.id))}
                onChange={() => toggleCollaborator(u.id)}
              />
              {u.names}
              <span className="text-xs text-gray-400">{u.role}</span>
            </label>
          ))}
        </div>
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

function ReportGenerator({ departments }) {
  const [form, setForm] = useState({
    report_type: 'WEEKLY',
    title: '',
    period_start: '',
    period_end: '',
    content: '',
    shared_department_ids: [],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    try {
      const res = await api.get('/employee-plans/reports', { scope: 'mine', limit: 50 });
      setReports(res.data?.items || []);
    } catch {
      setReports([]);
    }
  };

  useEffect(() => { loadReports().catch(() => {}); }, []);

  const toggleDept = (id) => {
    const n = Number(id);
    setForm((prev) => ({
      ...prev,
      shared_department_ids: prev.shared_department_ids.includes(n)
        ? prev.shared_department_ids.filter((x) => x !== n)
        : [...prev.shared_department_ids, n],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/employee-plans/reports', {
        ...form,
        title: form.title.trim(),
        content: form.content.trim() || null,
        shared_department_ids: form.shared_department_ids,
      });
      setMessage({ type: 'success', text: 'Report created and shared with selected departments.' });
      setForm((prev) => ({ ...prev, title: '', content: '', shared_department_ids: [] }));
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
        <div>
          <p className={labelClass}>Share to departments</p>
          <div className="flex flex-wrap gap-2">
            {departments.map((d) => (
              <label
                key={d.id}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 cursor-pointer ${
                  form.shared_department_ids.includes(Number(d.id))
                    ? 'bg-[#2f5d31] text-white ring-[#2f5d31]'
                    : 'bg-gray-50 text-gray-700 ring-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.shared_department_ids.includes(Number(d.id))}
                  onChange={() => toggleDept(d.id)}
                />
                {d.name}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Create report'}
        </button>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">My reports</h3>
        <DataTable
          empty="No reports yet"
          columns={[
            { key: 'report_type', label: 'Type' },
            { key: 'title', label: 'Title' },
            { key: 'period', label: 'Period', value: (r) => `${String(r.period_start || '').slice(0, 10)} → ${String(r.period_end || '').slice(0, 10)}` },
            { key: 'created_at', label: 'Created', value: (r) => String(r.created_at || '').slice(0, 10) },
          ]}
          rows={reports}
        />
      </div>
    </div>
  );
}

export function EmployeePlansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const monitor = canMonitorPlans(user);
  const { departments } = useUsersAndDepartments();
  const tabs = useMemo(() => {
    const list = [
      { value: 'mine', label: 'My plans' },
      { value: 'collaborations', label: 'Collaborations' },
    ];
    if (monitor) list.push({ value: 'all', label: 'All' });
    return list;
  }, [monitor]);

  const [tab, setTab] = useState('mine');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [section, setSection] = useState('plans');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee-plans', { tab, limit: 200 });
      setItems(res.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load plans');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, [tab]);

  if (!hasPrivilege(user, 'menu.employee_plans') && !hasPrivilege(user, 'plans.manage')) {
    return (
      <PageHeading icon={<CalendarRange className="h-6 w-6" />} title="Employee Plans" subtitle="Access denied" showBack backTo="/dashboard" />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<CalendarRange className="h-6 w-6" />}
        title="Employee Plans"
        subtitle="Plan activities, collaborate, and generate shared reports"
        actions={[
          {
            label: showCreate ? 'Close form' : 'New plan',
            onClick: () => setShowCreate((v) => !v),
            icon: <Plus className="h-4 w-4" />,
          },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection('plans')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${section === 'plans' ? 'bg-[#2f5d31] text-white' : 'bg-white ring-1 ring-gray-200 text-gray-700'}`}
        >
          Plans
        </button>
        <button
          type="button"
          onClick={() => setSection('reports')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${section === 'reports' ? 'bg-[#2f5d31] text-white' : 'bg-white ring-1 ring-gray-200 text-gray-700'}`}
        >
          Reports
        </button>
        {monitor && (
          <Link
            to="/dashboard/staff-monitoring"
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-white ring-1 ring-gray-200 text-gray-700"
          >
            Staff monitoring
          </Link>
        )}
      </div>

      {section === 'reports' ? (
        <ReportGenerator departments={departments} />
      ) : (
        <>
          {showCreate && (
            <PlanForm
              onCancel={() => setShowCreate(false)}
              onSaved={(plan) => {
                setShowCreate(false);
                if (plan?.id) navigate(`/dashboard/employee-plans/${plan.id}`);
                else load();
              }}
            />
          )}

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
              </button>
            ))}
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
                label: 'Period',
                value: (r) => `${String(r.start_date || '').slice(0, 10)} → ${String(r.end_date || '').slice(0, 10)}`,
              },
              { key: 'status', label: 'Status', value: (r) => <StatusBadge value={r.status} /> },
              {
                key: 'joint',
                label: 'Joint',
                value: (r) => (r.is_joint ? `${(r.collaborators || []).length} collab.` : '—'),
              },
            ]}
            rows={items}
            renderActions={(row) => (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31]"
                onClick={() => navigate(`/dashboard/employee-plans/${row.id}`)}
              >
                <Eye className="h-4 w-4" /> Open
              </button>
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
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`/employee-plans/${id}/comments`, { comment: comment.trim() });
      setComment('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this plan?')) return;
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
        actions={isOwner ? [
          { label: editing ? 'Close edit' : 'Edit', onClick: () => setEditing((v) => !v) },
          { label: 'Delete', onClick: remove, variant: 'danger' },
        ] : []}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {editing ? (
        <PlanForm
          initial={plan}
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
                {plan.is_joint ? <span className="text-xs rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5">Joint</span> : null}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.description || 'No description'}</p>
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                <div><dt className="text-gray-500">Owner</dt><dd className="font-medium">{plan.owner?.names || '—'}</dd></div>
                <div><dt className="text-gray-500">Period</dt><dd className="font-medium">{String(plan.start_date || '').slice(0, 10)} → {String(plan.end_date || '').slice(0, 10)}</dd></div>
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
              <h3 className="text-sm font-semibold text-gray-800">Comments</h3>
              <ul className="space-y-3">
                {(plan.comments || []).map((c) => (
                  <li key={c.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-800">{c.author?.names || 'User'}</span>
                      <span>{String(c.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-gray-700">{c.comment}</p>
                  </li>
                ))}
              </ul>
              <form onSubmit={addComment} className="space-y-2">
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                />
                <button type="submit" disabled={saving || !comment.trim()} className="rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Post comment
                </button>
              </form>
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

            {(isOwner || canMonitorPlans(user)) && (
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 space-y-2">
                <p className="text-sm font-semibold text-gray-800">Update status</p>
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
  const { user } = useAuth();
  const allowed = canMonitorPlans(user) || hasPrivilege(user, 'menu.staff_monitoring');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employee-plans/monitoring', {
        period_start: periodStart,
        period_end: periodEnd,
      });
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load monitoring data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load().catch(() => {});
  }, [allowed]);

  if (!allowed) {
    return <PageHeading icon={<BarChart3 className="h-6 w-6" />} title="Staff Monitoring" subtitle="Access denied" showBack backTo="/dashboard" />;
  }

  const statusCounts = data?.status_counts || {};
  const maxStatus = Math.max(1, ...Object.values(statusCounts).map(Number));
  const ranking = data?.ranking || [];

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<BarChart3 className="h-6 w-6" />}
        title="Staff Monitoring"
        subtitle="Plans completion, login activity, and report sharing"
        showBack
        backTo="/dashboard/employee-plans"
        actions={[
          {
            label: 'Export ranking CSV',
            onClick: () => exportCsv('staff-plan-ranking', [
              { key: 'rank', label: 'Rank' },
              { key: 'names', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'completed_plans', label: 'Completed' },
              { key: 'plan_count', label: 'Plans' },
              { key: 'last_login_at', label: 'Last login' },
            ], ranking),
          },
        ]}
      />

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
        <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">Apply</button>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Staff" value={data.totals?.staff} />
            <StatCard label="With plans" value={data.totals?.with_plans} />
            <StatCard label="Without plans" value={data.totals?.without_plans} />
            <StatCard label="Plans in period" value={data.totals?.plans} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Status counts</h3>
              <div className="space-y-2">
                {Object.entries(statusCounts).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="capitalize">{key}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#2f5d31]" style={{ width: `${(Number(value) / maxStatus) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Completion ranking</h3>
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-wide text-gray-400 sticky top-0 bg-white">
                    <tr>
                      <th className="py-2">#</th>
                      <th>Name</th>
                      <th>Done</th>
                      <th>Last login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ranking.slice(0, 40).map((row) => (
                      <tr key={row.id}>
                        <td className="py-2">{row.rank}</td>
                        <td>{row.names}</td>
                        <td>{row.completed_plans}/{row.plan_count}</td>
                        <td className="text-xs text-gray-500">{row.last_login_at ? String(row.last_login_at).slice(0, 16).replace('T', ' ') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Staff without plans</h3>
              <DataTable
                empty="Everyone has plans"
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
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#2f5d31]">{value ?? 0}</p>
    </div>
  );
}

export default {
  EmployeePlansPage,
  EmployeePlanDetailPage,
  StaffMonitoringPage,
};
