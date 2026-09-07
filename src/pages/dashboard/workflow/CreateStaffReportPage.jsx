import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePen, FileText, List, Paperclip, X } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import { useNotifyPriorityModal } from '../../../components/ui/NotifyPriorityModal';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useStaffOptions } from './helpers';
import { REPORT_TYPES } from './reportConstants';

export default function CreateStaffReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments, users: allUsers } = useStaffOptions();
  const { askNotifyPriority, modal: notifyModal } = useNotifyPriorityModal();
  const [departmentId, setDepartmentId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: '',
    content: '',
    time_from: '',
    time_to: '',
    location: '',
    period_start: '',
    period_end: '',
  });

  const departmentUsers = useMemo(() => {
    let list = allUsers.filter((item) => Number(item.id) !== Number(user?.id));
    if (departmentId === '0') {
      list = list.filter((item) => !item.department_ID && !item.department_id);
    } else if (departmentId) {
      list = list.filter((item) => String(item.department_ID || item.department_id || item.department?.id) === String(departmentId));
    }
    return list.sort((a, b) => String(a.names).localeCompare(String(b.names)));
  }, [allUsers, departmentId, user?.id]);

  const selectedUsers = useMemo(
    () => allUsers.filter((item) => selectedIds.includes(Number(item.id))),
    [allUsers, selectedIds]
  );

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => departmentUsers.some((item) => Number(item.id) === id)));
  }, [departmentUsers]);

  const toggleUser = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = (checked) => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !departmentUsers.some((item) => Number(item.id) === id)));
      return;
    }
    const ids = departmentUsers.map((item) => Number(item.id));
    setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
  };

  const removeRecipient = (id) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.type || !form.content.trim()) {
      setError('Title, type, and content are required.');
      return;
    }
    let priority = '';
    if (selectedIds.length) {
      priority = await askNotifyPriority({
        title: 'Notify report recipients as',
        subtitle: 'Choose how this shared report should appear in their notification alerts.',
        confirmLabel: 'Create & notify',
      });
      if (!priority) return;
    }
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      data.append('type', form.type);
      data.append('content', form.content);
      if (form.time_from) data.append('time_from', form.time_from);
      if (form.time_to) data.append('time_to', form.time_to);
      if (form.location.trim()) data.append('location', form.location.trim());
      if (form.period_start) data.append('period_start', form.period_start);
      if (form.period_end) data.append('period_end', form.period_end);
      if (priority) data.append('priority', priority);
      data.append('recipient_ids', JSON.stringify(selectedIds));
      attachments.forEach((file) => data.append('attachments', file));
      const res = await api.upload('post', '/reports', data);
      navigate(`/dashboard/reports/${res.data?.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading
        icon={<FilePen className="h-6 w-6" />}
        title="Create New Report"
        subtitle="Create a new staff report"
        showBack
        backTo="/dashboard/reports"
        actions={[
          { label: 'Report List', variant: 'secondary', icon: <List className="h-4 w-4" />, onClick: () => navigate('/dashboard/reports') },
          { label: 'Membership Reports', variant: 'secondary', icon: <FileText className="h-4 w-4" />, onClick: () => navigate('/dashboard/membership-reports') },
        ]}
      />

      <form onSubmit={submit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 md:grid-cols-12">
          <label className={`${labelClass} md:col-span-8`}>
            Title <span className="text-red-500">*</span>
            <input required className={`mt-1 ${inputClass}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Report title..." />
          </label>
          <label className={`${labelClass} md:col-span-4`}>
            Type <span className="text-red-500">*</span>
            <select required className={`mt-1 ${inputClass}`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Select type</option>
              {REPORT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className={`${labelClass} md:col-span-3`}>
            Time From
            <input type="time" className={`mt-1 ${inputClass}`} value={form.time_from} onChange={(e) => setForm({ ...form, time_from: e.target.value })} />
          </label>
          <label className={`${labelClass} md:col-span-3`}>
            Time To
            <input type="time" className={`mt-1 ${inputClass}`} value={form.time_to} onChange={(e) => setForm({ ...form, time_to: e.target.value })} />
          </label>
          <label className={`${labelClass} md:col-span-6`}>
            Location
            <input className={`mt-1 ${inputClass}`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kigali Office, Nyamirambo field..." />
          </label>
          <label className={`${labelClass} md:col-span-6`}>
            Period Start
            <input type="date" className={`mt-1 ${inputClass}`} value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
          </label>
          <label className={`${labelClass} md:col-span-6`}>
            Period End
            <input type="date" className={`mt-1 ${inputClass}`} value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
          </label>
        </div>

        <div>
          <label className={labelClass}>
            Content / Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={8}
            className={`mt-1 min-h-[160px] ${inputClass}`}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write the main content of the report here..."
          />
        </div>

        <div className="rounded-xl ring-1 ring-gray-200 p-4">
          <h3 className="mb-4 font-semibold text-gray-900">Select Recipients</h3>
          <div className="grid gap-4 lg:grid-cols-12">
            <label className={`${labelClass} lg:col-span-3`}>
              Department
              <select className={`mt-1 ${inputClass}`} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">All Departments</option>
                <option value="0">No Department</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <div className="lg:col-span-5">
              <p className={labelClass}>Select Users</p>
              <div className="mt-1 max-h-52 overflow-y-auto rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={departmentUsers.length > 0 && departmentUsers.every((item) => selectedIds.includes(Number(item.id)))} onChange={(e) => toggleAll(e.target.checked)} />
                  Select All
                </label>
                <div className="space-y-1 border-t border-gray-200 pt-2">
                  {departmentUsers.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 hover:bg-white">
                      <input type="checkbox" checked={selectedIds.includes(Number(item.id))} onChange={() => toggleUser(Number(item.id))} />
                      <span className="text-sm text-gray-800">
                        {item.names}
                        <span className="block text-xs text-gray-500">{item.role}{item.department?.name ? ` · ${item.department.name}` : ''}</span>
                      </span>
                    </label>
                  ))}
                  {!departmentUsers.length && <p className="text-sm text-gray-500">No users in this department.</p>}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <p className={labelClass}>Selected Recipients</p>
              <div className="mt-1 min-h-[8rem] rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                {!selectedUsers.length && <p className="text-sm italic text-gray-500">No recipients selected yet</p>}
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((item) => (
                    <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700">
                      {item.names}
                      <button type="button" onClick={() => removeRecipient(Number(item.id))} className="text-sky-900"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Attachments
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
              <Paperclip size={16} />
              Add files
              <input type="file" multiple className="hidden" onChange={(e) => setAttachments(Array.from(e.target.files || []))} />
            </label>
            {attachments.map((file, index) => (
              <span key={`${file.name}-${index}`} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{file.name}</span>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-5 py-2.5 font-medium text-white disabled:opacity-60">
            {saving ? 'Submitting...' : 'Create Report'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/reports')} className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700">
            Cancel
          </button>
        </div>
      </form>
      {notifyModal}
    </div>
  );
}
