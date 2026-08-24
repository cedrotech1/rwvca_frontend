import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import OfficialDocument, {
  FormRow,
  SignatureLine,
  edStampSrc,
  formatDocDate,
  moneyWords,
} from './OfficialDocument';

function useOfficialRecord(apiPath) {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`${apiPath}/${id}`),
      api.get('/settings').catch(() => ({ data: null })),
    ]).then(([res, settingsRes]) => {
      if (!active) return;
      setItem(res.data);
      setSettings(settingsRes.data);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'Document not found');
    });
    return () => { active = false; };
  }, [apiPath, id]);

  return { item, settings, error, loading: !item && !error };
}

function missionBanner(item) {
  const status = item.mission_requests_status;
  const special = ['ED', 'Chairman'].includes(item.user?.role);
  if (status === 'approved') return 'FULLY APPROVED';
  if (status === 'verified_by_hr') return 'VERIFIED BY HR – AWAITING ED APPROVAL';
  if (status === 'pending') return special ? 'AWAITING ED/CHAIRMAN APPROVAL' : 'PENDING HR VERIFICATION';
  if (status === 'edited') return 'EDITED – PENDING HR REVIEW';
  if (status === 'reverted') return 'REVERTED TO PENDING';
  if (String(status || '').startsWith('rejected')) return 'REJECTED';
  return String(status || '').replace(/_/g, ' ').toUpperCase();
}

function leaveBanner(item) {
  const status = item.leave_requests_status;
  const special = ['ED', 'Chairman'].includes(item.user?.role);
  if (status === 'approved') return 'FULLY APPROVED';
  if (status === 'verified_by_hr') return 'VERIFIED BY HR – AWAITING ED APPROVAL';
  if (status === 'pending') return special ? 'AWAITING ED/CHAIRMAN APPROVAL' : 'PENDING HR VERIFICATION';
  if (status === 'reverted') return 'REVERTED TO PENDING';
  if (status === 'rejected') return 'REJECTED';
  return String(status || '').replace(/_/g, ' ').toUpperCase();
}

export function MissionDocumentPage() {
  const { item, settings, error, loading } = useOfficialRecord('/mission-requests');
  const special = ['ED', 'Chairman'].includes(item?.user?.role);
  const showHr = item && !special && item.hr_verification_status === 'verified';
  const showEd = item?.executive_verification_status === 'verified';
  const edSrc = edStampSrc(item?.ed_signature_and_stamp, settings, item?.executive?.signature_url);

  return (
    <OfficialDocument title="Travel Clearance" loading={loading} error={error} banner={item ? missionBanner(item) : ''}>
      {item && (
        <>
          <FormRow label="Name :">{item.user?.names}</FormRow>
          <FormRow label="Job title :">{item.user?.role}</FormRow>
          <FormRow label="Authorized to travel to:">{item.destination}</FormRow>
          <FormRow label="Purpose :">{item.purpose}</FormRow>
          <FormRow label="Sponsor :">RWVCA</FormRow>
          <FormRow label="Departure date :">{formatDocDate(item.departure_date)}</FormRow>
          <FormRow label="Date of return :">{formatDocDate(item.return_date)}</FormRow>
          <p className="mt-24 text-center">
            <strong>Done at Kigali, on</strong> {formatDocDate(item.created_at)}
          </p>
          <div className="mt-16">
            {showHr && <SignatureLine label="HR Officer:" name={item.hr?.names} src={item.hr?.signature_url} />}
            {showEd && (
              <SignatureLine
                label="Executive Director:"
                name={item.executive?.names}
                src={edSrc}
                tall={item.ed_signature_and_stamp === 'stamp_with_signature' || item.ed_signature_and_stamp === 'yes'}
              />
            )}
          </div>
        </>
      )}
    </OfficialDocument>
  );
}

export function LeaveDocumentPage() {
  const { item, settings, error, loading } = useOfficialRecord('/leave-requests');
  const special = ['ED', 'Chairman'].includes(item?.user?.role);
  const showHr = item && !special && item.hr_verification_status === 'verified';
  const showEd = item?.executive_verification_status === 'verified';
  const edSrc = edStampSrc(item?.ed_signature_and_stamp, settings, item?.executive?.signature_url);
  const authorized = Number(item?.days_authorized || item?.requested_days || 0);
  const remaining = Number(item?.balance?.total_available_days ?? 0);
  const carry = Number(item?.carry_over_days_used || 0);
  const current = Number(item?.current_year_days_used || 0);
  const yearNote = carry > 0 && current > 0
    ? `(${carry} days from ${item.carry_over_year || item.year - 1} + ${current} days from ${item.year})`
    : carry > 0
      ? `(Using ${carry} carry-over days from ${item.carry_over_year || item.year - 1})`
      : '';

  return (
    <OfficialDocument title="Leave Request Form" loading={loading} error={error} banner={item ? leaveBanner(item) : ''}>
      {item && (
        <>
          <FormRow label="Employee Full Name :">{item.user?.names}</FormRow>
          <FormRow label="Employee Position :">{item.user?.role}</FormRow>
          <FormRow label="Year :">{item.year} {yearNote}</FormRow>
          <FormRow label="Leave start Date :">{formatDocDate(item.leave_from)}</FormRow>
          <FormRow label="Employee return Date :">{formatDocDate(item.return_date)}</FormRow>
          <FormRow label="Number of Days Requested :">{item.requested_days} day{Number(item.requested_days) === 1 ? '' : 's'}</FormRow>
          <FormRow label="Number of Days Authorized :">{authorized} day{authorized === 1 ? '' : 's'}</FormRow>
          <FormRow label="Remaining Leave Balance :">{remaining} day{remaining === 1 ? '' : 's'}</FormRow>
          <FormRow label="Leave Type :">{item.leave_type} Leave</FormRow>
          {(item.leave_type === 'Compassionate' || item.leave_type === 'Others') && (
            <FormRow label="Reason :">{item.reason || (item.leave_type === 'Compassionate' ? 'Compassionate leave' : '')}</FormRow>
          )}
          <FormRow label="Done at Kigali, on :">{formatDocDate(item.created_at)}</FormRow>
          <div className="mt-10">
            <SignatureLine label="Name and signature of the applicant :" name={item.user?.names} src={item.user?.signature_url} />
            {showHr && <SignatureLine label="Name and signature of HR Officer :" name={item.hr?.names} src={item.hr?.signature_url} />}
            {showEd && (
              <SignatureLine
                label="Executive Director :"
                name={item.executive?.names}
                src={edSrc}
                tall={item.ed_signature_and_stamp === 'stamp_with_signature' || item.ed_signature_and_stamp === 'yes'}
              />
            )}
          </div>
        </>
      )}
    </OfficialDocument>
  );
}

export function RequisitionDocumentPage() {
  const { item, settings, error, loading } = useOfficialRecord('/requisitions');
  const rows = item?.requisitionitems_requisition_id || [];
  const total = Number(item?.total_amount_requested || rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0));
  const padded = [...rows];
  while (padded.length < 5) padded.push({ empty: true });
  const edSrc = edStampSrc(item?.ed_signature_and_stamp, settings, item?.approver?.signature_url);

  return (
    <OfficialDocument title="Requisition Form" loading={loading} error={error}>
      {item && (
        <>
          <p className="mb-4"><strong>DATE:</strong> {formatDocDate(item.created_at || item.date)}</p>
          <div className="mb-6">
            <p className="font-bold">DEPARTMENT / COST CENTER</p>
            <p className="mt-2 flex justify-between">
              <strong>{item.department?.name || 'OPERATIONS'}</strong>
              <span><strong>Budget Source:</strong> {item.budget_source}</span>
            </p>
            <p className="mt-3">
              <strong>Account:</strong> {item.account_code}
              <span className="ml-10"><strong>Code:</strong> {item.account_code}</span>
            </p>
          </div>
          <table className="mb-4 w-full border-collapse text-[11pt]">
            <thead>
              <tr className="bg-[#d9d9d9]">
                <th className="w-10 border border-black p-1.5">S/N</th>
                <th className="border border-black p-1.5 text-left">Description / Specifications</th>
                <th className="w-20 border border-black p-1.5">Quantity</th>
                <th className="w-24 border border-black p-1.5">Unit price</th>
                <th className="w-28 border border-black p-1.5">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {padded.map((row, index) => (
                <tr key={row.id || `empty-${index}`}>
                  <td className="border border-black p-1.5 text-center">{index + 1}</td>
                  <td className="border border-black p-1.5">{row.empty ? '\u00a0' : row.description}</td>
                  <td className="border border-black p-1.5 text-right">{row.empty ? '' : Number(row.quantity).toLocaleString()}</td>
                  <td className="border border-black p-1.5 text-right">{row.empty ? '' : Number(row.unit_price).toLocaleString()}</td>
                  <td className="border border-black p-1.5 text-right">{row.empty ? '' : Number(row.total_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="mb-6 w-full border-collapse">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">TOTAL AMOUNT REQUESTED</td>
                <td className="w-[200px] border border-black p-2 text-right font-bold">{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p className="mb-10">
            <strong>Amount in words:</strong>
            <br /><br />
            {item.amount_in_words || moneyWords(total)}
          </p>
          <SignatureLine label="Prepared by:" name={item.preparer?.names} src={item.preparer?.signature_url} />
          {item.verifier?.names && (
            <SignatureLine
              label={`Verified by:${item.verified_at ? `  Date: ${formatDocDate(item.verified_at)}` : ''}`}
              name={item.verifier.names}
              src={item.verifier.signature_url}
            />
          )}
          {item.approver?.names && (
            <SignatureLine
              label="Approved by:"
              name={item.approver.names}
              src={edSrc}
              tall={item.ed_signature_and_stamp === 'stamp_with_signature' || item.ed_signature_and_stamp === 'yes'}
            />
          )}
          {item.authorizer?.names && (
            <SignatureLine
              label={`Authorized by:${item.authorized_at ? `  Date: ${formatDocDate(item.authorized_at)}` : ''}`}
              name={item.authorizer.names}
              src={item.authorizer.signature_url}
            />
          )}
        </>
      )}
    </OfficialDocument>
  );
}

export function VehicleDocumentPage() {
  const { item, settings, error, loading } = useOfficialRecord('/special-requisitions');
  const edSrc = edStampSrc(item?.ed_signature_and_stamp, settings, item?.authorizer?.signature_url || item?.approver?.signature_url);

  return (
    <OfficialDocument title="Vehicle Utilization Form" loading={loading} error={error} banner={String(item?.status || '').replace(/_/g, ' ').toUpperCase()}>
      {item && (
        <>
          <FormRow label="Employee Name :">{item.preparer?.names}</FormRow>
          <FormRow label="Department :">{item.department?.name}</FormRow>
          <FormRow label="Title :">{item.title}</FormRow>
          <FormRow label="Type :">{item.type === 'Other' ? item.type_other || 'Other' : item.type}</FormRow>
          <FormRow label="Description :">{item.description}</FormRow>
          <FormRow label="Date :">{formatDocDate(item.date)}</FormRow>
          <FormRow label="Start time :">{item.start_time || '—'}</FormRow>
          <FormRow label="End time :">{item.end_time || '—'}</FormRow>
          <p className="mt-16 text-center"><strong>Done at Kigali, on</strong> {formatDocDate(item.created_at)}</p>
          <div className="mt-12">
            <SignatureLine label="Prepared by:" name={item.preparer?.names} src={item.preparer?.signature_url} />
            {item.verifier?.names && <SignatureLine label="Verified by:" name={item.verifier.names} src={item.verifier.signature_url} />}
            {item.approver?.names && <SignatureLine label="Approved by:" name={item.approver.names} src={item.approver.signature_url} />}
            {item.authorizer?.names && (
              <SignatureLine
                label="Authorized by:"
                name={item.authorizer.names}
                src={edSrc}
                tall={item.ed_signature_and_stamp === 'stamp_with_signature' || item.ed_signature_and_stamp === 'yes'}
              />
            )}
          </div>
        </>
      )}
    </OfficialDocument>
  );
}

export function LeaveScheduleDocumentPage() {
  const { item, error, loading } = useOfficialRecord('/leave-schedule');
  return (
    <OfficialDocument title="Leave Schedule" loading={loading} error={error} banner={String(item?.status || '').replace(/_/g, ' ').toUpperCase()}>
      {item && (
        <>
          <FormRow label="Employee Full Name :">{item.user?.names}</FormRow>
          <FormRow label="Position :">{item.user?.role}</FormRow>
          <FormRow label="Department :">{item.user?.department?.name}</FormRow>
          <FormRow label="From Date :">{formatDocDate(item.from_date)}</FormRow>
          <FormRow label="Return Date :">{formatDocDate(item.return_date)}</FormRow>
          <FormRow label="HR Read :">{item.hr_read_status}</FormRow>
          <FormRow label="ED Read :">{item.ed_read_status}</FormRow>
          <p className="mt-16 text-center"><strong>Done at Kigali, on</strong> {formatDocDate(item.created_at)}</p>
          <div className="mt-12">
            <SignatureLine label="Applicant :" name={item.user?.names} src={item.user?.signature_url} />
          </div>
        </>
      )}
    </OfficialDocument>
  );
}
