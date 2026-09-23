import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FilePlus, Pencil, Plus } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { inputClass, labelClass, money, SheetTable } from '../../../components/ui/dataUi';
import {
  DISTRICTS, MONTHS, YEARS, PAYMENT_FIELDS, TIMBER_TYPES,
  calcNormal, calcOther, num, periodFromType, sum,
} from './membershipReportShared';

function emptyNormal() {
  return { timber_name: 'PINUS', number_of_timber: '', price: '', category: 'NORMAL' };
}
function emptyOther() {
  return { timber_name: '', number_of_timber: '', price: '', msf: 0, category: 'OTHER' };
}
function emptyCustomer() {
  return { date: '', name: '', phone: '', amount: '' };
}

function defaultForm() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    report_type: 'DAILY',
    location: '',
    title: '',
    comment: '',
    daily_date: today,
    start_date: '',
    end_date: '',
    monthly_month: MONTHS[new Date().getMonth()],
    yearly_year: String(new Date().getFullYear()),
    quarter: '',
    year: new Date().getFullYear(),
  };
}

export default function CreateMembershipReportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editId = id ? String(id) : '';
  const isEdit = Boolean(editId);

  const [form, setForm] = useState(defaultForm);
  const [normal, setNormal] = useState([emptyNormal()]);
  const [other, setOther] = useState([emptyOther()]);
  const [customers, setCustomers] = useState([emptyCustomer()]);
  const [payments, setPayments] = useState(Object.fromEntries(PAYMENT_FIELDS.map((item) => [item.method, ''])));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const period = periodFromType(form);
  const normalCalc = normal.map(calcNormal);
  const otherCalc = other.map(calcOther);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    api.get(`/membership-reports/${editId}`)
      .then((res) => {
        if (cancelled) return;
        const report = res.data;
        if (!report?.permissions?.can_edit) {
          setError('You do not have permission to edit this report');
          return;
        }
        const type = String(report.report_type || 'DAILY').toUpperCase();
        setForm({
          report_type: type,
          location: report.location || '',
          title: report.title || '',
          comment: report.comment || '',
          daily_date: type === 'DAILY' ? String(report.start_date || '').slice(0, 10) : new Date().toISOString().slice(0, 10),
          start_date: String(report.start_date || '').slice(0, 10),
          end_date: String(report.end_date || '').slice(0, 10),
          monthly_month: report.monthly_month || MONTHS[new Date().getMonth()],
          yearly_year: String(report.yearly_year || report.year || new Date().getFullYear()),
          quarter: report.quarter != null ? String(report.quarter) : '',
          year: report.year || new Date().getFullYear(),
        });
        const items = report.items || [];
        const normalItems = items
          .filter((row) => String(row.category || '').toUpperCase() === 'NORMAL')
          .map((row) => ({
            timber_name: row.timber_name || 'PINUS',
            number_of_timber: row.number_of_timber ?? '',
            price: row.price ?? '',
            category: 'NORMAL',
          }));
        const otherItems = items
          .filter((row) => String(row.category || '').toUpperCase() === 'OTHER')
          .map((row) => ({
            timber_name: row.timber_name || '',
            number_of_timber: row.number_of_timber ?? '',
            price: row.price ?? '',
            msf: row.msf ?? 0,
            category: 'OTHER',
          }));
        setNormal(normalItems.length ? normalItems : [emptyNormal()]);
        setOther(otherItems.length ? otherItems : [emptyOther()]);
        const paymentMap = Object.fromEntries(PAYMENT_FIELDS.map((item) => [item.method, '']));
        (report.payments || []).forEach((row) => {
          const method = String(row.method || '').toUpperCase();
          if (Object.prototype.hasOwnProperty.call(paymentMap, method)) {
            paymentMap[method] = row.amount ?? '';
          }
        });
        setPayments(paymentMap);
        const customerRows = (report.customers || []).map((row) => ({
          date: '',
          name: row.name || '',
          phone: row.phone || '',
          amount: row.amount ?? '',
        }));
        setCustomers(customerRows.length ? customerRows : [emptyCustomer()]);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load report for editing');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [editId, isEdit]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (!form.comment.trim()) throw new Error('Comment / Remarks is required');
      if (!form.location) throw new Error('District is required');
      if (!form.title.trim()) throw new Error('Report title is required');
      if (!period.start_date || !period.end_date) throw new Error('Please complete the report period');
      const items = [
        ...normalCalc.filter((row) => row.timber_name && num(row.number_of_timber) && num(row.price)),
        ...otherCalc.filter((row) => row.timber_name && num(row.number_of_timber) && num(row.price)),
      ];
      const payload = {
        ...form,
        start_date: period.start_date,
        end_date: period.end_date,
        year: period.year,
        items,
        payments: PAYMENT_FIELDS.map((item) => ({ method: item.method, amount: num(payments[item.method]) })),
        customers: customers.filter((row) => row.name && row.amount).map((row) => ({
          name: row.name,
          phone: row.phone,
          amount: num(row.amount),
        })),
      };
      if (isEdit) {
        await api.put(`/membership-reports/${editId}`, payload);
        navigate(`/dashboard/membership-reports/${editId}`);
      } else {
        await api.post('/membership-reports', payload);
        navigate('/dashboard/membership-reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading report…</p>;
  }

  return (
    <div>
      <PageHeading
        icon={isEdit ? <Pencil className="h-6 w-6" /> : <FilePlus className="h-6 w-6" />}
        title={isEdit ? `Edit Membership Report #${editId}` : 'Create Membership Report'}
        subtitle={isEdit ? 'Update your membership report and resubmit' : 'Create a new membership report'}
        showBack
        backTo={isEdit ? `/dashboard/membership-reports/${editId}` : '/dashboard/membership-reports'}
      />
      <form onSubmit={submit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Report Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Report Type *</label>
              <select className={inputClass} value={form.report_type} onChange={(e) => setField('report_type', e.target.value)}>
                {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((item) => (
                  <option key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>District *</label>
              <select required className={inputClass} value={form.location} onChange={(e) => setField('location', e.target.value)}>
                <option value="">Select District</option>
                {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Report Title *</label>
              <input required className={inputClass} value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Enter report title" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Comment / Remarks *</label>
              <textarea required className={`${inputClass} min-h-28`} value={form.comment} onChange={(e) => setField('comment', e.target.value)} placeholder="Please provide a detailed comment or remarks about this report." />
            </div>
            {form.report_type === 'DAILY' && (
              <div>
                <label className={labelClass}>Date *</label>
                <input required type="date" className={inputClass} value={form.daily_date} onChange={(e) => setField('daily_date', e.target.value)} />
              </div>
            )}
            {form.report_type === 'WEEKLY' && (
              <>
                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input required type="date" className={inputClass} value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>End Date *</label>
                  <input required type="date" className={inputClass} value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} />
                </div>
              </>
            )}
            {form.report_type === 'MONTHLY' && (
              <>
                <div>
                  <label className={labelClass}>Month *</label>
                  <select required className={inputClass} value={form.monthly_month} onChange={(e) => setField('monthly_month', e.target.value)}>
                    {MONTHS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Year *</label>
                  <select required className={inputClass} value={form.yearly_year} onChange={(e) => setField('yearly_year', e.target.value)}>
                    {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </>
            )}
            {form.report_type === 'QUARTERLY' && (
              <>
                <div>
                  <label className={labelClass}>Quarter *</label>
                  <select required className={inputClass} value={form.quarter} onChange={(e) => setField('quarter', e.target.value)}>
                    <option value="">Select Quarter</option>
                    <option value="1">Quarter 1 (Jan-Mar)</option>
                    <option value="2">Quarter 2 (Apr-Jun)</option>
                    <option value="3">Quarter 3 (Jul-Sep)</option>
                    <option value="4">Quarter 4 (Oct-Dec)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Year *</label>
                  <select required className={inputClass} value={form.yearly_year} onChange={(e) => setField('yearly_year', e.target.value)}>
                    {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </>
            )}
            {form.report_type === 'YEARLY' && (
              <div>
                <label className={labelClass}>Year *</label>
                <select required className={inputClass} value={form.yearly_year} onChange={(e) => setField('yearly_year', e.target.value)}>
                  {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <TimberEditor
          title="NORMAL TIMBER"
          columns={['NAME OF TIMBER', 'No OF TIMBER', 'PRICE OF TIMBER', 'TOTAL COST', 'TVA', 'MSF', 'TVA+MSF']}
          rows={normalCalc}
          onAdd={() => setNormal((prev) => [...prev, emptyNormal()])}
          onReset={() => setNormal([emptyNormal()])}
          renderRow={(row, index) => (
            <>
              <td className="px-2 py-2">
                <select className={inputClass} value={row.timber_name} onChange={(e) => setNormal((prev) => prev.map((item, i) => (i === index ? { ...item, timber_name: e.target.value } : item)))}>
                  {TIMBER_TYPES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </td>
              <td className="px-2 py-2"><input type="number" min="0" className={inputClass} value={normal[index].number_of_timber} onChange={(e) => setNormal((prev) => prev.map((item, i) => (i === index ? { ...item, number_of_timber: e.target.value } : item)))} /></td>
              <td className="px-2 py-2"><input type="number" min="0" step="0.01" className={inputClass} value={normal[index].price} onChange={(e) => setNormal((prev) => prev.map((item, i) => (i === index ? { ...item, price: e.target.value } : item)))} /></td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.total_cost)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.vat)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.msf)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.vat_and_msf)}</td>
            </>
          )}
        />

        <TimberEditor
          title="OTHER TIMBER FOR DIFFERENCE PRICE"
          columns={['NAME OF TIMBER', 'No OF TIMBER', 'PRICE OF TIMBER', 'MSF', 'TOTAL COST', 'VAT', 'MST', 'TVA+MST']}
          rows={otherCalc}
          onAdd={() => setOther((prev) => [...prev, emptyOther()])}
          onReset={() => setOther([emptyOther()])}
          renderRow={(row, index) => (
            <>
              <td className="px-2 py-2"><input className={inputClass} placeholder="Timber name" value={other[index].timber_name} onChange={(e) => setOther((prev) => prev.map((item, i) => (i === index ? { ...item, timber_name: e.target.value } : item)))} /></td>
              <td className="px-2 py-2"><input type="number" min="0" className={inputClass} value={other[index].number_of_timber} onChange={(e) => setOther((prev) => prev.map((item, i) => (i === index ? { ...item, number_of_timber: e.target.value } : item)))} /></td>
              <td className="px-2 py-2"><input type="number" min="0" step="0.01" className={inputClass} value={other[index].price} onChange={(e) => setOther((prev) => prev.map((item, i) => (i === index ? { ...item, price: e.target.value } : item)))} /></td>
              <td className="px-2 py-2"><input type="number" min="0" step="0.01" className={inputClass} value={other[index].msf} onChange={(e) => setOther((prev) => prev.map((item, i) => (i === index ? { ...item, msf: e.target.value } : item)))} /></td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.total_cost)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.vat)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.mst)}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(row.vat_and_mst)}</td>
            </>
          )}
        />

        <SheetTable
          title="GRAND TOTAL (NORMAL + OTHER)"
          columns={[
            { key: 'name', label: 'NAME OF TIMBER' },
            { key: 'qty', label: 'No OF TIMBER', align: 'right' },
            { key: 'price', label: 'PRICE OF TIMBER', align: 'right' },
            { key: 'cost', label: 'TOTAL COST', align: 'right' },
            { key: 'vat', label: 'TVA', align: 'right' },
            { key: 'msf', label: 'Total MSF/MST', align: 'right' },
            { key: 'vatmsf', label: 'TVA+MSF/MST', align: 'right' },
          ]}
          rows={[{
            total: true,
            name: 'GRAND TOTAL (NORMAL + OTHER)',
            qty: money(sum(normalCalc, 'number_of_timber') + sum(otherCalc, 'number_of_timber')),
            price: '—',
            cost: money(sum(normalCalc, 'total_cost') + sum(otherCalc, 'total_cost')),
            vat: money(sum(normalCalc, 'vat') + sum(otherCalc, 'vat')),
            msf: money(sum(normalCalc, 'msf') + sum(otherCalc, 'mst')),
            vatmsf: money(sum(normalCalc, 'vat_and_msf') + sum(otherCalc, 'vat_and_mst')),
          }]}
        />

        <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 bg-white">
          <div className="bg-[#0f766e] text-white px-4 py-2.5 text-sm font-semibold">PAYMENTS</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2.5">Payment Type</th>
                <th className="px-3 py-2.5">Amount (RWF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PAYMENT_FIELDS.map((item) => (
                <tr key={item.method}>
                  <td className="px-3 py-2.5">{item.label}</td>
                  <td className="px-3 py-2.5">
                    <input type="number" min="0" step="0.01" className={inputClass} value={payments[item.method]} onChange={(e) => setPayments((prev) => ({ ...prev, [item.method]: e.target.value }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 bg-white">
          <div className="bg-[#0f766e] text-white px-4 py-2.5 text-sm font-semibold">CUSTOMERS WITHOUT INVOICE</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Phone</th>
                  <th className="px-3 py-2.5">RWF Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((row, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2"><input type="date" className={inputClass} value={row.date} onChange={(e) => setCustomers((prev) => prev.map((item, i) => (i === index ? { ...item, date: e.target.value } : item)))} /></td>
                    <td className="px-2 py-2"><input className={inputClass} value={row.name} onChange={(e) => setCustomers((prev) => prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))} /></td>
                    <td className="px-2 py-2"><input className={inputClass} value={row.phone} onChange={(e) => setCustomers((prev) => prev.map((item, i) => (i === index ? { ...item, phone: e.target.value } : item)))} /></td>
                    <td className="px-2 py-2"><input type="number" min="0" step="0.01" className={inputClass} value={row.amount} onChange={(e) => setCustomers((prev) => prev.map((item, i) => (i === index ? { ...item, amount: e.target.value } : item)))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 flex gap-2">
            <button type="button" className="text-sm text-[#2f5d31] font-medium" onClick={() => setCustomers((prev) => [...prev, emptyCustomer()])}>+ Add Customer</button>
            <button type="button" className="text-sm text-gray-500" onClick={() => setCustomers([emptyCustomer()])}>Reset Customers</button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="bg-[#2f5d31] text-white px-6 py-2.5 rounded-lg font-medium">
          {saving ? 'Saving...' : (isEdit ? 'Update Report' : 'Save Report')}
        </button>
      </form>
    </div>
  );
}

function TimberEditor({ title, columns, rows, renderRow, onAdd, onReset }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 bg-white">
      <div className="bg-[#0f766e] text-white px-4 py-2.5 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              {columns.map((col) => <th key={col} className="px-3 py-2.5 font-semibold whitespace-nowrap">{col}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => <tr key={index}>{renderRow(row, index)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className="p-3 flex gap-3">
        <button type="button" className="inline-flex items-center gap-1 text-sm text-[#2f5d31] font-medium" onClick={onAdd}><Plus size={14} /> Add Row</button>
        <button type="button" className="text-sm text-gray-500" onClick={onReset}>Reset Rows</button>
      </div>
    </div>
  );
}
