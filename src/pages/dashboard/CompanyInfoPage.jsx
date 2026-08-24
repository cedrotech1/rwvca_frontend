import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import { inputClass, labelClass } from '../../components/ui/dataUi';
import api from '../../services/api';
import { fileUrl } from '../../services/api/config';

const FIELDS = [
  { name: 'company_name', label: 'Company name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', required: true },
  { name: 'address', label: 'Address', type: 'textarea', required: true },
  { name: 'website', label: 'Website' },
  { name: 'facebook', label: 'Facebook' },
  { name: 'twitter', label: 'Twitter' },
  { name: 'instagram', label: 'Instagram' },
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'youtube', label: 'YouTube' },
];

export default function CompanyInfoPage() {
  const [form, setForm] = useState({});
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await api.get('/company');
    const data = res.data || {};
    setForm(data);
    setPreview(data.logo ? fileUrl(data.logo) : '');
  };

  useEffect(() => {
    load()
      .catch((err) => setError(err.response?.data?.message || 'Could not load company info'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = new FormData();
      FIELDS.forEach((field) => {
        if (form[field.name] !== undefined && form[field.name] !== null) data.append(field.name, form[field.name]);
      });
      if (logo) data.append('logo', logo);
      await api.upload('put', '/company', data);
      await load();
      setLogo(null);
      setMessage('Company information saved. Public footer and contact details use this record.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save company information');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading title="Company information" subtitle="Public contact details, social links, and logo." icon={<Building2 className="h-6 w-6" />} />
      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <form onSubmit={save} className="max-w-3xl space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className={labelClass}>{field.label}{field.required ? ' *' : ''}</label>
                {field.type === 'textarea' ? (
                  <textarea required={field.required} className={inputClass} value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                ) : (
                  <input required={field.required} type={field.type || 'text'} className={inputClass} value={form[field.name] || ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <div>
            <label className={labelClass}>Logo</label>
            {preview && <img src={preview} alt="Logo" className="mb-2 h-16 object-contain" />}
            <input type="file" accept="image/*" className={inputClass} onChange={(e) => setLogo(e.target.files?.[0] || null)} />
          </div>
          <div className="flex justify-end">
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
