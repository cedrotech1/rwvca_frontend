import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { inputClass, labelClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { DISTRICTS, MEMBERSHIP_CATEGORIES, MemberNav, PROVINCES, UMUSANZU_YEAR, emptyMember, memberFromApi } from './memberShared';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export default function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyMember());
  const [platforms, setPlatforms] = useState([]);
  const [years, setYears] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    api.get('/members/meta').then((res) => {
      setPlatforms(res.data?.platforms || []);
      setYears(res.data?.years || []);
    }).catch(() => {});
    if (id) {
      api.get(`/members/${id}`).then((res) => setForm(memberFromApi(res.data))).catch((err) => {
        setError(err.response?.data?.message || 'Could not load member');
      });
    }
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/members/${id}`, form);
      else await api.post('/members', form);
      navigate(editing ? `/dashboard/members/${id}` : '/dashboard/members');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save member');
    } finally {
      setSaving(false);
    }
  };

  const categoryId = Number(form.membership_category_platform_id);

  return (
    <div className="space-y-4">
      <PageHeading
        title={editing ? 'Edit Member' : 'Add New Member'}
        subtitle="Add or edit member information"
        icon={<UserPlus className="h-6 w-6" />}
        showBack
        backTo="/dashboard/members"
      />
      <MemberNav />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-[#2f5d31] mb-4">Basic Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company / Cooperative Name *">
              <input required className={inputClass} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
            </Field>
            <Field label="Owner full name *">
              <input required className={inputClass} value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
            </Field>
            <Field label="Shareholder / Umunyamigabane">
              <select className={inputClass} value={form.shareholder} onChange={(e) => set('shareholder', Number(e.target.value))}>
                <option value={1}>Yego (Yes)</option>
                <option value={0}>Oya (No)</option>
              </select>
            </Field>
            <Field label="Gender / Igitsina">
              <select className={inputClass} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="Male">Male (Gabo)</option>
                <option value="Female">Female (Gore)</option>
              </select>
            </Field>
            <Field label="Member platform / Icyiciro *">
              <select required className={inputClass} value={form.membership_category_platform_id} onChange={(e) => set('membership_category_platform_id', e.target.value)}>
                <option value="">Select category</option>
                {platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Membership category *">
              <select required className={inputClass} value={form.membership_category} onChange={(e) => set('membership_category', e.target.value)}>
                <option value="">Select membership category</option>
                {MEMBERSHIP_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#2f5d31] mb-4">Contact Information</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Province">
              <select className={inputClass} value={form.province} onChange={(e) => set('province', e.target.value)}>
                <option value="">Select province</option>
                {PROVINCES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="District">
              <select className={inputClass} value={form.district} onChange={(e) => set('district', e.target.value)}>
                <option value="">Select district</option>
                {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Role in company"><input className={inputClass} value={form.role} onChange={(e) => set('role', e.target.value)} /></Field>
            <Field label="Has role in RWVCA?">
              <select className={inputClass} value={form.has_rwvca_role} onChange={(e) => set('has_rwvca_role', Number(e.target.value))}>
                <option value={0}>No (Oya)</option>
                <option value={1}>Yes (Yego)</option>
              </select>
            </Field>
            {Number(form.has_rwvca_role) === 1 && (
              <Field label="Role in RWVCA"><input className={inputClass} value={form.rwvca_role} onChange={(e) => set('rwvca_role', e.target.value)} /></Field>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#2f5d31] mb-4">Business Information</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="RDB Certificate"><input className={inputClass} value={form.rdb_certificate} onChange={(e) => set('rdb_certificate', e.target.value)} /></Field>
            <Field label="TIN"><input className={inputClass} value={form.tin} onChange={(e) => set('tin', e.target.value)} /></Field>
            <Field label="National ID"><input className={inputClass} value={form.national_id} onChange={(e) => set('national_id', e.target.value)} /></Field>
            <Field label={`Membership status (Umusanzu) — ${UMUSANZU_YEAR}`}>
              <select className={inputClass} value={form.membership_status} onChange={(e) => set('membership_status', e.target.value)}>
                <option value="Paid">Yishyuye (Paid)</option>
                <option value="Not Paid">Bitishyuye (Not Paid)</option>
                <option value="Partial">Bicyacanye (Partial)</option>
              </select>
            </Field>
            <Field label="Registration status / Kwiyandikisha">
              <select className={inputClass} value={form.registration_status} onChange={(e) => set('registration_status', e.target.value)}>
                <option value="Paid">Yishyuye (Paid)</option>
                <option value="Not Paid">Bitishyuye (Not Paid)</option>
              </select>
            </Field>
            {form.registration_status === 'Paid' && (
              <Field label="Registration fee paid date">
                <input type="date" className={inputClass} value={form.registration_paid_date || ''} onChange={(e) => set('registration_paid_date', e.target.value)} />
              </Field>
            )}
            <Field label="Date joined">
              <input type="date" className={inputClass} value={form.date_joined || ''} onChange={(e) => set('date_joined', e.target.value)} />
            </Field>
            <Field label="Active or inactive">
              <select className={inputClass} value={form.is_active} onChange={(e) => set('is_active', Number(e.target.value))}>
                <option value={1}>Active member</option>
                <option value={0}>Inactive member</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#2f5d31] mb-4">Other years — annual payment / Umusanzu</h3>
          <p className="text-xs text-gray-500 mb-3">{UMUSANZU_YEAR} is set above as Membership Status. Use this table for other years.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-3">Year</th>
                  <th className="py-2">Payment status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {years.filter((item) => Number(item.year_value) !== UMUSANZU_YEAR).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3 font-medium">{item.year_value}</td>
                    <td className="py-2">
                      <select
                        className={inputClass}
                        value={form.year_payments?.[item.id] || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, year_payments: { ...prev.year_payments, [item.id]: e.target.value } }))}
                      >
                        <option value="">— Not set —</option>
                        <option value="Paid">Paid / Yishyuye</option>
                        <option value="Partial">Partial / Bicyacanye</option>
                        <option value="Not Paid">Not Paid / Bitishyuye</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#2f5d31] mb-4">Employee Information</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Employees (Women)"><input type="number" min="0" className={inputClass} value={form.employees_women} onChange={(e) => set('employees_women', e.target.value)} /></Field>
            <Field label="Employees (Men)"><input type="number" min="0" className={inputClass} value={form.employees_men} onChange={(e) => set('employees_men', e.target.value)} /></Field>
            <Field label="Employees (PWD)"><input type="number" min="0" className={inputClass} value={form.employees_pwd} onChange={(e) => set('employees_pwd', e.target.value)} /></Field>
          </div>
        </section>

        {categoryId === 1 && (
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 mb-4">Tree Seeds and Nurseries</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Land size (ha)"><input className={inputClass} value={form.land_size} onChange={(e) => set('land_size', e.target.value)} /></Field>
              <Field label="Seed type"><input className={inputClass} value={form.seed_type} onChange={(e) => set('seed_type', e.target.value)} /></Field>
              <Field label="Seed quantity"><input className={inputClass} value={form.seed_quantity} onChange={(e) => set('seed_quantity', e.target.value)} /></Field>
              <Field label="Land ownership">
                <select className={inputClass} value={form.land_ownership} onChange={(e) => set('land_ownership', e.target.value)}>
                  <option value="">Select</option>
                  <option value="Owned">Owned</option>
                  <option value="Rented">Rented</option>
                </select>
              </Field>
            </div>
          </section>
        )}
        {categoryId === 2 && (
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 mb-4">Forest Management</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Forest area (ha)"><input className={inputClass} value={form.forest_area} onChange={(e) => set('forest_area', e.target.value)} /></Field>
              <Field label="Forest type"><input className={inputClass} value={form.forest_type} onChange={(e) => set('forest_type', e.target.value)} /></Field>
            </div>
          </section>
        )}
        {categoryId === 3 && (
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 mb-4">Harvesting, Sawmill and Supply</h3>
            <Field label="Cluster"><input className={inputClass} value={form.harvesting_cluster} onChange={(e) => set('harvesting_cluster', e.target.value)} /></Field>
          </section>
        )}
        {categoryId === 4 && (
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 mb-4">Furniture Production</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Products"><textarea className={`${inputClass} min-h-24`} value={form.furniture_products} onChange={(e) => set('furniture_products', e.target.value)} /></Field>
              <Field label="Cluster"><input className={inputClass} value={form.furniture_cluster} onChange={(e) => set('furniture_cluster', e.target.value)} /></Field>
            </div>
          </section>
        )}
        {categoryId === 5 && (
          <section>
            <h3 className="text-sm font-semibold text-emerald-700 mb-4">Sales and Distribution</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Products"><textarea className={`${inputClass} min-h-24`} value={form.sales_products} onChange={(e) => set('sales_products', e.target.value)} /></Field>
              <Field label="Cluster"><input className={inputClass} value={form.sales_cluster} onChange={(e) => set('sales_cluster', e.target.value)} /></Field>
            </div>
          </section>
        )}

        <div className="flex gap-2">
          <button disabled={saving} className="bg-[#2f5d31] text-white px-5 py-2.5 rounded-lg font-medium">{saving ? 'Saving...' : (editing ? 'Update member' : 'Save member')}</button>
          <button type="button" className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium" onClick={() => navigate('/dashboard/members')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
