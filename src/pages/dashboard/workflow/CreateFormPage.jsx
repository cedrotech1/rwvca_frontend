import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPen } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import { useNotifyPriorityModal } from '../../../components/ui/NotifyPriorityModal';
import { stripClipboardArtifacts } from '../../../utils/sanitize';
import { useStaffOptions } from './helpers';

export default function CreateFormPage({
  title,
  subtitle,
  apiPath,
  successTo,
  fields,
  extraSubmit,
  beforeSubmit,
  submitLabel = 'Submit Request',
  useMultipart = false,
  notifyOnSubmit = true,
  notifyTitle,
  notifySubtitle,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const options = useStaffOptions();
  const { askNotifyPriority, modal: notifyModal } = useNotifyPriorityModal();
  const [form, setForm] = useState(() => {
    const values = {};
    fields.forEach((field) => {
      if (field.default !== undefined) values[field.name] = field.default;
    });
    return values;
  });
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setValue = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const visible = (field) => {
    if (!field.showIf) return true;
    return String(form[field.showIf.name] || '') === String(field.showIf.value);
  };

  const visibleFields = fields;

  const sendPayload = async (payload) => {
    const hasFiles = Object.keys(files).length > 0 || useMultipart;
    if (hasFiles) {
      const data = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) => data.append(`${key}[]`, item));
          data.append(key, value.join(','));
        } else {
          data.append(key, value);
        }
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });
      await api.upload('post', apiPath, data);
    } else {
      await api.post(apiPath, payload);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      let payload = beforeSubmit ? beforeSubmit({ ...form }, options, user) : { ...form };
      if (extraSubmit) Object.assign(payload, extraSubmit(form, options));

      if (notifyOnSubmit) {
        const priority = await askNotifyPriority({
          title: notifyTitle || 'Send notification as',
          subtitle: notifySubtitle || 'Recipients will see this priority in their header alerts.',
          confirmLabel: submitLabel,
        });
        if (!priority) return;
        payload = { ...payload, priority };
      }

      setSaving(true);
      await sendPayload(payload);
      navigate(successTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading icon={<ClipboardPen className="h-6 w-6" />} title={title} subtitle={subtitle} showBack backTo={successTo} />
      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-4 max-w-4xl">
        <div className="grid sm:grid-cols-2 gap-4">
          {visibleFields.map((field) => {
            if (!visible(field)) return null;
            const value = form[field.name] ?? '';
            const selectOptions = field.options
              || (field.optionsKey === 'departments'
                ? options.departments.map((item) => ({ value: item.id, label: item.name }))
                : field.optionsKey === 'users'
                  ? options.users.map((item) => ({ value: item.id, label: `${item.names} (${item.role})` }))
                  : []);
            const span = field.width === 'full' || field.type === 'textarea' || field.type === 'multiselect' ? 'sm:col-span-2' : '';
            const readonlyValue = field.type === 'readonly-user'
              ? (user?.names || '')
              : field.type === 'readonly-email'
                ? (user?.email || '')
                : field.type === 'readonly-department'
                  ? (user?.department?.name || user?.department_name || '')
                  : null;

            return (
              <div key={field.name} className={span}>
                <label className={labelClass}>
                  {field.label}{field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`${inputClass} min-h-28`}
                    value={value}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData?.getData('text/plain') || '';
                      const cleaned = stripClipboardArtifacts(pasted);
                      if (cleaned === pasted) return;
                      e.preventDefault();
                      const el = e.currentTarget;
                      const start = el.selectionStart ?? el.value.length;
                      const end = el.selectionEnd ?? el.value.length;
                      const next = `${el.value.slice(0, start)}${cleaned}${el.value.slice(end)}`;
                      setValue(field.name, next);
                    }}
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    className={inputClass}
                    value={value}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  >
                    <option value="">{field.placeholder || 'Select'}</option>
                    {selectOptions.filter((option) => option.value !== '').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'multiselect' ? (
                  <select
                    required={field.required}
                    multiple
                    className={`${inputClass} min-h-40`}
                    value={Array.isArray(value) ? value : value ? [value] : []}
                    onChange={(e) => setValue(field.name, Array.from(e.target.selectedOptions).map((opt) => opt.value))}
                  >
                    {selectOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <input
                    required={field.required}
                    type="file"
                    accept={field.accept}
                    className={inputClass}
                    onChange={(e) => setFiles((prev) => ({ ...prev, [field.name]: e.target.files?.[0] || null }))}
                  />
                ) : readonlyValue !== null || field.readOnly ? (
                  <input readOnly className={`${inputClass} bg-gray-100`} value={readonlyValue ?? value} />
                ) : (
                  <input
                    required={field.required}
                    type={field.type || 'text'}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    className={inputClass}
                    value={value}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  />
                )}
                {field.hint && <p className="text-xs text-gray-500 mt-1">{field.hint}</p>}
              </div>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="bg-[#2f5d31] text-white px-5 py-2.5 rounded-lg font-medium">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </form>
      {notifyModal}
    </div>
  );
}
