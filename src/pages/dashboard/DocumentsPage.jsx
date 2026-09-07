import { useEffect, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';
import api from '../../services/api';
import { openProtectedFile } from '../../services/api/config';

export default function DocumentsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'general', description: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/documents', { limit: 50 });
    setItems(res.data?.items || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    const data = new FormData();
    data.append('title', form.title);
    data.append('type', form.type);
    data.append('description', form.description);
    data.append('document_file', file);
    try {
      await api.upload('post', '/documents', data);
      setOpen(false);
      setForm({ title: '', type: 'general', description: '' });
      setFile(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <PageHeading
        title="Documents"
        subtitle="Manage and organize all documents in one place"
        icon={<FolderOpen className="h-6 w-6" />}
        actions={[{ label: 'Upload', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => setOpen(true) }]}
      />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-[#2f5d31] underline"
                    onClick={() => openProtectedFile(`/documents/${row.id}/file`).catch((err) => setError(err.message || 'Could not open file'))}
                  >
                    Open file
                  </button>
                </td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No documents</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-3">
            <h2 className="text-lg font-bold">Upload document</h2>
            <input className="w-full border rounded px-3 py-2" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="w-full border rounded px-3 py-2" placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded border" onClick={() => setOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-[#2f5d31] text-white">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
