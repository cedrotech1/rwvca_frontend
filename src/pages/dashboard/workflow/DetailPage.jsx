import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardList, Download, FileText, Printer } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, inputClass, labelClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { downloadProtectedFile, fileUrl, openProtectedFile } from '../../../services/api/config';
import { useNotifications } from '../../../contexts/NotificationsContext';
import { formatCell, formatDateTime, isStatusColumn } from './helpers';
import WorkflowActions from './WorkflowActions';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';

function nested(row, key) {
  return String(key || '').split('.').reduce((value, part) => value?.[part], row);
}

function htmlToPlainText(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function renderRichContent(value) {
  const html = String(value || '').trim();
  if (!html) return '—';
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html);
  if (!looksLikeHtml) return <div className="whitespace-pre-wrap">{html}</div>;
  return <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: html }} />;
}

function ReplyThread({ replies, onReply, activeReplyId, setActiveReplyId, replyDraft, setReplyDraft, saving, replyLabel = 'Reply' }) {
  if (!Array.isArray(replies) || !replies.length) return null;

  return replies.map((row) => (
    <div
      key={row.id}
      className={`rounded-xl border border-gray-100 bg-white p-4 ${row.level > 0 ? 'ml-4 sm:ml-8 border-l-4 border-l-[#2f5d31]/20' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{row.user?.names || 'User'}</p>
          <p className="text-xs text-gray-500">{formatDateTime(row.created_at)}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.level > 0 ? 'bg-gray-100 text-gray-700' : 'bg-[#2f5d31]/10 text-[#2f5d31]'}`}>
          {row.level > 0 ? 'Reply' : 'Original Reply'}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{row.reply_text || row.message}</p>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-[#2f5d31]"
        onClick={() => setActiveReplyId(activeReplyId === row.id ? null : row.id)}
      >
        Reply
      </button>
      {activeReplyId === row.id && (
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onReply(row.id);
          }}
        >
          <textarea
            className={`${inputClass} min-h-20`}
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            required
            maxLength={500}
            placeholder="Write your reply..."
          />
          <button disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">
            {saving ? 'Sending...' : replyLabel}
          </button>
        </form>
      )}
      {Array.isArray(row.children) && row.children.length > 0 && (
        <div className="mt-4 space-y-3">
          <ReplyThread
            replies={row.children}
            onReply={onReply}
            activeReplyId={activeReplyId}
            setActiveReplyId={setActiveReplyId}
            replyDraft={replyDraft}
            setReplyDraft={setReplyDraft}
            saving={saving}
            replyLabel={replyLabel}
          />
        </div>
      )}
    </div>
  ));
}

export default function DetailPage({
  title,
  apiPath,
  backTo,
  fields,
  replyPath,
  replyLabel = 'Your Reply',
  itemTable,
  action,
  workflow,
  documentTo,
  documentButtonLabel = 'Print document',
  letterKey,
  fileKey,
  fileDownloadApi,
  logsKey,
  commentsKey,
  sharesKey,
  commentPath,
  repliesKey,
  replyThreadKey,
  onLoad,
  renderMeta,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchNotifications } = useNotifications();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [commentText, setCommentText] = useState('');
  const [nestedReply, setNestedReply] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionValue, setActionValue] = useState('');
  const [actionComment, setActionComment] = useState('');

  const load = async () => {
    const res = await api.get(`${apiPath}/${id}`);
    setItem(res.data);
    if (action?.field) setActionValue(res.data?.[action.field] || action.options?.[0]?.value || '');
    if (onLoad) await onLoad(res.data, id);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id, apiPath]);

  const afterChange = async () => {
    await load();
    fetchNotifications?.().catch(() => {});
  };

  const sendAction = async (event) => {
    event.preventDefault();
    if (!action?.path) return;
    setSaving(true);
    try {
      await api.put(action.path.replace(':id', id), {
        [action.field]: actionValue,
        comment: actionComment,
      });
      setActionComment('');
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(replyPath.replace(':id', id), { message: reply, reply_text: reply });
      setReply('');
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Reply failed');
    } finally {
      setSaving(false);
    }
  };

  const sendNestedReply = async (parentReplyId) => {
    setSaving(true);
    try {
      await api.post(replyPath.replace(':id', id), {
        message: nestedReply,
        reply_text: nestedReply,
        parent_reply_id: parentReplyId,
      });
      setNestedReply('');
      setActiveReplyId(null);
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Reply failed');
    } finally {
      setSaving(false);
    }
  };

  const sendComment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post((commentPath || `${apiPath}/:id/comments`).replace(':id', id), {
        comment_text: commentText,
        comment: commentText,
      });
      setCommentText('');
      await afterChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    } finally {
      setSaving(false);
    }
  };

  const downloadStored = async (storedPath, name) => {
    try {
      if (fileDownloadApi) {
        await downloadProtectedFile(fileDownloadApi.replace(':id', id), name || 'document');
        return;
      }
      const url = fileUrl(storedPath, { auth: true });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Download failed');
    }
  };

  if (!item && !error) return <DetailPageSkeleton />;

  const rows = itemTable ? (item?.[itemTable.key] || []) : [];
  const tableColumns = itemTable ? itemTable.columns.map((col) => ({
    ...col,
    render: (row, index) => {
      if (col.key === 'sn') return row.sn || index + 1;
      if (isStatusColumn(col)) return <StatusBadge value={row[col.key]} />;
      return formatCell(row, col);
    },
  })) : [];

  const letterPath = letterKey ? nested(item, letterKey) : null;
  const filePath = fileKey ? nested(item, fileKey) : null;
  const logs = logsKey ? (item?.[logsKey] || []) : (item?.logs || []);
  const comments = commentsKey ? (item?.[commentsKey] || []) : [];
  const shares = sharesKey ? (item?.[sharesKey] || []) : [];
  const replyTree = replyThreadKey ? (item?.[replyThreadKey] || []) : [];
  const headingActions = [];
  if (documentTo) {
    headingActions.push({
      label: documentButtonLabel,
      variant: 'secondary',
      icon: <Printer className="h-4 w-4" />,
      onClick: () => navigate(documentTo.replace(':id', id)),
    });
    headingActions.push({
      label: 'Open in new tab',
      variant: 'outline',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => window.open(documentTo.replace(':id', id), '_blank'),
    });
  }
  if (fileDownloadApi || filePath) {
    headingActions.push({
      label: 'Download',
      variant: 'primary',
      icon: <Download className="h-4 w-4" />,
      onClick: () => {
        if (fileDownloadApi) {
          downloadProtectedFile(fileDownloadApi.replace(':id', id), item?.title || 'document').catch((err) => setError(err.message));
          return;
        }
        downloadStored(filePath, item?.title || 'file');
      },
    });
  }
  if (fileDownloadApi) {
    headingActions.push({
      label: 'View file',
      variant: 'secondary',
      onClick: () => openProtectedFile(fileDownloadApi.replace(':id', id)).catch((err) => setError(err.message)),
    });
  }

  const useWorkflowPanel = Boolean(workflow);

  return (
    <div>
      <PageHeading icon={<ClipboardList className="h-6 w-6" />} title={`${title} #${id}`} subtitle="View record details" showBack backTo={backTo} actions={headingActions} />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {item && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-3">
          {fields.map((field) => {
            const value = nested(item, field.key);
            return (
              <div key={field.key} className="grid sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm text-gray-500">{field.label}</p>
                <div className="sm:col-span-2 whitespace-pre-wrap">
                  {field.format === 'letter' || field.format === 'file' ? (
                    value && value !== '—' ? (
                      <button type="button" className="text-[#2f5d31] font-medium" onClick={() => downloadStored(value, field.label)}>
                        View / Download
                      </button>
                    ) : '—'
                  ) : field.format === 'html' ? (
                    renderRichContent(value)
                  ) : field.format === 'plainTextFromHtml' ? (
                    <div className="whitespace-pre-wrap">{htmlToPlainText(value) || '—'}</div>
                  ) : isStatusColumn(field) ? <StatusBadge value={item[field.key]} /> : formatCell(item, field)}
                </div>
              </div>
            );
          })}
          {letterPath && letterPath !== '—' && (
            <div className="pt-2">
              <a className="text-[#2f5d31] font-medium" href={fileUrl(letterPath, { auth: true })} target="_blank" rel="noreferrer">
                Open supporting letter
              </a>
            </div>
          )}
          {itemTable && (
            <div className="pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <DataTable columns={tableColumns} rows={rows} empty="No items" />
            </div>
          )}
          {renderMeta ? renderMeta(item, { downloadStored, fileUrl }) : null}
        </div>
      )}

      {item && documentTo && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={documentTo.replace(':id', id)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white"
          >
            <Printer size={16} /> {documentButtonLabel}
          </Link>
        </div>
      )}

      {item && useWorkflowPanel && (
        <WorkflowActions
          workflow={workflow}
          item={item}
          apiPath={apiPath}
          id={id}
          extraAction={action}
          onDone={afterChange}
        />
      )}

      {!useWorkflowPanel && action && item && action.when(item) && (
        <form onSubmit={sendAction} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-3">
          <label className={labelClass}>{action.label || 'Update status'}</label>
          <select className={inputClass} value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
            {(action.options || []).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <textarea className={`${inputClass} min-h-20`} value={actionComment} onChange={(e) => setActionComment(e.target.value)} placeholder="Comment (optional)" />
          <button disabled={saving} className="bg-[#2f5d31] text-white px-4 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : (action.submitLabel || 'Update')}</button>
        </form>
      )}

      {shares.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4">
          <h3 className="font-semibold mb-3">Shared with</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {shares.map((share) => (
              <li key={share.id}>{share.sharedToUser?.names || share.shared_to} {share.sharedByUser?.names ? `· by ${share.sharedByUser.names}` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {comments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-3">
          <h3 className="font-semibold">Comments</h3>
          {comments.map((row) => (
            <div key={row.id} className="border-b border-gray-100 pb-2 last:border-0">
              <p className="text-sm font-medium">{row.user?.names || 'User'} <span className="font-normal text-gray-500">{formatDateTime(row.commented_at || row.created_at)}</span></p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.comment_text || row.comment || row.message}</p>
            </div>
          ))}
        </div>
      )}

      {repliesKey && (item?.[repliesKey] || []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-3">
          <h3 className="font-semibold">Replies</h3>
          {(item[repliesKey] || []).map((row) => (
            <div key={row.id} className="border-b border-gray-100 pb-2 last:border-0">
              <p className="text-sm font-medium">{row.sender?.names || 'User'} <span className="font-normal text-gray-500">{formatDateTime(row.created_at)}</span></p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.message || row.reply_text}</p>
            </div>
          ))}
        </div>
      )}

      {replyThreadKey && replyTree.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-4">
          <h3 className="font-semibold">Conversation</h3>
          <ReplyThread
            replies={replyTree}
            onReply={sendNestedReply}
            activeReplyId={activeReplyId}
            setActiveReplyId={setActiveReplyId}
            replyDraft={nestedReply}
            setReplyDraft={setNestedReply}
            saving={saving}
            replyLabel="Send reply"
          />
        </div>
      )}

      {commentPath && (
        <form onSubmit={sendComment} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-3">
          <label className={labelClass}>Comment</label>
          <textarea className={`${inputClass} min-h-24`} value={commentText} onChange={(e) => setCommentText(e.target.value)} required placeholder="Write a comment..." />
          <button disabled={saving} className="bg-[#2f5d31] text-white px-4 py-2.5 rounded-lg font-medium">{saving ? 'Sending...' : 'Add comment'}</button>
        </form>
      )}

      {Array.isArray(logs) && logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4">
          <h3 className="font-semibold mb-3">Activity log</h3>
          <ul className="space-y-2 text-sm">
            {logs.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-100 pb-2 last:border-0">
                <span>
                  <span className="font-medium">{String(row.status || row.action || '').replace(/_/g, ' ')}</span>
                  {row.comment ? ` — ${row.comment}` : ''}
                  <span className="text-gray-500"> · {row.changedByUser?.names || row.user?.names || ''}</span>
                </span>
                <span className="text-gray-500">{formatDateTime(row.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {replyPath && (
        <form onSubmit={sendReply} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-3">
          <label className={labelClass}>{replyLabel}</label>
          <textarea className={`${inputClass} min-h-24`} value={reply} onChange={(e) => setReply(e.target.value)} required placeholder="Write your reply..." />
          <button disabled={saving} className="bg-[#2f5d31] text-white px-4 py-2.5 rounded-lg font-medium">{saving ? 'Sending...' : 'Send'}</button>
        </form>
      )}
    </div>
  );
}
