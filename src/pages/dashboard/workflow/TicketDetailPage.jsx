import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, MessageSquare, Paperclip, Send, UserPlus, XCircle } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationsContext';
import api from '../../../services/api';
import { fileUrl } from '../../../services/api/config';
import { StatusBadge, inputClass, labelClass } from '../../../components/ui/dataUi';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { formatPhpDate, formatPhpDateTime } from './helpers';
import { canSeeAllTicketsTab } from '../../../utils/rwvcaAccess';

function attachmentName(item) {
  return item?.name || item?.stored_path?.split('/').pop() || 'Attachment';
}

function statusMessage(value) {
  const map = {
    open: 'Ticket reopened',
    in_progress: 'Ticket marked as in progress',
    pending: 'Ticket pending',
    resolved: 'Ticket resolved',
    closed: 'Ticket closed',
  };
  return map[value] || `Status changed to ${value}`;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">Close</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [item, setItem] = useState(null);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [replyFile, setReplyFile] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = async () => {
    const res = await api.get(`/tickets/${id}`);
    setItem(res.data);
    setAssignTo(String(res.data?.assigned_to || ''));
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Could not load ticket'));
    api.get('/users', { limit: 200, active: 1 }).then((res) => setStaff(res.data?.items || [])).catch(() => {});
  }, [id]);

  const canAccess = item && (
    Number(item.created_by) === Number(user?.id)
    || Number(item.assigned_to) === Number(user?.id)
    || canSeeAllTicketsTab(user?.role)
  );
  const canManage = canSeeAllTicketsTab(user?.role);
  const canUpdateStatus = item && (
    Number(item.assigned_to) === Number(user?.id)
    || canManage
    || (Number(item.created_by) === Number(user?.id) && Number(item.assigned_to) === Number(user?.id))
  );
  const canDelete = item && (
    canManage
    || (
      Number(item.created_by) === Number(user?.id)
      && (item.assigned_to == null || Number(item.assigned_to) === Number(user?.id) || ['open', 'resolved', 'closed'].includes(item.status))
    )
  );

  const afterChange = async () => {
    await load();
    fetchNotifications?.().catch(() => {});
  };

  const quickStatus = async (value) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/tickets/${id}/replies`, { message: statusMessage(value), new_status: value });
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('message', reply);
      if (newStatus) data.append('new_status', newStatus);
      if (replyFile) data.append('reply_attachment', replyFile);
      await api.upload('post', `/tickets/${id}/replies`, data);
      setReply('');
      setNewStatus('');
      setReplyFile(null);
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reply');
    } finally {
      setSaving(false);
    }
  };

  const submitAssign = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/tickets/${id}/assign`, { assigned_to: assignTo });
      setShowAssign(false);
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign ticket');
    } finally {
      setSaving(false);
    }
  };

  const deleteTicket = async () => {
    setSaving(true);
    setError('');
    try {
      await api.del(`/tickets/${id}`);
      navigate('/dashboard/tickets');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete ticket');
    } finally {
      setSaving(false);
    }
  };

  if (!item && !error) return <DetailPageSkeleton />;

  return (
    <div>
      <PageHeading icon={<MessageSquare className="h-6 w-6" />} title={`Ticket #${id}`} subtitle="View ticket details and conversation" showBack backTo="/dashboard/tickets" />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {item && (
        <>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                <p className="text-sm text-gray-500">Created {formatPhpDateTime(item.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={item.status} />
                <StatusBadge value={item.priority} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-900 capitalize">{item.category || 'general'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <p className="font-medium text-gray-900">{item.creator?.names || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned to</p>
                <p className="font-medium text-gray-900">{item.assignee?.names || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Resolved date</p>
                <p className="font-medium text-gray-900">{item.resolved_at ? formatPhpDateTime(item.resolved_at) : '—'}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm text-gray-500">Description</p>
              <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: item.description || '<p>—</p>' }} />
            </div>

            {item.attachment_files?.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 font-semibold text-gray-900">Ticket Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {item.attachment_files.map((file, index) => (
                    <a
                      key={`${file.stored_path}-${index}`}
                      href={fileUrl(file.stored_path, { auth: true })}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachmentName(file)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {canAccess && (
            <div className="mt-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 font-semibold text-gray-900">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {item.status !== 'resolved' && (
                  <button disabled={saving} type="button" onClick={() => quickStatus('resolved')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" /> Mark Resolved
                  </button>
                )}
                {item.status !== 'closed' && (
                  <button disabled={saving} type="button" onClick={() => quickStatus('closed')} className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white">
                    <XCircle className="mr-2 inline h-4 w-4" /> Close
                  </button>
                )}
                {item.status === 'closed' && (
                  <button disabled={saving} type="button" onClick={() => quickStatus('open')} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">
                    Reopen
                  </button>
                )}
                {canManage && (
                  <button type="button" onClick={() => setShowAssign(true)} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white">
                    <UserPlus className="mr-2 inline h-4 w-4" /> Assign
                  </button>
                )}
                {canDelete && (
                  <button type="button" onClick={() => setShowDelete(true)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-semibold text-gray-900">Conversation</h3>
            <div className="space-y-3">
              {(item.ticket_replies_ticket_id || []).map((replyRow) => (
                <div key={replyRow.id} className={`rounded-xl border p-4 ${Number(replyRow.user_id) === Number(user?.id) ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {replyRow.user?.names || 'User'} <span className="font-normal text-gray-500">({replyRow.user?.role || 'User'})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatPhpDateTime(replyRow.created_at)}</span>
                      {Number(replyRow.is_status_update) === 1 && <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">Status Update</span>}
                    </div>
                  </div>
                  <div className="prose prose-sm mt-3 max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: replyRow.message || '<p>—</p>' }} />
                  {replyRow.attachment_files?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {replyRow.attachment_files.map((file, index) => (
                        <a
                          key={`${file.stored_path}-${index}`}
                          href={fileUrl(file.stored_path, { auth: true })}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4" />
                          {attachmentName(file)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {canAccess && (
            <form onSubmit={sendReply} className="mt-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-900">Add Reply</h3>
              <div>
                <label className={labelClass}>Message</label>
                <textarea className={`${inputClass} min-h-28`} value={reply} onChange={(e) => setReply(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Attachment</label>
                <input type="file" className={inputClass} onChange={(e) => setReplyFile(e.target.files?.[0] || null)} />
                <p className="mt-1 text-xs text-gray-500">Optional attachment</p>
              </div>
              {canUpdateStatus && (
                <div>
                  <label className={labelClass}>Update Status (Optional)</label>
                  <select className={inputClass} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="">-- Keep current --</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">
                <Send className="mr-2 inline h-4 w-4" />
                {saving ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          )}

          {item.ticket_logs_ticket_id?.length > 0 && (
            <div className="mt-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 font-semibold text-gray-900">Activity Log</h3>
              <div className="space-y-2">
                {item.ticket_logs_ticket_id.map((log) => (
                  <div key={log.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-100 pb-2 text-sm last:border-0">
                    <span>
                      <span className="font-medium">{String(log.action || '').replace(/_/g, ' ')}</span>
                      {log.details ? ` - ${log.details}` : ''}
                      {log.user?.names ? ` · ${log.user.names}` : ''}
                    </span>
                    <span className="text-gray-500">{formatPhpDateTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showAssign && item && (
        <Modal title={`Assign Ticket #${item.id}`} onClose={() => setShowAssign(false)}>
          <form onSubmit={submitAssign} className="space-y-4">
            <div>
              <label className={labelClass}>Assign to</label>
              <select className={inputClass} value={assignTo} onChange={(e) => setAssignTo(e.target.value)} required>
                <option value="">Select user...</option>
                {staff.map((staffUser) => (
                  <option key={staffUser.id} value={staffUser.id}>{staffUser.names} ({staffUser.role})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAssign(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">Assign</button>
            </div>
          </form>
        </Modal>
      )}

      {showDelete && item && (
        <ConfirmationModal
          isOpen
          onClose={() => setShowDelete(false)}
          onConfirm={deleteTicket}
          title={`Delete Ticket #${item.id}`}
          message={`Delete "${item.title}"? This cannot be undone.`}
          type="delete"
          loading={saving}
        />
      )}
    </div>
  );
}
