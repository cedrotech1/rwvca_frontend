import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Download, FileText, MessageSquareReply, Paperclip, Send, Trash2 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { inputClass } from '../../../components/ui/dataUi';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import api from '../../../services/api';
import { downloadProtectedFile } from '../../../services/api/config';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationsContext';
import { sanitizeHtml } from '../../../utils/sanitize';
import { formatPhpDate, formatPhpDateTime } from './helpers';
import { reportTypeLabel } from './reportConstants';

const THREAD_STYLES = [
  { bg: 'bg-green-50', border: 'border-[#2f5d31]', badge: 'bg-[#2f5d31]' },
  { bg: 'bg-emerald-50', border: 'border-emerald-500', badge: 'bg-emerald-500' },
  { bg: 'bg-amber-50', border: 'border-amber-500', badge: 'bg-amber-500' },
  { bg: 'bg-amber-50', border: 'border-[#6b4423]', badge: 'bg-[#6b4423]' },
  { bg: 'bg-teal-50', border: 'border-teal-500', badge: 'bg-teal-500' },
  { bg: 'bg-orange-50', border: 'border-orange-500', badge: 'bg-orange-500' },
];

function CommentNode({ node, depth, reportId, onReply, saving }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const style = THREAD_STYLES[depth % THREAD_STYLES.length];

  const submitReply = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    await onReply({ content, parent_id: node.id });
    setContent('');
    setOpen(false);
  };

  return (
    <div id={`comment-${node.id}`} className="mb-3" style={{ marginLeft: Math.min(depth * 24, 120) }}>
      <div className={`rounded-lg border-l-4 ${style.border} ${style.bg} p-4 shadow-sm`}>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">{node.creator?.names || node.author || 'User'}</p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${style.badge}`}>
              {depth === 0 ? 'Top Reply' : depth === 1 ? 'Reply' : `Nested Reply (L${depth})`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatPhpDateTime(node.created_at)}</span>
            <button type="button" onClick={() => setOpen((prev) => !prev)} className="rounded-full border border-current px-2 py-0.5 text-[11px] font-medium text-gray-700">
              Reply
            </button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: sanitizeHtml(node.content) }} />

        {open && (
          <form onSubmit={submitReply} className="mt-3 border-t border-dashed border-gray-300 pt-3">
            <p className="mb-2 text-xs text-gray-500">
              Replying to <strong>{node.creator?.names || node.author}</strong>
            </p>
            <textarea
              required
              rows={3}
              className={inputClass}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reply..."
            />
            <div className="mt-2 flex gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                <Send size={14} /> Send
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {node.children?.length > 0 && (
        <div className="mt-2 border-l border-dashed border-gray-300 pl-2">
          {node.children.map((child) => (
            <CommentNode key={child.id} node={child} depth={depth + 1} reportId={reportId} onReply={onReply} saving={saving} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const tab = searchParams.get('tab') || 'my';

  const load = async () => {
    const res = await api.get(`/reports/${id}`);
    setItem(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Could not load report'));
    if (window.location.hash.startsWith('#comment-')) {
      setTimeout(() => {
        document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [id]);

  const afterChange = async () => {
    await load();
    fetchNotifications?.().catch(() => {});
  };

  const submitReply = async ({ content, parent_id = null }) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/reports/${id}/comments`, { content, parent_id });
      await afterChange();
      if (!parent_id) setReply('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add reply');
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async () => {
    setSaving(true);
    setError('');
    try {
      await api.del(`/reports/${id}`);
      navigate(`/dashboard/reports?tab=${tab}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete report');
    } finally {
      setSaving(false);
      setShowDelete(false);
    }
  };

  if (!item && !error) return <DetailPageSkeleton />;

  return (
    <div>
      <PageHeading icon={<FileText className="h-6 w-6" />} title={item?.title || `Report #${id}`} subtitle="View report details and feedback" showBack backTo={`/dashboard/reports?tab=${tab}`} />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {item && (
        <>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Report #{item.id}</p>
                <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-[#6b4423]">{reportTypeLabel(item.type)}</span>
                {item.can_delete && (
                  <button type="button" onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white">
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 grid gap-4 text-sm text-gray-600 md:grid-cols-3">
              <div>
                <p><strong>Created by:</strong> {item.creator_name || item.creator?.names || '—'}</p>
                <p><strong>Date:</strong> {formatPhpDateTime(item.created_at)}</p>
              </div>
              {(item.period_start || item.period_end) && (
                <div>
                  <p><strong>Period:</strong> {formatPhpDate(item.period_start)} to {item.period_end ? formatPhpDate(item.period_end) : 'Ongoing'}</p>
                </div>
              )}
              {(item.time_from || item.time_to) && (
                <div>
                  <p><strong>Time:</strong> {item.time_from || '—'} - {item.time_to || '—'}</p>
                </div>
              )}
              {item.location && (
                <div>
                  <p><strong>Location:</strong> {item.location}</p>
                </div>
              )}
            </div>

            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="mb-2 font-semibold text-gray-900">Content</h3>
              <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }} />
            </div>

            {item.recipients?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900">Shared With</h3>
                <div className="divide-y divide-gray-100 rounded-xl ring-1 ring-gray-200">
                  {item.recipients.map((rec) => (
                    <div key={rec.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{rec.recipient_name || 'Recipient'}</p>
                        <p className="text-xs text-gray-500">{rec.dept_name || rec.recipient_role || rec.recipient_type}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{formatPhpDateTime(rec.assigned_at)}</p>
                        {Number(rec.read_status) === 1
                          ? <span className="font-medium text-emerald-600">Read</span>
                          : <span className="font-medium text-rose-600">Unread</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.attachments?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900">Attachments ({item.attachments.length})</h3>
                <div className="divide-y divide-gray-100 rounded-xl ring-1 ring-gray-200">
                  {item.attachments.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => downloadProtectedFile(att.file_path, att.file_name || 'attachment')}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="inline-flex items-center gap-2 text-sm text-gray-800">
                        <Paperclip size={16} className="text-[#2f5d31]" />
                        {att.file_name}
                        {att.file_size ? <span className="text-xs text-gray-500">({Math.round(Number(att.file_size) / 1024)} KB)</span> : null}
                      </span>
                      <Download size={16} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <MessageSquareReply size={18} />
                Replies ({item.comments_flat?.length || 0})
              </h3>

              {item.comment_tree?.length ? (
                item.comment_tree.map((node) => (
                  <CommentNode key={node.id} node={node} depth={0} reportId={id} onReply={submitReply} saving={saving} />
                ))
              ) : (
                <p className="mb-4 text-sm italic text-gray-500">No replies yet. Be the first to reply below.</p>
              )}

              <div className="mt-4 rounded-xl border-2 border-[#2f5d31] bg-white">
                <div className="rounded-t-xl bg-[#2f5d31] px-4 py-3 text-white">
                  <strong>Add a Reply</strong>
                  <span className="ml-2 text-xs opacity-80">(top-level — not replying to a specific message)</span>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitReply({ content: reply });
                  }}
                  className="p-4"
                >
                  <textarea
                    required
                    rows={4}
                    className={inputClass}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply here..."
                  />
                  <div className="mt-3 flex gap-2">
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                      <Send size={16} /> Send Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <ConfirmationModal
            isOpen={showDelete}
            onClose={() => setShowDelete(false)}
            onConfirm={deleteReport}
            title="Delete Report"
            message={`Delete "${item.title}" permanently? This cannot be undone.`}
            type="delete"
            loading={saving}
          />
        </>
      )}
    </div>
  );
}
