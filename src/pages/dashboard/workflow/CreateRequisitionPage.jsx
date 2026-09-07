import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import { useNotifyPriorityModal } from '../../../components/ui/NotifyPriorityModal';
import api from '../../../services/api';
import { useStaffOptions } from './helpers';

export default function CreateRequisitionPage() {
  const navigate = useNavigate();
  const { departments, users } = useStaffOptions();
  const { askNotifyPriority, modal: notifyModal } = useNotifyPriorityModal();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    department_id: '',
    budget_source: '',
    account_code: '',
    sended_to: '',
    amount_in_words: '',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0),
    [items]
  );

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const submit = async (event, action) => {
    event.preventDefault();
    setError('');
    try {
      let priority;
      if (action !== 'draft') {
        priority = await askNotifyPriority({
          title: 'Notify verifier as',
          subtitle: 'The selected verifier will see this priority in their notifications.',
          confirmLabel: 'Submit & notify',
        });
        if (!priority) return;
      }

      setSaving(true);
      await api.post('/requisitions', {
        ...form,
        action,
        ...(priority ? { priority } : {}),
        total_amount_requested: grandTotal,
        items: items.map((item, index) => ({
          sn: index + 1,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_amount: Number(item.quantity) * Number(item.unit_price),
        })),
      });
      navigate('/dashboard/requisitions');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create requisition');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeading icon={<ClipboardList className="h-6 w-6" />} title="Requisition" subtitle="Create a new requisition for approval" showBack backTo="/dashboard/requisitions" />
      {notifyModal}
      <form className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className={labelClass}>Date
            <input type="date" required className={`mt-1 ${inputClass}`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className={labelClass}>Department
            <select required className={`mt-1 ${inputClass}`} value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Budget Source
            <input required placeholder="e.g., Annual Budget 2024" className={`mt-1 ${inputClass}`} value={form.budget_source} onChange={(e) => setForm({ ...form, budget_source: e.target.value })} />
          </label>
          <label className={labelClass}>Account Code
            <input required placeholder="e.g., 50100" className={`mt-1 ${inputClass}`} value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>Send To (Verifier)
            <select required className={`mt-1 ${inputClass}`} value={form.sended_to} onChange={(e) => setForm({ ...form, sended_to: e.target.value })}>
              <option value="">Select verifier</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.names} ({item.role})</option>)}
            </select>
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Items</h3>
            <button type="button" className="text-sm text-[#2f5d31] inline-flex items-center gap-1" onClick={() => setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }])}>
              <Plus size={14} /> Add item
            </button>
          </div>
          <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2.5 font-semibold">S/N</th>
                  <th className="px-3 py-2.5 font-semibold">Description / Specifications</th>
                  <th className="px-3 py-2.5 font-semibold">Quantity</th>
                  <th className="px-3 py-2.5 font-semibold">Unit Price (RWF)</th>
                  <th className="px-3 py-2.5 font-semibold">Total (RWF)</th>
                  <th className="px-3 py-2.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-2 py-2"><input required placeholder="Enter item description" className={inputClass} value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></td>
                    <td className="px-2 py-2"><input type="number" min="1" className={`w-24 ${inputClass}`} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} /></td>
                    <td className="px-2 py-2"><input type="number" min="0" step="0.01" className={`w-28 ${inputClass}`} value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} /></td>
                    <td className="px-3 py-2 tabular-nums">{(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-semibold">Grand total: {grandTotal.toLocaleString()} RWF</p>
        </div>

        <label className={`${labelClass} block`}>Amount in Words
          <input className={`mt-1 ${inputClass}`} value={form.amount_in_words} onChange={(e) => setForm({ ...form, amount_in_words: e.target.value })} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={saving} onClick={(e) => submit(e, 'draft')} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : 'Save as Draft'}</button>
          <button type="button" disabled={saving} onClick={(e) => submit(e, 'submit')} className="bg-[#2f5d31] text-white px-5 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : 'Submit & notify'}</button>
        </div>
      </form>
    </div>
  );
}
