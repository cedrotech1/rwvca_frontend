import { useEffect, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Building2, Calendar, Download, Eye, FileText, MessageSquareReply, Share2, User, X } from 'lucide-react';

import { PageHeading } from '../../../components/PageHeading';

import { ConfirmationModal } from '../../../components/ConfirmationModal';

import { StatusBadge, inputClass, labelClass } from '../../../components/ui/dataUi';

import { DetailPageSkeleton, Skeleton } from '../../../components/ui/Skeleton';

import api from '../../../services/api';

import { downloadProtectedFile, openProtectedFile } from '../../../services/api/config';

import { useNotifications } from '../../../contexts/NotificationsContext';

import { formatPhpDateTime } from './helpers';

import { sanitizeHtml } from '../../../utils/sanitize';



function MetaItem({ icon, label, value }) {

  return (

    <div className="flex gap-3 rounded-lg bg-gray-50/80 px-4 py-3 ring-1 ring-gray-100">

      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2f5d31]/10 text-[#2f5d31]">

        {icon}

      </div>

      <div className="min-w-0">

        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>

        <p className="mt-0.5 text-sm font-medium text-gray-900 break-words">{value || '—'}</p>

      </div>

    </div>

  );

}



function CommentNode({ node, onReply, saving }) {

  const [open, setOpen] = useState(false);

  const [content, setContent] = useState('');



  const submit = async (event) => {

    event.preventDefault();

    if (!content.trim()) return;

    await onReply({ content, parent_comment_id: node.id });

    setContent('');

    setOpen(false);

  };



  return (

    <div className="mb-3 rounded-lg border-l-4 border-[#2f5d31]/30 bg-gray-50 p-4" style={{ marginLeft: 0 }}>

      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">

        <p className="font-semibold text-gray-900">{node.user?.names || 'User'}</p>

        <div className="flex items-center gap-2 text-xs text-gray-500">

          <span>{formatPhpDateTime(node.commented_at)}</span>

          <button type="button" className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-[#2f5d31]" onClick={() => setOpen((prev) => !prev)}>

            Reply

          </button>

        </div>

      </div>

      <p className="whitespace-pre-wrap text-sm text-gray-800">{node.comment_text}</p>

      {open && (

        <form onSubmit={submit} className="mt-3 space-y-2 border-t border-dashed pt-3">

          <textarea required rows={3} className={inputClass} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your reply..." />

          <div className="flex gap-2">

            <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-3 py-2 text-sm font-medium text-white">Send</button>

            <button type="button" className="rounded-lg bg-gray-100 px-3 py-2 text-sm" onClick={() => setOpen(false)}>Cancel</button>

          </div>

        </form>

      )}

      {node.children?.length > 0 && (

        <div className="mt-3 space-y-3 border-l border-gray-200 pl-4">

          {node.children.map((child) => (

            <CommentNode key={child.id} node={child} onReply={onReply} saving={saving} />

          ))}

        </div>

      )}

    </div>

  );

}



export default function DocumentDetailPage() {

  const { id } = useParams();

  const { fetchNotifications } = useNotifications();

  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [message, setMessage] = useState('');

  const [saving, setSaving] = useState(false);

  const [departments, setDepartments] = useState([]);

  const [departmentId, setDepartmentId] = useState('');

  const [departmentUsers, setDepartmentUsers] = useState([]);

  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState({});

  const [isForward, setIsForward] = useState(false);

  const [comment, setComment] = useState('');

  const [showStatus, setShowStatus] = useState(false);



  const selectedIds = useMemo(() => Object.keys(selectedUsers).map(Number), [selectedUsers]);

  const selectedList = useMemo(

    () => selectedIds.map((userId) => ({ id: userId, names: selectedUsers[userId] })),

    [selectedIds, selectedUsers]

  );

  const allVisibleSelected = departmentUsers.length > 0 && departmentUsers.every((row) => selectedUsers[Number(row.id)]);

  const fileTypeLabel = item?.file_type

    ? String(item.file_type).charAt(0).toUpperCase() + String(item.file_type).slice(1)

    : '—';



  const load = async () => {

    const res = await api.get(`/documents/${id}`);

    setItem(res.data);

  };



  useEffect(() => {

    setLoading(true);

    load()

      .catch((err) => setError(err.response?.data?.message || 'Could not load document'))

      .finally(() => setLoading(false));

    api.get('/departments').then((res) => {

      const rows = Array.isArray(res.data) ? res.data : (res.data?.items || []);

      setDepartments(rows);

    }).catch(() => {});

  }, [id]);



  useEffect(() => {

    if (departmentId === '') {

      setDepartmentUsers([]);

      return;

    }

    let cancelled = false;

    setUsersLoading(true);

    api.get(`/documents/${id}/share-users`, { dept: departmentId })

      .then((res) => {

        if (cancelled) return;

        setDepartmentUsers(Array.isArray(res.data) ? res.data : []);

      })

      .catch(() => {

        if (!cancelled) setDepartmentUsers([]);

      })

      .finally(() => {

        if (!cancelled) setUsersLoading(false);

      });

    return () => { cancelled = true; };

  }, [id, departmentId]);



  const toggleUser = (userId, names) => {

    setSelectedUsers((prev) => {

      const next = { ...prev };

      if (next[userId]) delete next[userId];

      else next[userId] = names;

      return next;

    });

  };



  const toggleAll = (checked) => {

    setSelectedUsers((prev) => {

      const next = { ...prev };

      departmentUsers.forEach((row) => {

        if (checked) next[Number(row.id)] = row.names;

        else delete next[Number(row.id)];

      });

      return next;

    });

  };



  const afterChange = async () => {

    await load();

    fetchNotifications?.().catch(() => {});

  };



  const share = async (event) => {

    event.preventDefault();

    if (!selectedIds.length) {

      setError('Select at least one user to share with');

      return;

    }

    setSaving(true);

    setError('');

    setMessage('');

    try {

      const res = await api.post(`/documents/${id}/share`, { user_ids: selectedIds, is_forward: isForward });

      setMessage(res.message || 'Document shared');

      setSelectedUsers({});

      setIsForward(false);

      await afterChange();

    } catch (err) {

      setError(err.response?.data?.message || 'Could not share document');

    } finally {

      setSaving(false);

    }

  };



  const postComment = async ({ content, parent_comment_id = null }) => {

    setSaving(true);

    setError('');

    try {

      await api.post(`/documents/${id}/comments`, { comment_text: content, parent_comment_id });

      if (!parent_comment_id) setComment('');

      await afterChange();

    } catch (err) {

      setError(err.response?.data?.message || 'Could not add comment');

    } finally {

      setSaving(false);

    }

  };



  const toggleStatus = async () => {

    setSaving(true);

    setError('');

    try {

      await api.post(`/documents/${id}/status`, { new_status: item.status === 'open' ? 'closed' : 'open' });

      setShowStatus(false);

      await afterChange();

    } catch (err) {

      setError(err.response?.data?.message || 'Could not update status');

    } finally {

      setSaving(false);

    }

  };



  const handleFile = async (mode) => {

    if (!item?.can_download) return;

    if (item.status !== 'open' && !window.confirm(`This document is closed. Are you sure you want to ${mode} it?`)) return;

    try {

      if (mode === 'view') await openProtectedFile(`/documents/${id}/file`);

      else await downloadProtectedFile(`/documents/${id}/file`, item.title || 'document');

    } catch (err) {

      setError(err.message || 'Could not open file');

    }

  };



  if (loading && !item) return <DetailPageSkeleton />;



  return (

    <div className="space-y-4">

      <PageHeading

        icon={<FileText className="h-6 w-6" />}

        title={item?.title || `Document #${id}`}

        subtitle="Document details, sharing, and comments"

        showBack

        backTo="/dashboard/documents"

      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {message && <p className="text-sm text-emerald-700">{message}</p>}



      {item && (

        <>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">

            <div className="border-b border-[#2f5d31]/10 bg-gradient-to-r from-[#2f5d31]/8 to-white px-6 py-5">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div className="min-w-0 flex-1">

                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2f5d31]">Document</p>

                  <h2 className="mt-1 text-2xl font-bold text-gray-900 break-words">{item.title}</h2>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {item.type && (

                      <span className="inline-flex items-center rounded-full bg-[#2f5d31]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2f5d31]">

                        {item.type}

                      </span>

                    )}

                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">

                      {fileTypeLabel}

                    </span>

                    <StatusBadge value={item.status} />

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  {item.can_download ? (

                    <>

                      <button type="button" onClick={() => handleFile('view')} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white shadow-sm">

                        <Eye size={16} /> View

                      </button>

                      <button type="button" onClick={() => handleFile('download')} className="inline-flex items-center gap-2 rounded-lg border border-[#2f5d31] bg-white px-4 py-2.5 text-sm font-medium text-[#2f5d31]">

                        <Download size={16} /> Download

                      </button>

                    </>

                  ) : (

                    <>

                      <button type="button" disabled className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm text-gray-500">View</button>

                      <button type="button" disabled className="rounded-lg border px-4 py-2.5 text-sm text-gray-400">Download</button>

                    </>

                  )}

                  {item.can_toggle_status && (

                    <button type="button" className="rounded-lg bg-[#6b4423]/10 px-4 py-2.5 text-sm font-medium text-[#6b4423]" onClick={() => setShowStatus(true)}>

                      {item.status === 'open' ? 'Close document' : 'Reopen document'}

                    </button>

                  )}

                </div>

              </div>

            </div>



            <div className="grid gap-6 p-6 lg:grid-cols-5">

              <div className="lg:col-span-3 space-y-4">

                <div>

                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Description</h3>

                  <div className="rounded-xl bg-gray-50/80 p-4 ring-1 ring-gray-100">

                    {item.description ? (

                      <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }} />

                    ) : (

                      <p className="text-sm italic text-gray-500">No description provided.</p>

                    )}

                  </div>

                </div>

              </div>



              <div className="lg:col-span-2 space-y-3">

                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Metadata</h3>

                <MetaItem icon={<User size={16} />} label="Created by" value={item.creator_name || item.creator?.names} />

                {item.department_name && (

                  <MetaItem icon={<Building2 size={16} />} label="Department" value={item.department_name} />

                )}

                <MetaItem icon={<Calendar size={16} />} label="Created at" value={formatPhpDateTime(item.created_at)} />

                {item.my_share && (

                  <>

                    <MetaItem icon={<Share2 size={16} />} label="Shared by" value={item.my_share.shared_by_name} />

                    <MetaItem icon={<Calendar size={16} />} label="Shared at" value={formatPhpDateTime(item.my_share.shared_at)} />

                  </>

                )}

              </div>

            </div>

          </div>



          {item.shares?.length > 0 && (

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">

              <h3 className="mb-3 font-semibold text-gray-900">Sharing History</h3>

              <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">

                <table className="min-w-full text-sm">

                  <thead>

                    <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">

                      <th className="px-3 py-2.5">Shared To</th>

                      <th className="px-3 py-2.5">Shared By</th>

                      <th className="px-3 py-2.5">Date</th>

                      <th className="px-3 py-2.5">Type</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {item.shares.map((share) => (

                      <tr key={share.id}>

                        <td className="px-3 py-2.5">{share.shared_to_name || '—'}</td>

                        <td className="px-3 py-2.5">{share.shared_by_name || '—'}</td>

                        <td className="px-3 py-2.5">{formatPhpDateTime(share.shared_at)}</td>

                        <td className="px-3 py-2.5">{Number(share.is_forward) === 1 ? 'Forward' : 'Direct Share'}</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {item.can_share && (

            <form onSubmit={share} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">

              <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900"><Share2 size={18} /> Share Document</h3>

              <div className="grid gap-4 lg:grid-cols-12">

                <label className={`${labelClass} lg:col-span-3`}>

                  Department

                  <select className={`mt-1 ${inputClass}`} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>

                    <option value="">Select Department</option>

                    <option value="0">No Department</option>

                    {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}

                  </select>

                </label>

                <div className="lg:col-span-5">

                  <p className={labelClass}>Share with Users</p>

                  <div className="mt-1 max-h-52 overflow-y-auto rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">

                    {departmentId === '' ? (

                      <p className="text-sm text-gray-500">Select a department first</p>

                    ) : usersLoading ? (

                      <div className="space-y-2 py-1">

                        {Array.from({ length: 4 }).map((_, i) => (

                          <Skeleton key={i} className="h-8 w-full" />

                        ))}

                      </div>

                    ) : (

                      <>

                        <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                          <input

                            type="checkbox"

                            checked={allVisibleSelected}

                            disabled={!departmentUsers.length}

                            onChange={(e) => toggleAll(e.target.checked)}

                          />

                          Select All

                        </label>

                        <div className="space-y-1 border-t border-gray-200 pt-2">

                          {departmentUsers.map((row) => (

                            <label key={row.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 hover:bg-white">

                              <input

                                type="checkbox"

                                checked={Boolean(selectedUsers[Number(row.id)])}

                                onChange={() => toggleUser(Number(row.id), row.names)}

                              />

                              <span className="text-sm">{row.names}</span>

                            </label>

                          ))}

                          {!departmentUsers.length && <p className="text-sm text-gray-500">No users in this department.</p>}

                        </div>

                      </>

                    )}

                  </div>

                  <p className="mt-1 text-xs text-gray-500">Check users to share with, or use Select All to share with everyone</p>

                </div>

                <div className="lg:col-span-4">

                  <p className={labelClass}>Selected Users Preview</p>

                  <div className="mt-1 min-h-[8rem] rounded-lg bg-emerald-50/50 p-3 ring-1 ring-emerald-200">

                    {!selectedList.length && <p className="text-sm italic text-gray-500">No users selected yet</p>}

                    <div className="space-y-2">

                      {selectedList.map((row) => (

                        <div key={row.id} className="flex items-center justify-between rounded-md border border-emerald-100 bg-white px-2 py-1.5">

                          <span className="text-sm text-gray-800">{row.names}</span>

                          <button type="button" className="text-rose-500" onClick={() => toggleUser(Number(row.id), row.names)} title="Remove">

                            <X size={14} />

                          </button>

                        </div>

                      ))}

                    </div>

                  </div>

                  <p className="mt-1 text-xs text-gray-500">Users selected from all departments</p>

                </div>

              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">

                <input type="checkbox" checked={isForward} onChange={(e) => setIsForward(e.target.checked)} />

                Forward

              </label>

              <button type="submit" disabled={saving || !selectedIds.length} className="mt-4 rounded-lg bg-[#2f5d31] px-5 py-2.5 font-medium text-white disabled:opacity-50">

                {saving ? 'Sharing...' : 'Share'}

              </button>

            </form>

          )}



          <div id="comments" className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">

            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">

              <MessageSquareReply size={18} /> Comments

            </h3>

            {item.comment_tree?.length ? item.comment_tree.map((node) => (

              <CommentNode key={node.id} node={node} onReply={postComment} saving={saving} />

            )) : (

              <p className="mb-4 text-sm italic text-gray-500">No comments yet.</p>

            )}

            <form

              onSubmit={(event) => {

                event.preventDefault();

                postComment({ content: comment });

              }}

              className="mt-4 space-y-3"

            >

              <label className={labelClass}>Add a Comment</label>

              <textarea required rows={3} className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your comment here..." />

              <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">Post Comment</button>

            </form>

          </div>



          <ConfirmationModal

            isOpen={showStatus}

            onClose={() => setShowStatus(false)}

            onConfirm={toggleStatus}

            title="Confirm Status Change"

            message={`Are you sure you want to ${item.status === 'open' ? 'close' : 'reopen'} "${item.title}"?`}

            type={item.status === 'open' ? 'deactivate' : 'activate'}

            loading={saving}

          />

        </>

      )}

    </div>

  );

}


