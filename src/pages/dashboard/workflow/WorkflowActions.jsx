import { useState } from 'react';
import api from '../../../services/api';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import { useStaffOptions } from './helpers';

const STAMP_OPTIONS = [
  { value: 'signature_only', label: 'Signature only' },
  { value: 'stamp_with_signature', label: 'Stamp with signature' },
];

function ActionButton({ children, onClick, disabled, tone = 'primary' }) {
  const tones = {
    primary: 'bg-[#2f5d31] text-white',
    success: 'bg-emerald-700 text-white',
    danger: 'bg-red-600 text-white',
    warn: 'bg-amber-600 text-white',
    muted: 'bg-gray-100 text-gray-800',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${tones[tone] || tones.primary}`}
    >
      {children}
    </button>
  );
}

export default function WorkflowActions({
  workflow,
  item,
  apiPath,
  id,
  onDone,
  extraAction,
}) {
  const [comment, setComment] = useState('');
  const [days, setDays] = useState(item.days_authorized || item.days_requested || item.requested_days || '');
  const [stamp, setStamp] = useState(item.ed_signature_and_stamp === 'stamp_with_signature' ? 'stamp_with_signature' : 'signature_only');
  const [financeStatus, setFinanceStatus] = useState(item.finance_status || extraAction?.options?.[0]?.value || 'pending');
  const [shareIds, setShareIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { users } = useStaffOptions();
  const permissions = item.permissions || {};

  const run = async (method, path, body) => {
    setSaving(true);
    setError('');
    try {
      const url = path.replace(':id', id);
      if (method === 'put') await api.put(url, body);
      else await api.post(url, body);
      setComment('');
      await onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const status = item.mission_requests_status || item.leave_requests_status || item.status;
  const pendingLike = ['pending', 'edited', 'reverted'].includes(status);

  const blocks = [];

  if (workflow === 'mission' || workflow === 'leave') {
    const verifyPath = `${apiPath}/:id/hr-verify`;
    const revertPath = `${apiPath}/:id/hr-revert`;
    const approvePath = `${apiPath}/:id/approve`;
    const rejectPath = `${apiPath}/:id/reject`;
    const canVerify = permissions.can_hr_act && (workflow === 'leave' ? status === 'pending' : pendingLike);
    const canRevert = permissions.can_hr_act && ['pending', 'edited', 'verified_by_hr', 'approved', 'reverted'].includes(status);
    const canHrReject = workflow === 'mission' && permissions.can_hr_act && pendingLike;
    const canEdAct = Boolean(permissions.can_approve);

    if (canVerify || canRevert || canHrReject || canEdAct) {
      blocks.push(
        <div key="hr-ed" className="space-y-3">
          <p className="font-semibold text-gray-800">Workflow actions</p>
          {(canVerify || canEdAct) && (
            <label className="block text-sm text-gray-600">
              Days authorized
              <input className={`mt-1 ${inputClass}`} type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
            </label>
          )}
          {canEdAct && (
            <label className="block text-sm text-gray-600">
              ED signature
              <select className={`mt-1 ${inputClass}`} value={stamp} onChange={(e) => setStamp(e.target.value)}>
                {STAMP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm text-gray-600">
            Comment / reason
            <textarea className={`mt-1 min-h-20 ${inputClass}`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional except for reject / revert" />
          </label>
          <div className="flex flex-wrap gap-2">
            {canVerify && (
              <ActionButton disabled={saving} tone="success" onClick={() => run('post', verifyPath, { days_authorized: Number(days) || undefined, comment })}>
                {saving ? 'Saving...' : 'HR Verify'}
              </ActionButton>
            )}
            {canRevert && (
              <ActionButton disabled={saving || !comment.trim()} tone="warn" onClick={() => run('post', revertPath, { comment })}>
                HR Revert
              </ActionButton>
            )}
            {canHrReject && (
              <ActionButton disabled={saving} tone="danger" onClick={() => run('post', rejectPath, { reason: comment, comment })}>
                HR Reject
              </ActionButton>
            )}
            {canEdAct && (
              <>
                <ActionButton disabled={saving} onClick={() => run('post', approvePath, { days_authorized: Number(days) || undefined, ed_signature_and_stamp: stamp, comment })}>
                  Approve
                </ActionButton>
                <ActionButton disabled={saving} tone="danger" onClick={() => run('post', rejectPath, { reason: comment, comment })}>
                  Reject
                </ActionButton>
              </>
            )}
          </div>
        </div>
      );
    }
  }

  if (workflow === 'requisition' || workflow === 'vehicle') {
    const canVerify = permissions.can_verify || permissions.can_logistic_act;
    const canApprove = permissions.can_approve || permissions.can_executive_act;
    const canReject = permissions.can_reject || permissions.can_logistic_act || permissions.can_executive_act || canApprove;
    const canRevert = permissions.can_revert || permissions.can_logistic_act || canApprove;
    const showVerify = canVerify && status === 'pending';
    const showApprove = (canApprove && ['pending', 'verification_process'].includes(status))
      || (permissions.can_logistic_act && status === 'verification_process');
    const showReject = canReject && ['pending', 'verification_process'].includes(status);
    const showRevert = canRevert && ['pending', 'verification_process'].includes(status);
    const showAuthorize = permissions.can_authorize || permissions.can_ed_authorize;

    if (showVerify || showApprove || showReject || showRevert || showAuthorize || permissions.can_finance) {
      blocks.push(
        <div key="req" className="space-y-3">
          <p className="font-semibold text-gray-800">Workflow actions</p>
          {(showAuthorize || showApprove) && (
            <label className="block text-sm text-gray-600">
              ED signature
              <select className={`mt-1 ${inputClass}`} value={stamp} onChange={(e) => setStamp(e.target.value)}>
                {STAMP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm text-gray-600">
            Comment / reason
            <textarea className={`mt-1 min-h-20 ${inputClass}`} value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            {showVerify && (
              <ActionButton disabled={saving} tone="success" onClick={() => run('post', `${apiPath}/:id/status`, { status: 'verification_process', comment })}>
                Verify
              </ActionButton>
            )}
            {showApprove && (
              <ActionButton disabled={saving} onClick={() => run('post', `${apiPath}/:id/status`, { status: 'approved', comment, ed_signature_and_stamp: stamp })}>
                Approve
              </ActionButton>
            )}
            {showRevert && (
              <ActionButton disabled={saving} tone="warn" onClick={() => run('post', `${apiPath}/:id/status`, { status: 'reverted', reason: comment, comment })}>
                Revert
              </ActionButton>
            )}
            {showReject && (
              <ActionButton disabled={saving} tone="danger" onClick={() => run('post', `${apiPath}/:id/status`, { status: 'rejected', reason: comment, comment })}>
                Reject
              </ActionButton>
            )}
            {showAuthorize && (
              <ActionButton disabled={saving} onClick={() => run('post', `${apiPath}/:id/authorize`, { ed_signature_and_stamp: stamp, comment })}>
                Authorize
              </ActionButton>
            )}
          </div>
          {permissions.can_finance && extraAction && (
            <div className="pt-2">
              <label className={labelClass}>{extraAction.label || 'Finance status'}</label>
              <select className={`mt-1 ${inputClass}`} value={financeStatus} onChange={(e) => setFinanceStatus(e.target.value)}>
                {(extraAction.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <div className="mt-2">
                <ActionButton disabled={saving} onClick={() => run('put', extraAction.path, { [extraAction.field]: financeStatus, comment })}>
                  {extraAction.submitLabel || 'Update finance status'}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  if (workflow === 'leave-schedule') {
    if (permissions.can_mark_hr_read || permissions.can_mark_ed_read || permissions.can_approve || permissions.can_reject) {
      blocks.push(
        <div key="schedule" className="space-y-3">
          <p className="font-semibold text-gray-800">HR / ED actions</p>
          <label className="block text-sm text-gray-600">
            Comment
            <textarea className={`mt-1 min-h-20 ${inputClass}`} value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            {permissions.can_mark_hr_read && (
              <ActionButton disabled={saving} tone="muted" onClick={() => run('post', `${apiPath}/:id/read`, { mark_type: 'hr' })}>
                Mark HR read
              </ActionButton>
            )}
            {permissions.can_mark_ed_read && (
              <ActionButton disabled={saving} tone="muted" onClick={() => run('post', `${apiPath}/:id/read`, { mark_type: 'ed' })}>
                Mark ED read
              </ActionButton>
            )}
            {permissions.can_approve && (
              <ActionButton disabled={saving} tone="success" onClick={() => run('post', `${apiPath}/:id/status`, { status: 'approved', comment })}>
                Approve
              </ActionButton>
            )}
            {permissions.can_reject && (
              <ActionButton disabled={saving} tone="danger" onClick={() => run('post', `${apiPath}/:id/status`, { action: 'reject', status: 'rejected', comment })}>
                Reject
              </ActionButton>
            )}
          </div>
        </div>
      );
    }
  }

  if (workflow === 'document') {
    blocks.push(
      <div key="share" className="space-y-3">
        <p className="font-semibold text-gray-800">Share document</p>
        <select
          multiple
          className={`${inputClass} min-h-28`}
          value={shareIds}
          onChange={(e) => setShareIds(Array.from(e.target.selectedOptions).map((option) => option.value))}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.names} ({user.role})</option>
          ))}
        </select>
        <ActionButton disabled={saving || !shareIds.length} onClick={() => run('post', `${apiPath}/:id/share`, { user_ids: shareIds })}>
          Share
        </ActionButton>
      </div>
    );
  }

  if (!blocks.length) return extraAction && extraAction.when?.(item) ? (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run('put', extraAction.path, { [extraAction.field]: financeStatus, comment });
      }}
      className="space-y-3"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <label className={labelClass}>{extraAction.label}</label>
      <select className={inputClass} value={financeStatus} onChange={(e) => setFinanceStatus(e.target.value)}>
        {(extraAction.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ActionButton disabled={saving}>{saving ? 'Saving...' : extraAction.submitLabel || 'Update'}</ActionButton>
    </form>
  ) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mt-4 space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {blocks}
    </div>
  );
}
