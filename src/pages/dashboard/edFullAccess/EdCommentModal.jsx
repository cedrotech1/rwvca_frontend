import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import api from '../../../services/api';
import { formatPhpDateTime } from '../workflow/helpers';

function escapeText(value) {
  return String(value ?? '');
}

export default function EdCommentModal({ open, module, recordId, recordLabel, onClose }) {
  const [comments, setComments] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [label, setLabel] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [message, setMessage] = useState('');
  const [parentId, setParentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = async () => {
    if (!module || !recordId) return;
    setLoading(true);
    try {
      const res = await api.get('/ed-full-access/comments', { module, record_id: recordId });
      const data = res.data || {};
      setComments(data.comments || []);
      setLabel(data.label || recordLabel || '');
      setNotifyTitle(data.default_title || '');
      const recs = data.recipients || [];
      setRecipients(recs);
      setSelectedIds(new Set(recs.filter((r) => r.suggested).map((r) => r.id)));
      setStatus('');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setParentId(null);
      setMessage('');
      setSearch('');
      setSearchResults([]);
      load().catch(() => {});
    }
  }, [open, module, recordId]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get('/ed-full-access/search-users', { q: search.trim() })
        .then((res) => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const recipientRows = useMemo(() => {
    const map = new Map(recipients.map((r) => [r.id, r]));
    searchResults.forEach((u) => {
      if (!map.has(u.id)) map.set(u.id, { ...u, involvement: 'Added manually', suggested: false });
    });
    return Array.from(map.values());
  }, [recipients, searchResults]);

  const toggleRecipient = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(recipientRows.map((r) => r.id)));
  const clearAll = () => setSelectedIds(new Set());

  const startReply = (comment) => {
    setParentId(comment.id);
    setNotifyTitle(`Reply on ${label}`);
    api.get('/ed-full-access/recipients', { module, record_id: recordId, parent_id: comment.id })
      .then((res) => {
        const recs = res.data?.recipients || [];
        setRecipients(recs);
        setSelectedIds(new Set(recs.filter((r) => r.suggested).map((r) => r.id)));
      })
      .catch(() => {});
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    if (!selectedIds.size) {
      setStatus('Select at least one person to notify.');
      return;
    }
    if (!notifyTitle.trim()) {
      setStatus('Enter a notification title.');
      return;
    }
    setSaving(true);
    setStatus('Posting...');
    try {
      const res = await api.post('/ed-full-access/comments', {
        module,
        record_id: recordId,
        message,
        notify_title: notifyTitle,
        parent_id: parentId,
        notify_ids: Array.from(selectedIds),
      });
      const data = res.data || {};
      setMessage('');
      setParentId(null);
      setStatus(data.warning || (data.notified_count ? `Notified ${data.notified_count} staff.` : 'Posted.'));
      await load();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Could not post note.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-lg border border-[#c5d4c8] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#c5d4c8] bg-[#025016] px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5" />
            Module Notes — {label || recordLabel || 'Record'}
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 max-h-72 overflow-y-auto rounded border border-[#d8e3dc] bg-[#fafcfb] p-3 text-sm">
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : comments.length ? (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`mb-2 border border-[#d8e3dc] bg-white p-3 ${c.parent_id ? 'ml-6 border-l-4 border-l-[#025016]' : ''}`}
                >
                  <div className="mb-1 text-xs text-gray-500">
                    <strong>{escapeText(c.author_name)}</strong> ({escapeText(c.author_role)}) · {formatPhpDateTime(c.created_at)}
                  </div>
                  <p className="text-gray-800">{escapeText(c.message)}</p>
                  {!c.parent_id && (
                    <button type="button" onClick={() => startReply(c)} className="mt-2 text-xs font-medium text-[#025016]">
                      Reply
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No notes yet.</p>
            )}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="rounded border border-[#c5d4c8] bg-[#f9fbf9] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-gray-800">
                  {parentId ? 'Reply to note' : 'Notify staff'}
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="rounded border border-gray-300 px-2 py-1 text-xs">Select all</button>
                  <button type="button" onClick={clearAll} className="rounded border border-gray-300 px-2 py-1 text-xs">Clear</button>
                  {parentId && (
                    <button type="button" onClick={() => { setParentId(null); load(); }} className="rounded border border-gray-300 px-2 py-1 text-xs">
                      Cancel reply
                    </button>
                  )}
                </div>
              </div>
              <input
                className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="Notification title"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                required
              />
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#eef3ef] text-left">
                      <th className="p-2 w-8" />
                      <th className="p-2">Name</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Involvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipientRows.length ? recipientRows.map((r) => (
                      <tr key={r.id} className="border-t border-gray-200">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleRecipient(r.id)}
                          />
                        </td>
                        <td className="p-2 font-medium">{r.names}</td>
                        <td className="p-2">{r.role}</td>
                        <td className="p-2 text-gray-600">{r.email || '—'}</td>
                        <td className="p-2 text-gray-500">{r.involvement || ''}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-3 text-center text-gray-500">No suggested recipients. Search below to add staff.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-2">
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Search by name, email, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">Your note</label>
              <textarea
                className="min-h-24 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your comment or instruction..."
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Post & notify selected
              </button>
              {status && <span className="text-sm text-gray-600">{status}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
