import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StickyNote } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import CreateFormPage from './CreateFormPage';
import ListPage from './ListPage';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';

export function EdNotesListPage() {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const canCreate = role === 'ed' || role === 'admin';
  return (
    <ListPage
      title="ED Notes"
      subtitle="Notes from Executive Director"
      apiPath="/ed-notes"
      openTo="/dashboard/ed-notes"
      createTo={canCreate ? '/dashboard/create/ed-notes' : undefined}
      createLabel="Create ED note"
      columns={[
        { key: 'module_type', label: 'Module' },
        { key: 'record_id', label: 'Record' },
        { key: 'message', label: 'ED Note' },
        { key: 'user.names', label: 'From' },
        { key: 'created_at', label: 'Date', format: 'datetime' },
        { key: 'recipients', label: 'Notified', format: 'count' },
        { key: 'replies', label: 'Staff reply', format: 'count' },
      ]}
    />
  );
}

export function EdNotesCreatePage() {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  if (role !== 'ed' && role !== 'admin') {
    return <p className="p-8">Only the Executive Director can create ED notes.</p>;
  }
  return (
    <CreateFormPage
      title="Create ED Note"
      apiPath="/ed-notes"
      successTo="/dashboard/ed-notes"
      submitLabel="Submit Request"
      fields={[
        { name: 'module_type', label: 'Module', required: true },
        { name: 'record_id', label: 'Record', type: 'number', required: true },
        { name: 'message', label: 'ED Note', type: 'textarea', required: true, width: 'full' },
        { name: 'recipient_ids', label: 'Select Recipients', type: 'multiselect', optionsKey: 'users', required: true, width: 'full' },
      ]}
      beforeSubmit={(form) => ({
        ...form,
        recipient_ids: Array.isArray(form.recipient_ids) ? form.recipient_ids.map(Number) : (form.recipient_ids ? [Number(form.recipient_ids)] : []),
      })}
    />
  );
}

export function EdNoteDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get(`/ed-notes/${id}`);
    setItem(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  const send = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/ed-notes/${id}/replies`, { message: reply });
      setReply('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Reply failed');
    }
  };

  if (!item && !error) return <DetailPageSkeleton />;

  return (
    <div>
      <PageHeading icon={<StickyNote className="h-6 w-6" />} title={`ED Note #${id}`} subtitle="View ED note details and responses" showBack backTo="/dashboard/ed-notes" />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {item && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <p className="text-gray-500">Module</p><p className="sm:col-span-2">{item.module_type}</p>
            <p className="text-gray-500">Record</p><p className="sm:col-span-2">{item.record_id}</p>
            <p className="text-gray-500">From</p><p className="sm:col-span-2">{item.user?.names}</p>
            <p className="text-gray-500">Date</p><p className="sm:col-span-2">{item.created_at}</p>
          </div>
          <p className="whitespace-pre-wrap">{item.message}</p>
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold">Staff reply</h3>
            {(item.replies || []).map((row) => (
              <div key={row.id} className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500">{row.user?.names}</p>
                <p>{row.message}</p>
              </div>
            ))}
            {!item.replies?.length && <p className="text-sm text-gray-500">No replies yet.</p>}
          </div>
          <form onSubmit={send} className="space-y-2">
            <label className="text-sm font-medium">Your reply to ED</label>
            <textarea required className="w-full rounded-lg border-0 bg-gray-50 ring-1 ring-inset ring-gray-200 px-3 py-2.5 min-h-24 focus:outline-none focus:ring-2 focus:ring-[#2f5d31]" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your response..." />
            <button className="bg-[#2f5d31] text-white px-4 py-2 rounded">Send reply</button>
          </form>
        </div>
      )}
    </div>
  );
}
