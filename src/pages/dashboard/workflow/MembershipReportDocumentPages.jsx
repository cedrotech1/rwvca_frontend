import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import OfficialDocument, { FormRow, SignatureLine, formatDocDate } from './OfficialDocument';
import { PAYMENT_FIELDS, formatReportPeriod, num, sum } from './membershipReportShared';

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function periodLabel(item = {}) {
  const type = String(item.report_type || '').toUpperCase();
  if (type === 'DAILY') return formatDocDate(item.start_date);
  if (type === 'WEEKLY') return `${formatDocDate(item.start_date)} – ${formatDocDate(item.end_date)}`;
  if (type === 'MONTHLY') return `${item.monthly_month || ''} ${item.yearly_year || item.year || ''}`.trim();
  if (type === 'QUARTERLY') return `Quarter ${item.quarter} - ${item.yearly_year || item.year || ''}`;
  if (type === 'YEARLY') return String(item.yearly_year || item.year || '');
  if (item.start_date || item.end_date) return `${formatDocDate(item.start_date)} – ${formatDocDate(item.end_date)}`;
  return formatReportPeriod(item);
}

function DocTable({ columns, rows, empty = 'No records' }) {
  if (!rows?.length) {
    return <p className="mb-4 text-sm text-gray-500">{empty}</p>;
  }
  return (
    <table className="mb-5 w-full border-collapse text-[10pt]">
      <thead>
        <tr className="bg-[#d9d9d9]">
          {columns.map((col) => (
            <th key={col.key} className={`border border-black p-1.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id || row._key || `${row[columns[0]?.key]}-${index}`} className={row.total ? 'font-bold bg-[#f3f4f6]' : ''}>
            {columns.map((col) => (
              <td key={col.key} className={`border border-black p-1.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                {col.render ? col.render(row, index) : (row[col.key] ?? '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SummaryBlock({ summary }) {
  if (!summary) return null;
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-[12pt] font-bold uppercase tracking-wide text-[#2c3e50]">Summary</h3>
      <table className="mb-4 w-full border-collapse text-[10pt]">
        <tbody>
          {[
            ['Reports included', summary.report_count],
            ['Total timber qty', money(summary.total_timber)],
            ['Total cost (RWF)', money(summary.total_cost)],
            ['Total VAT (RWF)', money(summary.total_vat)],
            ['Total MSF/MST (RWF)', money(summary.total_msf_mst)],
            ['Total VAT + MSF/MST (RWF)', money(summary.total_vat_msf)],
            ['Total payments (RWF)', money(summary.total_payments)],
            ['Customer payments (RWF)', money(summary.total_customers)],
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="border border-black p-1.5 font-semibold w-[55%]">{label}</td>
              <td className="border border-black p-1.5 text-right">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <DocTable
        columns={[
          { key: 'method', label: 'Payment method' },
          { key: 'amount', label: 'Amount (RWF)', align: 'right' },
        ]}
        rows={PAYMENT_FIELDS.map((field) => ({
          method: field.label,
          amount: money(summary.payments_by_method?.[field.method] || 0),
        })).concat([{ total: true, method: 'TOTAL PAYMENTS', amount: money(summary.total_payments) }])}
      />

      <DocTable
        columns={[
          { key: 'name', label: 'Timber name' },
          { key: 'qty', label: 'Quantity', align: 'right' },
        ]}
        empty="No timber summary"
        rows={[
          ...Object.entries(summary.timber_by_name || {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, qty]) => ({ name, qty: money(qty) })),
          { total: true, name: 'TOTAL TIMBER', qty: money(summary.total_timber) },
        ]}
      />
    </div>
  );
}

function SignaturesBlock({ reporters = [], approver, generatedBy }) {
  return (
    <div className="mt-10">
      <h3 className="mb-4 text-[12pt] font-bold uppercase tracking-wide text-[#2c3e50]">Signatures</h3>
      {reporters.length ? reporters.map((person) => (
        <SignatureLine
          key={person.id}
          label="Reporter signature:"
          name={`${person.names}${person.working_area ? ` · ${person.working_area}` : ''}`}
          src={person.signature_url}
        />
      )) : (
        <SignatureLine label="Reporter signature:" name="—" />
      )}
      {approver?.names && (
        <SignatureLine label="Approved by:" name={approver.names} src={approver.signature_url} />
      )}
      {generatedBy?.names && (
        <SignatureLine
          label="Generated / printed by:"
          name={generatedBy.names}
          src={generatedBy.signature_url}
        />
      )}
    </div>
  );
}

function ReportBodyTables({ item }) {
  const items = item.items || [];
  const normalItems = items.filter((row) => String(row.category).toUpperCase() === 'NORMAL');
  const otherItems = items.filter((row) => String(row.category).toUpperCase() === 'OTHER');
  const customers = item.customers || [];
  const payments = PAYMENT_FIELDS.map((field) => {
    const found = (item.payments || []).find((row) => String(row.method).toUpperCase() === field.method);
    return { method: field.label, amount: found?.amount || 0 };
  });

  return (
    <>
      <DocTable
        columns={[
          { key: 'sn', label: 'S/N', render: (row, index) => (row.total ? '' : index + 1) },
          { key: 'timber_name', label: 'Timber' },
          { key: 'number_of_timber', label: 'Qty', align: 'right', render: (row) => money(row.number_of_timber) },
          { key: 'price', label: 'Price', align: 'right', render: (row) => (row.total ? '—' : money(row.price)) },
          { key: 'total_cost', label: 'Total cost', align: 'right', render: (row) => money(row.total_cost) },
          { key: 'vat', label: 'VAT', align: 'right', render: (row) => money(row.vat) },
          { key: 'msf', label: 'MSF', align: 'right', render: (row) => money(row.msf) },
          { key: 'vat_and_msf', label: 'VAT+MSF', align: 'right', render: (row) => money(row.vat_and_msf) },
        ]}
        empty="No normal timber items"
        rows={[
          ...normalItems,
          ...(normalItems.length ? [{
            total: true,
            timber_name: 'TOTAL (Normal)',
            number_of_timber: sum(normalItems, 'number_of_timber'),
            total_cost: sum(normalItems, 'total_cost'),
            vat: sum(normalItems, 'vat'),
            msf: sum(normalItems, 'msf'),
            vat_and_msf: sum(normalItems, 'vat_and_msf'),
          }] : []),
        ]}
      />

      <DocTable
        columns={[
          { key: 'sn', label: 'S/N', render: (row, index) => (row.total ? '' : index + 1) },
          { key: 'timber_name', label: 'Other timber' },
          { key: 'number_of_timber', label: 'Qty', align: 'right', render: (row) => money(row.number_of_timber) },
          { key: 'price', label: 'Price', align: 'right', render: (row) => money(row.price) },
          { key: 'total_cost', label: 'Total cost', align: 'right', render: (row) => money(row.total_cost) },
          { key: 'vat', label: 'VAT', align: 'right', render: (row) => money(row.vat) },
          { key: 'mst', label: 'MST', align: 'right', render: (row) => money(row.mst) },
          { key: 'vat_and_mst', label: 'VAT+MST', align: 'right', render: (row) => money(row.vat_and_mst) },
        ]}
        empty="No other timber items"
        rows={[
          ...otherItems,
          ...(otherItems.length ? [{
            total: true,
            timber_name: 'TOTAL (Other)',
            number_of_timber: sum(otherItems, 'number_of_timber'),
            price: sum(otherItems, 'price'),
            total_cost: sum(otherItems, 'total_cost'),
            vat: sum(otherItems, 'vat'),
            mst: sum(otherItems, 'mst'),
            vat_and_mst: sum(otherItems, 'vat_and_mst'),
          }] : []),
        ]}
      />

      <DocTable
        columns={[
          { key: 'name', label: 'Customer' },
          { key: 'phone', label: 'Phone', render: (row) => (row.total ? '—' : (row.phone || 'N/A')) },
          { key: 'amount', label: 'Amount', align: 'right', render: (row) => money(row.amount) },
        ]}
        empty="No customer payments"
        rows={customers.length ? [
          ...customers,
          { total: true, name: 'TOTAL CUSTOMERS', amount: sum(customers, 'amount') },
        ] : []}
      />

      <DocTable
        columns={[
          { key: 'method', label: 'Payment method' },
          { key: 'amount', label: 'Amount', align: 'right', render: (row) => money(row.amount) },
        ]}
        rows={[
          ...payments,
          { total: true, method: 'TOTAL PAYMENTS', amount: sum(payments, 'amount') },
        ]}
      />
    </>
  );
}

export function MembershipReportDocumentPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/membership-reports/${id}`)
      .then((res) => { if (active) setItem(res.data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Document not found'); });
    return () => { active = false; };
  }, [id]);

  const summary = useMemo(() => {
    if (!item) return null;
    const items = item.items || [];
    const normalItems = items.filter((row) => String(row.category).toUpperCase() === 'NORMAL');
    const otherItems = items.filter((row) => String(row.category).toUpperCase() === 'OTHER');
    const paymentsByMethod = {};
    PAYMENT_FIELDS.forEach((field) => {
      const found = (item.payments || []).find((row) => String(row.method).toUpperCase() === field.method);
      paymentsByMethod[field.method] = num(found?.amount);
    });
    const timberByName = items.reduce((acc, row) => {
      const name = row.timber_name || '—';
      const qty = num(row.number_of_timber);
      if (qty > 0) acc[name] = (acc[name] || 0) + qty;
      return acc;
    }, {});
    return {
      report_count: 1,
      total_timber: sum(items, 'number_of_timber'),
      total_cost: sum(items, 'total_cost'),
      total_vat: sum(items, 'vat'),
      total_msf_mst: sum(normalItems, 'msf') + sum(otherItems, 'mst'),
      total_vat_msf: sum(normalItems, 'vat_and_msf') + sum(otherItems, 'vat_and_mst'),
      total_payments: Object.values(paymentsByMethod).reduce((total, value) => total + value, 0),
      total_customers: sum(item.customers || [], 'amount'),
      payments_by_method: paymentsByMethod,
      timber_by_name: timberByName,
    };
  }, [item]);

  const reporter = item?.user || item?.submitter;

  return (
    <OfficialDocument
      title="Membership Report"
      loading={!item && !error}
      error={error}
      banner={String(item?.status || '').toUpperCase()}
    >
      {item && (
        <>
          <FormRow label="Report title :">{item.title}</FormRow>
          <FormRow label="Report type :">{item.report_type}</FormRow>
          <FormRow label="District / location :">{item.location}</FormRow>
          <FormRow label="Period :">{periodLabel(item)}</FormRow>
          <FormRow label="Reporter :">{reporter?.names}</FormRow>
          <FormRow label="Working area / site :">{reporter?.working_area || item.location || '—'}</FormRow>
          <FormRow label="Status :">{item.status}</FormRow>
          {item.comment && (
            <div className="mb-5">
              <p className="font-bold">Remarks</p>
              <p className="mt-1 whitespace-pre-wrap border border-dashed border-gray-400 p-2">{item.comment}</p>
            </div>
          )}

          <SummaryBlock summary={summary} />
          <h3 className="mb-2 text-[12pt] font-bold uppercase tracking-wide text-[#2c3e50]">Detailed records</h3>
          <ReportBodyTables item={item} />
          <p className="mt-8 text-center"><strong>Done at Kigali, on</strong> {formatDocDate(item.created_at)}</p>
          <SignaturesBlock
            reporters={reporter ? [{
              id: reporter.id,
              names: reporter.names,
              working_area: reporter.working_area,
              signature_url: reporter.signature_url,
            }] : []}
            approver={item.approver}
          />
        </>
      )}
    </OfficialDocument>
  );
}

export function MembershipReportGeneratePage() {
  const [params] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const query = Object.fromEntries([...params.entries()]);
    api.get('/membership-reports/print-bundle', query)
      .then((res) => { if (active) setData(res.data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not generate report'); });
    return () => { active = false; };
  }, [params]);

  const meta = data?.meta;
  const summary = data?.summary;
  const reports = data?.reports || [];

  return (
    <OfficialDocument
      title={meta?.title || 'Membership Generated Report'}
      loading={!data && !error}
      error={error}
      banner={meta?.group_by === 'site' ? 'BY SITE / OFFICER' : 'BY DISTRICT'}
    >
      {data && (
        <>
          <FormRow label="Grouped by :">{meta.group_by === 'site' ? 'Site / Officer' : 'District'}</FormRow>
          {meta.group_by === 'district' && <FormRow label="District :">{meta.location}</FormRow>}
          {meta.group_by === 'site' && (
            <>
              <FormRow label="Site / officer :">{meta.site?.names}</FormRow>
              <FormRow label="Working area :">{meta.site?.working_area || '—'}</FormRow>
            </>
          )}
          <FormRow label="Report type :">{meta.report_type || 'All types'}</FormRow>
          <FormRow label="Status :">{meta.status || 'All statuses'}</FormRow>
          <FormRow label="Period filters :">
            {[
              meta.period?.start_date,
              meta.period?.end_date,
              meta.period?.monthly_month,
              meta.period?.quarter ? `Q${meta.period.quarter}` : null,
              meta.period?.yearly_year,
            ].filter(Boolean).join(' · ') || 'All periods'}
          </FormRow>
          <FormRow label="Reports included :">{meta.report_count}</FormRow>
          <FormRow label="Generated on :">{formatDocDate(meta.generated_at)}</FormRow>

          <SummaryBlock summary={summary} />

          <h3 className="mb-2 text-[12pt] font-bold uppercase tracking-wide text-[#2c3e50]">Included reports</h3>
          <DocTable
            columns={[
              { key: 'sn', label: '#', render: (_row, index) => index + 1 },
              { key: 'title', label: 'Title', render: (row) => row.title || `${row.report_type} report` },
              { key: 'officer', label: 'Reporter', render: (row) => row.user?.names || row.submitter?.names || '—' },
              { key: 'location', label: 'District' },
              { key: 'period', label: 'Period', render: (row) => periodLabel(row) },
              { key: 'status', label: 'Status' },
              { key: 'total', label: 'Cost', align: 'right', render: (row) => money(sum(row.items || [], 'total_cost')) },
            ]}
            empty="No membership reports match the selected filters"
            rows={reports}
          />

          {reports.slice(0, 8).map((report) => (
            <div key={report.id} className="mb-8 break-inside-avoid">
              <h4 className="mb-2 border-b border-gray-300 pb-1 text-[11pt] font-bold text-[#2c3e50]">
                #{report.id} — {report.title || report.report_type} ({periodLabel(report)})
              </h4>
              <ReportBodyTables item={report} />
            </div>
          ))}
          {reports.length > 8 && (
            <p className="mb-4 text-sm italic text-gray-600">
              Showing detailed tables for the first 8 reports. Summary above includes all {reports.length} reports.
            </p>
          )}

          <p className="mt-8 text-center"><strong>Done at Kigali, on</strong> {formatDocDate(meta.generated_at)}</p>
          <SignaturesBlock
            reporters={summary?.reporters || []}
            generatedBy={meta.generated_by}
          />
        </>
      )}
    </OfficialDocument>
  );
}

export default MembershipReportDocumentPage;
