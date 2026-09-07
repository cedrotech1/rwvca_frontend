import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Printer } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { formatPhpDate, formatPhpDateTime } from './helpers';
import { exportCsv, inputClass, labelClass, money, PaymentMethodBadge, SheetTable, StatusBadge } from '../../../components/ui/dataUi';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { useNotifyPriorityModal } from '../../../components/ui/NotifyPriorityModal';
import { num, PAYMENT_FIELDS, sum } from './membershipReportShared';

function periodLabel(item) {
  const type = String(item.report_type || '').toUpperCase();
  if (type === 'DAILY') return formatPhpDate(item.start_date);
  if (type === 'WEEKLY') return `${formatPhpDate(item.start_date)} – ${formatPhpDate(item.end_date)}`;
  if (type === 'MONTHLY') return `${item.monthly_month || ''} ${item.yearly_year || item.year || ''}`.trim();
  if (type === 'QUARTERLY') return `Quarter ${item.quarter} - ${item.yearly_year || item.year || ''}`;
  if (type === 'YEARLY') return String(item.yearly_year || item.year || '');
  return `${formatPhpDate(item.start_date)} – ${formatPhpDate(item.end_date)}`;
}

function isExecutiveShareRole(role) {
  const value = String(role || '').trim().toLowerCase();
  return value === 'ed' || value === 'chairman';
}

export default function MembershipReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewerId, setReviewerId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [shareUsers, setShareUsers] = useState([]);
  const { askNotifyPriority, modal: notifyModal } = useNotifyPriorityModal();

  const load = async () => {
    const res = await api.get(`/membership-reports/${id}`);
    setItem(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  useEffect(() => {
    if (!item?.permissions?.can_assign) return;
    api.get('/membership-reports/share-users')
      .then((res) => setShareUsers(res.data?.items || []))
      .catch(() => setShareUsers([]));
  }, [item?.permissions?.can_assign]);

  const sendComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`/membership-reports/${id}/comments`, { comment });
      setComment('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    } finally {
      setSaving(false);
    }
  };

  const act = async (path, body = {}) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/membership-reports/${id}/${path}`, body);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const assignReviewer = async (event) => {
    event.preventDefault();
    if (!reviewerId || !assignReason.trim()) return;
    const priority = await askNotifyPriority({
      title: 'Notify assignee as',
      confirmLabel: 'Assign & notify',
    });
    if (!priority) return;
    await act('reviewers', { reviewer_id: reviewerId, reason: assignReason, priority });
    setReviewerId('');
    setAssignReason('');
  };

  if (!item && !error) return <DetailPageSkeleton />;
  if (!item) return <p className="p-8 text-center text-red-600">{error}</p>;

  const items = item.items || [];
  const normalItems = items.filter((row) => String(row.category).toUpperCase() === 'NORMAL');
  const otherItems = items.filter((row) => String(row.category).toUpperCase() === 'OTHER');
  const storedPayments = item.payments || [];
  const payments = PAYMENT_FIELDS.map((field) => {
    const found = storedPayments.find((row) => String(row.method).toUpperCase() === field.method);
    return { method: field.method, amount: found?.amount || 0 };
  });
  const customers = item.customers || [];
  const comments = item.comments || [];
  const logs = item.logs || [];
  const reviewers = item.reviewers || [];
  const timberGroups = items.reduce((acc, row) => {
    const name = row.timber_name || '—';
    const qty = num(row.number_of_timber);
    if (name && qty > 0) acc[name] = (acc[name] || 0) + qty;
    return acc;
  }, {});
  const permissions = item.permissions || {};
  const otherShareUsers = shareUsers.filter((row) => !isExecutiveShareRole(row.role));

  return (
    <div>
      <PageHeading
        icon={<FileText className="h-6 w-6" />}
        title={item.title || `Membership Report #${id}`}
        subtitle="View membership report details"
        showBack
        backTo="/dashboard/membership-reports"
        actions={[{
          label: 'Print / PDF',
          variant: 'secondary',
          icon: <Printer className="h-4 w-4" />,
          onClick: () => window.open(`/dashboard/membership-reports/${id}/document`, '_blank', 'noopener,noreferrer'),
        }, {
          label: 'Export',
          variant: 'secondary',
          icon: <Download className="h-4 w-4" />,
          onClick: () => exportCsv(`membership-report-${id}`, [
            { key: 'category', label: 'Category' },
            { key: 'timber_name', label: 'Timber' },
            { key: 'number_of_timber', label: 'Qty' },
            { key: 'price', label: 'Price' },
            { key: 'total_cost', label: 'Total cost' },
            { key: 'vat', label: 'VAT' },
            { key: 'msf', label: 'MSF' },
            { key: 'mst', label: 'MST' },
          ], items),
        }]}
      />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Report Information</h3>
          <StatusBadge value={item.status} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <InfoRow label="Report Type" value={<StatusBadge value={item.report_type} />} />
          <InfoRow label="Location" value={item.location} />
          <InfoRow label="Report Title" value={item.title} />
        </div>
        <InfoRow label="Report Period" value={periodLabel(item)} />
        {item.comment && (
          <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-gray-100">
            <div className="bg-[#6b4423] text-white px-4 py-2.5 text-sm font-semibold">Report Comment / Remarks</div>
            <div className="p-4 bg-amber-50/40">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="font-semibold text-[#6b4423]">{item.submitter?.names || item.user?.names}</span>
                <span>{formatPhpDateTime(item.created_at)}</span>
                <span className="bg-gray-500 text-white px-2 py-0.5 rounded-full">Creator's Remark</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.comment}</p>
            </div>
          </div>
        )}
      </div>

      {(permissions.can_approve || permissions.can_revert || permissions.can_assign || permissions.can_review) && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-5 ring-1 ring-gray-100">
          <div className="bg-[#1e3a1e] text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold">Approval Workflow</h3>
            <StatusBadge value={item.status} />
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {permissions.can_approve && (
              <button disabled={saving} className="bg-[#2f5d31] text-white rounded-lg px-4 py-2.5 text-sm font-medium" onClick={() => act('approve')}>Approve</button>
            )}
            {permissions.can_revert && (
              <button
                disabled={saving}
                className="bg-rose-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium"
                onClick={() => {
                  const reason = window.prompt('Comment required to revert this report');
                  if (reason) act('revert', { comment: reason });
                }}
              >
                Reject
              </button>
            )}
            {permissions.can_review && (
              <button
                disabled={saving}
                className="bg-[#6b4423] text-white rounded-lg px-4 py-2.5 text-sm font-medium"
                onClick={() => {
                  const note = window.prompt('Optional review comment');
                  act('review', { comment: note || '' });
                }}
              >
                Mark Reviewed
              </button>
            )}
            {permissions.reviewer_status === 'REVIEWED' && (
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">Reviewed</span>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="bg-[#2f5d31] text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold">Comments & Discussion</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{comments.length}</span>
          </div>
          <div className="p-4">
            <form onSubmit={sendComment} className="mb-4">
              <textarea maxLength={1000} className={`${inputClass} min-h-20`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{comment.length} / 1000</span>
                <button disabled={saving || !comment.trim()} className="text-sm bg-[#2f5d31] text-white px-3 py-1.5 rounded-lg">Post</button>
              </div>
            </form>
            {comments.length ? comments.map((row) => (
              <div key={row.id} className="py-3 border-t border-gray-100">
                <p className="text-sm font-medium">{row.user?.names || user?.names}</p>
                <p className="text-xs text-gray-400 mb-1">{formatPhpDateTime(row.created_at)}</p>
                <p className="text-sm whitespace-pre-wrap">{row.comment}</p>
              </div>
            )) : <p className="text-sm text-gray-400">No comments yet. Be the first to comment!</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="bg-[#6b4423] text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold">Share / Assigned</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{reviewers.length}</span>
          </div>
          <div className="p-4">
            {permissions.can_assign && (
              <form onSubmit={assignReviewer} className="mb-4 space-y-2">
                <label className={labelClass}>Share with</label>
                <select required className={inputClass} value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
                  <option value="">Select staff</option>
                  <optgroup label="Staff">
                    {otherShareUsers.map((staff) => (
                      <option key={staff.id} value={staff.id}>{staff.names} ({staff.role})</option>
                    ))}
                  </optgroup>
                </select>
                <input required className={inputClass} placeholder="Share / assignment reason" value={assignReason} onChange={(e) => setAssignReason(e.target.value)} />
                <button disabled={saving} className="text-sm bg-[#2f5d31] text-white px-3 py-1.5 rounded-lg">Assign & notify</button>
                <p className="text-xs text-gray-500">You will choose notify priority in the next popup.</p>
                <p className="text-xs text-gray-500">To send ED the missed officers list, use Share missed to ED on the reports list.</p>
              </form>
            )}
            {reviewers.length ? reviewers.map((row) => (
              <div key={row.id} className="py-2 border-b border-gray-100 last:border-0 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{row.reviewer?.names || `User #${row.reviewer_id}`}</p>
                  <p className="text-xs text-gray-400">{row.reviewer?.role}</p>
                  <div className="mt-1"><StatusBadge value={row.status} /></div>
                </div>
                {permissions.can_remove_reviewer && (
                  <button
                    type="button"
                    className="text-xs text-rose-600"
                    onClick={() => act('reviewers/remove', { reviewer_id: row.reviewer_id })}
                  >
                    Remove
                  </button>
                )}
              </div>
            )) : <p className="text-sm text-gray-400">Not shared with anyone yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="bg-[#1e3a1e] text-white px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold">Activity Logs</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{logs.length}</span>
          </div>
          <div className="p-4">
            {logs.length ? logs.map((row) => (
              <div key={row.id} className="py-3 border-b border-gray-100 last:border-0">
                <StatusBadge value={row.status} />
                <p className="text-sm font-medium mt-1">{row.user?.names}</p>
                <p className="text-xs text-gray-400">{formatPhpDateTime(row.created_at, true)}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{row.comment}</p>
              </div>
            )) : <p className="text-sm text-gray-400">No activity yet</p>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 bg-white mb-6">
        <div className="bg-[#1e3a1e] text-white px-4 py-2.5 font-semibold">{item.title}</div>
      </div>

      <SheetTable
        title="NORMAL TIMBER"
        exportName={`normal-timber-${id}`}
        empty="No normal timber items found"
        columns={[
          { key: 'timber_name', label: 'NAME OF TIMBER' },
          { key: 'number_of_timber', label: 'No OF TIMBER', align: 'right', render: (row) => money(row.number_of_timber) },
          { key: 'price', label: 'PRICE OF TIMBER', align: 'right', render: (row) => (row.total ? '—' : money(row.price)) },
          { key: 'total_cost', label: 'TOTAL COST', align: 'right', render: (row) => money(row.total_cost) },
          { key: 'vat', label: 'TVA (18%)', align: 'right', render: (row) => money(row.vat) },
          { key: 'msf', label: 'MSF', align: 'right', render: (row) => money(row.msf) },
          { key: 'vat_and_msf', label: 'TVA+MSF', align: 'right', render: (row) => money(row.vat_and_msf) },
        ]}
        rows={[
          ...normalItems,
          ...(normalItems.length ? [{
            total: true,
            timber_name: 'GRAND TOTAL (Normal)',
            number_of_timber: sum(normalItems, 'number_of_timber'),
            total_cost: sum(normalItems, 'total_cost'),
            vat: sum(normalItems, 'vat'),
            msf: sum(normalItems, 'msf'),
            vat_and_msf: sum(normalItems, 'vat_and_msf'),
          }] : []),
        ]}
      />

      <SheetTable
        title="OTHER TIMBER FOR DIFFERENCE PRICE"
        exportName={`other-timber-${id}`}
        empty="No other timber items found"
        columns={[
          { key: 'timber_name', label: 'NAME OF TIMBER' },
          { key: 'number_of_timber', label: 'No OF TIMBER', align: 'right', render: (row) => money(row.number_of_timber) },
          { key: 'price', label: 'PRICE OF TIMBER', align: 'right', render: (row) => (row.total ? money(row.price) : money(row.price)) },
          { key: 'msf', label: 'MSF', align: 'right', render: (row) => money(row.msf) },
          { key: 'total_cost', label: 'TOTAL COST', align: 'right', render: (row) => money(row.total_cost) },
          { key: 'vat', label: 'VAT (18%)', align: 'right', render: (row) => money(row.vat) },
          { key: 'mst', label: 'MST', align: 'right', render: (row) => money(row.mst) },
          { key: 'vat_and_mst', label: 'TVA+MST', align: 'right', render: (row) => money(row.vat_and_mst) },
        ]}
        rows={[
          ...otherItems,
          ...(otherItems.length ? [{
            total: true,
            timber_name: 'GRAND TOTAL (Other)',
            number_of_timber: sum(otherItems, 'number_of_timber'),
            price: sum(otherItems, 'price'),
            msf: sum(otherItems, 'msf'),
            total_cost: sum(otherItems, 'total_cost'),
            vat: sum(otherItems, 'vat'),
            mst: sum(otherItems, 'mst'),
            vat_and_mst: sum(otherItems, 'vat_and_mst'),
          }] : []),
        ]}
      />

      {(normalItems.length || otherItems.length) ? (
        <SheetTable
          title="COMBINED GRAND TOTALS (All Timber)"
          tone="red"
          exportName={`combined-totals-${id}`}
          columns={[
            { key: 'description', label: 'DESCRIPTION' },
            { key: 'qty', label: 'TOTAL TIMBER', align: 'right' },
            { key: 'cost', label: 'TOTAL COST', align: 'right' },
            { key: 'vat', label: 'TOTAL VAT', align: 'right' },
            { key: 'msf', label: 'TOTAL MSF/MST', align: 'right' },
            { key: 'vatmsf', label: 'TOTAL VAT+MSF/MST', align: 'right' },
          ]}
          rows={[
            { description: 'Normal Timber', qty: money(sum(normalItems, 'number_of_timber')), cost: money(sum(normalItems, 'total_cost')), vat: money(sum(normalItems, 'vat')), msf: money(sum(normalItems, 'msf')), vatmsf: money(sum(normalItems, 'vat_and_msf')) },
            { description: 'Other Timber', qty: money(sum(otherItems, 'number_of_timber')), cost: money(sum(otherItems, 'total_cost')), vat: money(sum(otherItems, 'vat')), msf: money(sum(otherItems, 'msf') + sum(otherItems, 'mst')), vatmsf: money(sum(otherItems, 'vat_and_mst')) },
            { total: true, description: 'COMBINED GRAND TOTAL', qty: money(sum(items, 'number_of_timber')), cost: money(sum(items, 'total_cost')), vat: money(sum(items, 'vat')), msf: money(sum(normalItems, 'msf') + sum(otherItems, 'mst')), vatmsf: money(sum(normalItems, 'vat_and_msf') + sum(otherItems, 'vat_and_mst')) },
          ]}
        />
      ) : null}

      <SheetTable
        title="CUSTOMER INPUTS"
        exportName={`customers-${id}`}
        empty="No customer payments found"
        columns={[
          { key: 'name', label: 'CUSTOMER NAME' },
          { key: 'phone', label: 'PHONE', render: (row) => (row.total ? '—' : (row.phone || 'N/A')) },
          { key: 'amount', label: 'AMOUNT', align: 'right', render: (row) => money(row.amount) },
          { key: 'date', label: 'DATE', render: (row) => (row.total ? '—' : formatPhpDateTime(item.created_at).replace(' at ', ' ')) },
        ]}
        rows={customers.length ? [
          ...customers,
          { total: true, name: 'TOTAL CUSTOMER PAYMENTS', phone: '—', amount: sum(customers, 'amount') },
        ] : []}
      />

      <SheetTable
        title="PAYMENT SUMMARY"
        exportName={`payments-${id}`}
        empty="No payment records found"
        columns={[
          { key: 'method', label: 'PAYMENT METHOD', render: (row) => (row.total ? row.method : <PaymentMethodBadge method={row.method} />) },
          { key: 'amount', label: 'AMOUNT', align: 'right', render: (row) => money(row.amount) },
          { key: 'date', label: 'DATE', render: (row) => (row.total ? '—' : formatPhpDateTime(item.created_at).replace(' at ', ' ')) },
        ]}
        rows={[
          ...payments,
          { total: true, method: 'TOTAL PAYMENTS', amount: sum(payments, 'amount') },
        ]}
      />

      <p className="text-center mb-4">
        <span className="inline-flex items-center rounded-lg bg-[#2f5d31] text-white text-sm px-3 py-1.5">
          Report created on {formatPhpDateTime(item.created_at, true)}
        </span>
      </p>

      <SheetTable
        title="TIMBER SUMMARY"
        tone="green"
        exportName={`timber-summary-${id}`}
        columns={[
          { key: 'name', label: 'TIMBER NAME' },
          { key: 'qty', label: 'QUANTITY', align: 'right' },
        ]}
        rows={[
          ...Object.entries(timberGroups).sort(([a], [b]) => a.localeCompare(b)).map(([name, qty]) => ({ name, qty: money(qty) })),
          { total: true, name: 'TOTAL TIMBER', qty: money(sum(items, 'number_of_timber')) },
        ]}
      />
      {notifyModal}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-800">{value || '—'}</div>
    </div>
  );
}
