import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import { useNotifyPriorityModal } from '../../../components/ui/NotifyPriorityModal';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { canEditRequisitionAccountFields, hasPrivilege } from '../../../utils/rwvcaAccess';
import { useStaffOptions } from './helpers';
import { moneyWords } from './OfficialDocument';

const PURCHASE = 'purchase';
const SUPPLY_TYPES = ['kitchen', 'hygienic'];

function emptyPurchaseItem() {
  return { description: '', quantity: 1, unit_price: 0 };
}

function emptySupplyItem() {
  return { item_name: '', quantity: 1, description: '' };
}

function TypeChooser({ value, onChange, allowSupply }) {
  const options = [
    { value: PURCHASE, label: 'Purchase / expense', hint: 'Budget, prices, verifier → finance' },
    ...(allowSupply
      ? [
          { value: 'kitchen', label: 'Kitchen', hint: 'Supplies → logistic → ED authorize' },
          { value: 'hygienic', label: 'Hygienic', hint: 'Supplies → logistic → ED authorize' },
        ]
      : []),
  ];
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
      <div>
        <p className="font-semibold text-gray-900">Choose requisition type</p>
        <p className="text-sm text-gray-500">Select the type before filling the form. Kitchen and hygienic use the same requisition flow, handled specially by logistic.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl px-4 py-4 text-left transition ring-1 ${
              value === opt.value
                ? 'bg-[#2f5d31] text-white ring-[#2f5d31]'
                : 'bg-gray-50 text-gray-800 ring-gray-200 hover:bg-[#2f5d31]/10'
            }`}
          >
            <span className="block font-semibold">{opt.label}</span>
            <span className={`mt-1 block text-xs ${value === opt.value ? 'text-white/80' : 'text-gray-500'}`}>{opt.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreateRequisitionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = id ? String(id) : '';
  const isEdit = Boolean(editId);
  const canAccountFields = canEditRequisitionAccountFields(user);
  const allowSupply = hasPrivilege(user, 'menu.create.requisition')
    || hasPrivilege(user, 'menu.create.supply_requisition')
    || hasPrivilege(user, 'menu.supply_requisitions');
  const { departments, users } = useStaffOptions();
  const { askNotifyPriority, modal: notifyModal } = useNotifyPriorityModal();

  const typeFromQuery = String(searchParams.get('type') || '').toLowerCase();
  const initialType = SUPPLY_TYPES.includes(typeFromQuery) ? typeFromQuery : (typeFromQuery === PURCHASE ? PURCHASE : '');
  const [reqType, setReqType] = useState(isEdit ? PURCHASE : initialType);
  const isSupply = SUPPLY_TYPES.includes(reqType);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    department_id: '',
    budget_source: '',
    account_code: '',
    sended_to: '',
    amount_in_words: '',
  });
  const [items, setItems] = useState([emptyPurchaseItem()]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0),
    [items]
  );
  const amountInWords = useMemo(() => moneyWords(grandTotal), [grandTotal]);

  useEffect(() => {
    if (isSupply || isEdit) return;
    setForm((prev) => (prev.amount_in_words === amountInWords ? prev : { ...prev, amount_in_words: amountInWords }));
  }, [amountInWords, isSupply, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    if (!reqType) return;
    setSearchParams(reqType === PURCHASE ? { type: PURCHASE } : { type: reqType }, { replace: true });
  }, [reqType, isEdit, setSearchParams]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    api.get(`/requisitions/${editId}`)
      .then((res) => {
        if (cancelled) return;
        const row = res.data;
        if (!row?.permissions?.can_edit) {
          setError('You do not have permission to edit this requisition');
          return;
        }
        setReqType(PURCHASE);
        setForm({
          date: String(row.date || '').slice(0, 10),
          department_id: row.department_id ? String(row.department_id) : '',
          budget_source: row.budget_source || '',
          account_code: row.account_code || '',
          sended_to: row.sended_to ? String(row.sended_to) : '',
          amount_in_words: row.amount_in_words || '',
        });
        const loadedItems = (row.requisitionitems_requisition_id || row.items || []).map((item) => ({
          description: item.description || '',
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price ?? 0,
        }));
        setItems(loadedItems.length ? loadedItems : [emptyPurchaseItem()]);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load requisition');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [editId, isEdit]);

  const selectType = (next) => {
    setReqType(next);
    setError('');
    if (SUPPLY_TYPES.includes(next)) {
      setItems([emptySupplyItem()]);
      setNotes('');
    } else {
      setItems([emptyPurchaseItem()]);
    }
  };

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const submitPurchase = async (event, action) => {
    event.preventDefault();
    setError('');
    try {
      let priority;
      if (action !== 'draft') {
        priority = await askNotifyPriority({
          title: 'Notify verifier as',
          subtitle: 'The selected verifier will see this priority in their notifications.',
          confirmLabel: isEdit ? 'Update & notify' : 'Submit & notify',
        });
        if (!priority) return;
      }

      setSaving(true);
      const payload = {
        date: form.date,
        department_id: form.department_id,
        sended_to: form.sended_to,
        amount_in_words: amountInWords,
        ...(canAccountFields ? {
          budget_source: form.budget_source,
          account_code: form.account_code,
        } : {}),
        action: action === 'draft' ? 'draft' : (isEdit ? 'submit' : 'submit'),
        ...(priority ? { priority } : {}),
        total_amount_requested: grandTotal,
        items: items.map((item, index) => ({
          sn: index + 1,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_amount: Number(item.quantity) * Number(item.unit_price),
        })),
      };

      if (isEdit) {
        await api.put(`/requisitions/${editId}`, {
          ...payload,
          action: action === 'draft' ? 'draft' : 'submit',
        });
      } else {
        await api.post('/requisitions', {
          ...payload,
          action: action === 'draft' ? 'draft' : 'pending',
        });
      }
      navigate(isEdit ? `/dashboard/requisitions/${editId}` : '/dashboard/requisitions?type=purchase');
    } catch (err) {
      setError(err.response?.data?.message || (isEdit ? 'Could not update requisition' : 'Could not create requisition'));
    } finally {
      setSaving(false);
    }
  };

  const submitSupply = async (submitFlag) => {
    setError('');
    const cleaned = items
      .map((item) => ({
        item_name: String(item.item_name || '').trim(),
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        description: String(item.description || '').trim() || null,
      }))
      .filter((item) => item.item_name);
    if (!cleaned.length) {
      setError('Add at least one item with a name.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/supply-requisitions', {
        supply_type: reqType,
        notes: notes.trim() || null,
        items: cleaned,
        submit: submitFlag,
      });
      navigate(`/dashboard/requisitions?type=${reqType}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save requisition');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeading
          icon={<ClipboardList className="h-6 w-6" />}
          title="Edit Requisition"
          subtitle="Loading requisition..."
          showBack
          backTo="/dashboard/requisitions"
        />
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-gray-200/80" />
          ))}
        </div>
      </div>
    );
  }

  const typeLabel = reqType === 'kitchen' ? 'Kitchen' : reqType === 'hygienic' ? 'Hygienic' : 'Purchase / expense';

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<ClipboardList className="h-6 w-6" />}
        title={isEdit ? 'Edit Requisition' : 'Requisition'}
        subtitle={isEdit ? `Update requisition #${editId}` : (reqType ? `${typeLabel} requisition` : 'Choose type, then complete the form')}
        showBack
        backTo={isEdit ? `/dashboard/requisitions/${editId}` : '/dashboard/requisitions'}
      />
      {notifyModal}

      {!isEdit && (
        <TypeChooser value={reqType} onChange={selectType} allowSupply={allowSupply} />
      )}

      {!reqType && !isEdit ? null : isSupply ? (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Same requisition entry — {typeLabel.toLowerCase()} items go to logistic for assign / approve / reject / revert. Only ED authorizes.
          </p>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${inputClass} min-h-20 mt-1`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional overall note"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Items</h3>
              <button type="button" className="text-sm text-[#2f5d31] inline-flex items-center gap-1" onClick={() => setItems((prev) => [...prev, emptySupplyItem()])}>
                <Plus size={14} /> Add item
              </button>
            </div>
            <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2.5 font-semibold">No</th>
                    <th className="px-3 py-2.5 font-semibold">Item name</th>
                    <th className="px-3 py-2.5 font-semibold">Quantity</th>
                    <th className="px-3 py-2.5 font-semibold">Note / description</th>
                    <th className="px-3 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="px-2 py-2">
                        <input required placeholder="Item name" className={inputClass} value={item.item_name || ''} onChange={(e) => updateItem(index, 'item_name', e.target.value)} />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0.01" step="any" className={`w-24 ${inputClass}`} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                      </td>
                      <td className="px-2 py-2">
                        <input placeholder="Optional note" className={inputClass} value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                      </td>
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
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={saving} onClick={() => submitSupply(false)} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium">
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button type="button" disabled={saving} onClick={() => submitSupply(true)} className="bg-[#2f5d31] text-white px-5 py-2.5 rounded-lg font-medium">
              {saving ? 'Saving...' : 'Submit to logistic'}
            </button>
          </div>
        </div>
      ) : (
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
            {canAccountFields ? (
              <>
                <label className={labelClass}>Budget Source
                  <input placeholder="e.g., Annual Budget 2024" className={`mt-1 ${inputClass}`} value={form.budget_source} onChange={(e) => setForm({ ...form, budget_source: e.target.value })} />
                </label>
                <label className={labelClass}>Account Code
                  <input placeholder="e.g., 50100" className={`mt-1 ${inputClass}`} value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} />
                </label>
              </>
            ) : (
              <>
                {form.budget_source ? (
                  <label className={labelClass}>Budget Source
                    <input readOnly className={`mt-1 ${inputClass} bg-gray-50`} value={form.budget_source} />
                  </label>
                ) : null}
                {form.account_code ? (
                  <label className={labelClass}>Account Code
                    <input readOnly className={`mt-1 ${inputClass} bg-gray-50`} value={form.account_code} />
                  </label>
                ) : null}
              </>
            )}
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
              <button type="button" className="text-sm text-[#2f5d31] inline-flex items-center gap-1" onClick={() => setItems((prev) => [...prev, emptyPurchaseItem()])}>
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
                      <td className="px-2 py-2"><input required placeholder="Enter item description" className={inputClass} value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} /></td>
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
            <input readOnly className={`mt-1 ${inputClass} bg-gray-50`} value={amountInWords} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={saving || Boolean(error && isEdit && error.includes('permission'))} onClick={(e) => submitPurchase(e, 'draft')} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : (isEdit ? 'Save changes' : 'Save as Draft')}</button>
            <button type="button" disabled={saving || Boolean(error && isEdit && error.includes('permission'))} onClick={(e) => submitPurchase(e, 'submit')} className="bg-[#2f5d31] text-white px-5 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : 'Submit & notify'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
