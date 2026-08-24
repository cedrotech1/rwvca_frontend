import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarPlus } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import {
  LEAVE_TYPES,
  LeaveBalanceSummary,
  LeaveDirectWorkflowAlert,
  LeaveDistributionPreview,
} from './leaveShared';

const currentYear = new Date().getFullYear();

export default function CreateLeaveRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [form, setForm] = useState({
    leave_type: '',
    year: String(currentYear),
    requested_days: '',
    leave_from: '',
    return_date: '',
  });
  const [letter, setLetter] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [scheduleCheck, setScheduleCheck] = useState(null);

  useEffect(() => {
    api.get('/leave-requests/balance')
      .then((res) => setBalance(res.data || null))
      .catch(() => setError('Could not load your leave balance.'))
      .finally(() => setLoadingBalance(false));
  }, []);

  useEffect(() => {
    if (!form.leave_from || !form.return_date) {
      setScheduleCheck(null);
      return;
    }
    api.get('/leave-requests/schedule-check', {
      leave_from: form.leave_from,
      return_date: form.return_date,
    })
      .then((res) => setScheduleCheck(res.data || null))
      .catch(() => setScheduleCheck({ covered: false, message: 'Could not verify leave schedule.' }));
  }, [form.leave_from, form.return_date]);

  const totalAvailable = Number(balance?.total_available_days || 0);
  const canSubmit = totalAvailable > 0 && scheduleCheck?.covered !== false;

  const daysWarning = useMemo(() => {
    const days = Number(form.requested_days || 0);
    if (!days) return '';
    if (days > totalAvailable) {
      let message = `Requested days (${days}) exceed your available leave balance (${totalAvailable} days).`;
      if (Number(balance?.carry_over_remaining) > 0) {
        message += ` You have ${balance.carry_over_remaining} carry-over days available from ${balance.previous_year}.`;
      }
      return message;
    }
    return '';
  }, [form.requested_days, totalAvailable, balance]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!form.leave_type) throw new Error('Please select your leave reason.');
      if (!form.leave_from || !form.return_date) throw new Error('Please select both leave from and return dates.');
      if (new Date(form.leave_from) > new Date(form.return_date)) {
        throw new Error('Return date must be after start date.');
      }
      const requestedDays = Number(form.requested_days);
      if (!requestedDays || requestedDays < 1) throw new Error('Requested days must be at least 1.');
      if (requestedDays > totalAvailable) throw new Error(daysWarning || 'Requested days exceed your available balance.');
      if (!letter) throw new Error('Please upload a supporting letter or document.');
      if (scheduleCheck && !scheduleCheck.covered) {
        throw new Error(scheduleCheck.message || 'You must pre-schedule these leave dates before submitting a request.');
      }

      const data = new FormData();
      data.append('leave_type', form.leave_type);
      data.append('year', form.year);
      data.append('requested_days', String(requestedDays));
      data.append('leave_from', form.leave_from);
      data.append('return_date', form.return_date);
      data.append('supporting_letter', letter);

      await api.upload('post', '/leave-requests', data);
      navigate('/dashboard/leave-requests');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not submit leave request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading icon={<CalendarPlus className="h-6 w-6" />} title="Apply for Leave" subtitle="Submit a new leave request for approval" showBack backTo="/dashboard/leave-requests" />

      {loadingBalance ? (
        <p className="text-sm text-gray-500">Loading leave balance...</p>
      ) : (
        <>
          {balance && <LeaveBalanceSummary balance={balance} userName={user?.names} />}
          <LeaveDirectWorkflowAlert role={user?.role} />
        </>
      )}

      {!loadingBalance && !canSubmit && totalAvailable <= 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have no available leave days for {currentYear}. Contact HR if you believe this is incorrect.
        </div>
      )}

      {scheduleCheck && form.leave_from && form.return_date && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${scheduleCheck.covered ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
          {scheduleCheck.covered ? (
            <p>{scheduleCheck.message || 'Your requested dates are covered by a pre-scheduled leave entry.'}</p>
          ) : (
            <p className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                <strong>Leave Schedule Restriction:</strong> {scheduleCheck.message || 'No pre-scheduled leave covers these dates.'}
                {' '}
                <Link to="/dashboard/create/leave-schedule" className="font-medium underline">Create leave schedule</Link>
                {' '}first, then return here to submit your request.
              </span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="max-w-4xl space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">New Leave Request</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Employee</label>
            <input readOnly className={`${inputClass} bg-gray-100`} value={user?.names || ''} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input readOnly className={`${inputClass} bg-gray-100`} value={user?.email || ''} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Leave Reason *</label>
            <select
              required
              disabled={!canSubmit}
              className={inputClass}
              value={form.leave_type}
              onChange={(e) => setField('leave_type', e.target.value)}
            >
              <option value="">Select your leave reason</option>
              {LEAVE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <input readOnly className={`${inputClass} bg-gray-100`} value={form.year} />
          </div>
          <div>
            <label className={labelClass}>Requested Days *</label>
            <input
              required
              type="number"
              min="1"
              max={totalAvailable || undefined}
              disabled={!canSubmit}
              className={inputClass}
              value={form.requested_days}
              onChange={(e) => setField('requested_days', e.target.value)}
              placeholder="Enter number of days (e.g., 5)"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum available: {totalAvailable} days</p>
            {daysWarning && <p className="mt-1 text-xs font-medium text-rose-600">{daysWarning}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Leave From *</label>
            <input
              required
              type="date"
              disabled={!canSubmit}
              className={inputClass}
              value={form.leave_from}
              onChange={(e) => setField('leave_from', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Return Date *</label>
            <input
              required
              type="date"
              disabled={!canSubmit}
              className={inputClass}
              value={form.return_date}
              onChange={(e) => setField('return_date', e.target.value)}
            />
          </div>
        </div>

        <LeaveDistributionPreview
          requestedDays={form.requested_days}
          leaveType={form.leave_type}
          balance={balance}
        />

        <div>
          <label className={labelClass}>Supporting Letter / Document *</label>
          <input
            required
            type="file"
            disabled={!canSubmit}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className={inputClass}
            onChange={(e) => setLetter(e.target.files?.[0] || null)}
          />
          <p className="mt-1 text-xs text-gray-500">PDF, Word, JPG/PNG – max 5MB</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            disabled={!canSubmit}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700"
            onClick={() => {
              setForm({
                leave_type: '',
                year: String(currentYear),
                requested_days: '',
                leave_from: '',
                return_date: '',
              });
              setLetter(null);
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || !canSubmit || Boolean(daysWarning)}
            className="rounded-lg bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
