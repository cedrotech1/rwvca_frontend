import { AlertTriangle, CalendarCheck, Info, ShieldCheck } from 'lucide-react';

export const LEAVE_TYPES = [
  { value: 'Annual', label: 'Annual Leave' },
  { value: 'Maternity', label: 'Maternity Leave' },
  { value: 'Paternity', label: 'Paternity Leave' },
  { value: 'Sick', label: 'Sick Leave' },
  { value: 'Compassionate', label: 'Compassionate Leave' },
  { value: 'Others', label: 'Others' },
];

export function isDirectLeaveApplicant(role) {
  const value = String(role || '').trim().toLowerCase();
  return value === 'ed' || value === 'chairman';
}

export function directLeaveApproverLabel(role) {
  return String(role || '').trim().toLowerCase() === 'ed' ? 'Chairman' : 'Executive Director';
}

function pct(used, allowed) {
  if (!allowed) return 0;
  return Math.min(100, (used / allowed) * 100);
}

function progressClass(percentage) {
  if (percentage >= 80) return 'bg-rose-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function calcDistribution(requestedDays, balance) {
  const total = Number(balance?.total_available_days || 0);
  const carryRemaining = Number(balance?.carry_over_remaining || 0);
  const currentRemaining = Number(balance?.current_remaining || 0);
  const days = Number(requestedDays || 0);
  let fromCarryOver = 0;
  let fromCurrent = 0;
  if (carryRemaining > 0) {
    fromCarryOver = Math.min(days, carryRemaining);
    fromCurrent = days - fromCarryOver;
  } else {
    fromCurrent = days;
  }
  return {
    fromCarryOver,
    fromCurrent,
    remainingAfter: total - days,
    carryLeft: Math.max(0, carryRemaining - fromCarryOver),
    currentLeft: Math.max(0, currentRemaining - fromCurrent),
  };
}

function SummaryCard({ title, badge, badgeClass, children, footer, className = 'border-l-[#105701]' }) {
  return (
    <div className={`rounded-lg border-l-4 bg-emerald-50/80 p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h6 className="text-sm font-semibold text-gray-800">{title}</h6>
        {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}>{badge}</span>}
      </div>
      {children}
      {footer && <p className="mt-2 text-xs text-gray-500">{footer}</p>}
    </div>
  );
}

function Metric({ label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="rounded bg-white/80 p-2 text-center">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-base font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

export function LeaveBalanceSummary({ balance, userName, compact = false }) {
  if (!balance) return null;

  const {
    current_year: currentYear,
    previous_year: previousYear,
    current_allowed: currentAllowed,
    previous_allowed: previousAllowed,
    carry_over_available: carryOverAvailable,
    carry_over_used: carryOverUsed,
    carry_over_remaining: carryOverRemaining,
    current_year_used: currentUsed,
    current_remaining: currentRemaining,
    total_available_days: totalAvailable,
  } = balance;

  const prevUsedDisplay = Math.max(0, Number(previousAllowed) - Number(carryOverAvailable) + Number(carryOverUsed));
  const prevRemainingDisplay = Math.max(0, Number(previousAllowed) - prevUsedDisplay);
  const currentPct = pct(currentUsed, currentAllowed);

  return (
    <div className={compact ? 'space-y-3' : 'mb-6 space-y-4'}>
      {!compact && (
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <CalendarCheck size={18} className="text-[#2f5d31]" />
          {userName ? `${userName}'s Leave Days Summary` : 'Leave Days Summary'}
        </h3>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <SummaryCard
          title={String(previousYear)}
          badge="Carry-over Source"
          badgeClass="bg-amber-100 text-amber-800"
        >
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Allowed" value={previousAllowed} valueClass="text-emerald-700" />
            <Metric label="Used" value={prevUsedDisplay} valueClass="text-amber-700" />
            <Metric label="Remaining" value={prevRemainingDisplay} valueClass="text-sky-700" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {carryOverUsed > 0
              ? `Used ${carryOverUsed} day(s) as carry-over in ${currentYear}`
              : `${carryOverRemaining} day(s) available for carry-over to ${currentYear}`}
          </p>
        </SummaryCard>

        <SummaryCard
          title={String(currentYear)}
          badge="Current Year"
          badgeClass="bg-[#2f5d31] text-white"
        >
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Allowed" value={currentAllowed} valueClass="text-emerald-700" />
            <Metric label="Used" value={currentUsed} valueClass={currentUsed > currentAllowed ? 'text-rose-600' : 'text-amber-700'} />
            <Metric label="Balance" value={currentRemaining} valueClass={currentRemaining <= 3 ? 'text-amber-700' : 'text-emerald-700'} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full ${progressClass(currentPct)}`} style={{ width: `${currentPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">Used {currentUsed} day(s) from current year allocation</p>
        </SummaryCard>

        <SummaryCard
          title="Total Available Leave"
          className="border-l-sky-500 bg-sky-50/80"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-[#2f5d31]">{totalAvailable} days</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Carry-over: {carryOverRemaining}
              </span>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
                Current: {currentRemaining}
              </span>
            </div>
          </div>
        </SummaryCard>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-900">
          <Info size={16} /> Leave Balance Summary
        </h4>
        {carryOverRemaining > 0 && (
          <div className="mb-2 flex items-center justify-between text-sm">
            <span><strong>{previousYear} Carry-over:</strong></span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{carryOverRemaining} days available</span>
          </div>
        )}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm">
            <span><strong>{currentYear} Current Year:</strong></span>
            <span className="rounded-full bg-[#2f5d31]/10 px-2 py-0.5 text-xs font-semibold text-[#2f5d31]">{currentRemaining} days available</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full ${progressClass(currentPct)}`} style={{ width: `${currentPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Used {currentUsed} of {currentAllowed} days</p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-sky-200 pt-3 text-sm">
          <span><strong>Total Available Leave:</strong></span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-800">{totalAvailable} days</span>
        </div>
        {carryOverRemaining > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Your {carryOverRemaining} carry-over days will be used first, then current year days.
          </p>
        )}
      </div>
    </div>
  );
}

export function LeaveDirectWorkflowAlert({ role }) {
  if (!isDirectLeaveApplicant(role)) return null;
  return (
    <div className="mb-4 rounded-lg border-l-4 border-sky-500 bg-sky-50 p-4">
      <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-sky-900">
        <ShieldCheck size={16} /> Special Approval Workflow
      </h4>
      <p className="text-sm text-sky-900">
        <strong>Direct Approval Process:</strong> As a {role}, your leave request will be sent directly to{' '}
        <strong>{directLeaveApproverLabel(role)}</strong> for approval without HR involvement.
      </p>
    </div>
  );
}

export function LeaveDistributionPreview({ requestedDays, leaveType, balance }) {
  const days = Number(requestedDays || 0);
  if (days <= 0 || !leaveType || !balance) return null;

  const {
    fromCarryOver,
    fromCurrent,
    remainingAfter,
    carryLeft,
    currentLeft,
  } = calcDistribution(days, balance);

  const totalAvailable = Number(balance.total_available_days || 0);
  const exceeds = days > totalAvailable;

  return (
    <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
        Leave Distribution Preview
      </p>
      {fromCarryOver > 0 && fromCurrent > 0 ? (
        <p className="text-sm text-gray-700">
          <span className="mr-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{fromCarryOver} days</span>
          from {balance.previous_year} carry-over +{' '}
          <span className="mx-1 rounded-full bg-[#2f5d31]/10 px-2 py-0.5 text-xs font-semibold text-[#2f5d31]">{fromCurrent} days</span>
          from {balance.current_year} current year
        </p>
      ) : fromCarryOver > 0 ? (
        <p className="text-sm text-gray-700">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{fromCarryOver} days</span>
          {' '}from {balance.previous_year} carry-over only
        </p>
      ) : (
        <p className="text-sm text-gray-700">
          <span className="rounded-full bg-[#2f5d31]/10 px-2 py-0.5 text-xs font-semibold text-[#2f5d31]">{fromCurrent} days</span>
          {' '}from {balance.current_year} current year only
        </p>
      )}
      <div className="mt-3 space-y-1 border-t border-emerald-200 pt-3 text-sm">
        <div className="flex justify-between">
          <span>Remaining after request:</span>
          <strong className={remainingAfter < 0 ? 'text-rose-600' : 'text-emerald-700'}>{remainingAfter} days</strong>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Carry-over left:</span>
          <span>{carryLeft} days</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Current year left:</span>
          <span>{currentLeft} days</span>
        </div>
      </div>
      {exceeds && (
        <p className="mt-2 flex items-center gap-1 text-sm font-medium text-rose-600">
          <AlertTriangle size={14} />
          Exceeds available balance by {days - totalAvailable} days!
        </p>
      )}
    </div>
  );
}

export function LeaveRequestDistribution({ item }) {
  if (!item) return null;
  const carry = Number(item.carry_over_days_used || 0);
  const current = Number(item.current_year_days_used || 0);
  const total = Number(item.requested_days || 0);
  if (!total) return null;

  return (
    <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
      <p className="mb-2 text-sm font-semibold text-gray-800">Leave distribution for this request</p>
      {carry > 0 && current > 0 ? (
        <p className="text-sm text-gray-700">
          {carry} day(s) from {item.carry_over_year || 'previous year'} carry-over and {current} day(s) from {item.current_year_val || item.year} current year ({total} total).
        </p>
      ) : carry > 0 ? (
        <p className="text-sm text-gray-700">All {total} day(s) from {item.carry_over_year || 'previous year'} carry-over.</p>
      ) : (
        <p className="text-sm text-gray-700">All {total} day(s) from {item.current_year_val || item.year} current year.</p>
      )}
    </div>
  );
}
