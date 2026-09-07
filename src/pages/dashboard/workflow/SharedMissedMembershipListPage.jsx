import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { formatPhpDate, formatPhpDateTime } from './helpers';
import { formatReportPeriod } from './membershipReportShared';

export default function SharedMissedMembershipListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/membership-reports/missed-shares/${id}`);
      setData(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Shared missed list not found');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  const sendComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/membership-reports/missed-shares/${id}/comments`, { comment: comment.trim() });
      setComment('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post comment');
    } finally {
      setSaving(false);
    }
  };

  const markSeen = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/membership-reports/missed-shares/${id}/seen`, {
        note: comment.trim() || undefined,
      });
      setData(res.data || null);
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark as seen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-gray-500">Loading shared missed list...</p>;
  if (error && !data) return <p className="p-8 text-center text-red-600">{error}</p>;
  if (!data) return <p className="p-8 text-center text-red-600">Not found</p>;

  const items = data.items || [];
  const summary = data.summary || {};
  const filters = data.filters || {};
  const comments = data.comments || [];
  const permissions = data.permissions || {};

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<FileText className="h-6 w-6" />}
        title={data.title || 'Shared missed reports'}
        subtitle="Filtered missed membership reports list shared with you"
        showBack
        backTo="/dashboard/membership-reports"
        actions={[
          ...(permissions.can_mark_seen ? [{
            label: saving ? 'Saving...' : 'Mark as seen',
            variant: 'primary',
            icon: <CheckCircle2 className="h-4 w-4" />,
            onClick: markSeen,
            disabled: saving,
          }] : []),
          {
            label: 'Back to membership reports',
            variant: 'secondary',
            icon: <ArrowLeft className="h-4 w-4" />,
            onClick: () => navigate('/dashboard/membership-reports'),
          },
        ]}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-[#2f5d31] px-4 py-4 text-white shadow-sm">
          <p className="text-2xl font-semibold">{summary.officers ?? 0}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Officers</p>
        </div>
        <div className="rounded-xl bg-[#2f5d31]/80 px-4 py-4 text-white shadow-sm">
          <p className="text-2xl font-semibold">{summary.submitted ?? 0}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Submitted</p>
        </div>
        <div className="rounded-xl bg-rose-600 px-4 py-4 text-white shadow-sm">
          <p className="text-2xl font-semibold">{summary.missed ?? items.length}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Missed</p>
        </div>
        <div className="rounded-xl bg-[#6b4423] px-4 py-4 text-white shadow-sm">
          <p className="text-sm font-semibold">{filters.report_type || '—'}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Report type</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-100">
          <StatusBadge value={data.status} />
          <p className="mt-2 text-xs text-gray-500">
            {data.seen_at ? `Seen ${formatPhpDateTime(data.seen_at)}` : data.opened_at ? `Opened ${formatPhpDateTime(data.opened_at)}` : 'Awaiting review'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
          <div className="mb-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
            <p><span className="text-gray-400">Shared by:</span> {data.sharer?.names || '—'}</p>
            <p><span className="text-gray-400">Shared to:</span> {data.recipient?.names || '—'}</p>
            <p><span className="text-gray-400">Shared on:</span> {formatPhpDateTime(data.created_at)}</p>
            <p><span className="text-gray-400">Location:</span> {filters.location || 'All'}</p>
            <p><span className="text-gray-400">Period:</span> {formatReportPeriod(filters)}</p>
            <p className="sm:col-span-2"><span className="text-gray-400">Note:</span> {data.note || '—'}</p>
          </div>

          <DataTable
            columns={[
              { key: 'id', label: '#', render: (_row, idx) => idx + 1 },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusBadge value={row.missed ? 'missed' : row.status} />,
              },
              {
                key: 'user_name',
                label: 'Officer',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.user_name}</p>
                    <p className="text-xs text-gray-500">{row.email}</p>
                  </div>
                ),
              },
              { key: 'location', label: 'Location', render: (row) => row.location || '—' },
              { key: 'working_area', label: 'Working area', render: (row) => row.working_area || '—' },
              {
                key: 'title',
                label: 'Report',
                render: (row) => (row.missed ? 'No report submitted' : (row.title || '—')),
              },
            ]}
            rows={items}
            empty="No missed officers in this shared list"
            renderActions={(row) => (
              row.id ? (
                <Link to={`/dashboard/membership-reports/${row.id}`} className="font-medium text-[#2f5d31]">
                  Open report
                </Link>
              ) : (
                <span className="text-xs font-medium text-rose-600">Missed</span>
              )
            )}
          />
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="bg-[#2f5d31] px-4 py-3 text-white flex items-center justify-between">
            <h3 className="font-semibold">Comments</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{comments.length}</span>
          </div>
          <div className="p-4">
            {permissions.can_comment && (
              <form onSubmit={sendComment} className="mb-4">
                <textarea
                  maxLength={1000}
                  className={`${inputClass} min-h-20`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment for the sharer / ED..."
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">{comment.length} / 1000</span>
                  <div className="flex gap-2">
                    {permissions.can_mark_seen && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={markSeen}
                        className="rounded-lg bg-[#6b4423] px-3 py-1.5 text-sm text-white"
                      >
                        Mark as seen
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving || !comment.trim()}
                      className="rounded-lg bg-[#2f5d31] px-3 py-1.5 text-sm text-white"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </form>
            )}

            {String(data.status || '').toUpperCase() === 'SEEN' && (
              <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Marked as seen{data.seen_at ? ` on ${formatPhpDate(data.seen_at)}` : ''}
                {data.recipient?.names ? ` by ${data.recipient.names}` : ''}.
              </div>
            )}

            {comments.length ? comments.map((row) => (
              <div key={row.id} className="border-t border-gray-100 py-3">
                <p className="text-sm font-medium">{row.user?.names || user?.names || 'User'}</p>
                <p className="mb-1 text-xs text-gray-400">{formatPhpDateTime(row.created_at)}</p>
                <p className="whitespace-pre-wrap text-sm">{row.comment}</p>
              </div>
            )) : (
              <p className="text-sm text-gray-400">No comments yet. Be the first to comment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
