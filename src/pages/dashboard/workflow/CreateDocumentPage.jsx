import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';

export default function CreateDocumentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', type: '', custom_type: '', description: '' });
  const [types, setTypes] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/documents/types').then((res) => {
      setTypes(res.data || []);
    }).catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setSaving(true);
    setError('');
    const data = new FormData();
    data.append('title', form.title);
    data.append('type', form.type === 'custom' ? form.custom_type : form.type);
    data.append('custom_type', form.custom_type);
    data.append('description', form.description);
    data.append('document_file', file);
    try {
      await api.upload('post', '/documents', data);
      navigate('/dashboard/documents');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading icon={<FileUp className="h-6 w-6" />} title="Upload New Document" subtitle="Upload and share a new document" showBack backTo="/dashboard/documents" />
      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-4 max-w-xl">
        <label className={labelClass}>Document Title *
          <input required className={`mt-1 ${inputClass}`} placeholder="Enter document title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className={labelClass}>Document Type *
          <select required className={`mt-1 ${inputClass}`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="">Select document type</option>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
            <option value="custom">Other (Specify)</option>
          </select>
        </label>
        {form.type === 'custom' && (
          <label className={labelClass}>Custom Type *
            <input required className={`mt-1 ${inputClass}`} placeholder="Enter custom document type" value={form.custom_type} onChange={(e) => setForm({ ...form, custom_type: e.target.value })} />
          </label>
        )}
        <label className={labelClass}>Description
          <textarea className={`mt-1 min-h-24 ${inputClass}`} placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className={labelClass}>Upload Document *
          <input type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx" className={`mt-1 ${inputClass}`} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOCX, XLSX, DOC, XLS (Max 10MB)</p>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="bg-[#2f5d31] text-white px-5 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : 'Upload document'}</button>
      </form>
    </div>
  );
}
