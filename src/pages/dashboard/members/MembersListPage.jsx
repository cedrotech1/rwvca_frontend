import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Columns3, Download, Eye, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canManageMembers } from '../../../utils/rwvcaAccess';
import { formatDate } from '../workflow/helpers';
import { MEMBERSHIP_CATEGORIES, MemberNav, PAYMENT_STATUSES } from './memberShared';

const DEFAULT_COLUMNS = ['company_name', 'owner_name', 'membership_status', 'date_joined'];

const COLUMN_GROUPS = [
  {
    title: 'Identity',
    items: [
      { key: 'company_name', label: 'Company' },
      { key: 'owner_name', label: 'Owner' },
      { key: 'role', label: 'Role in company' },
      { key: 'shareholder', label: 'Shareholder' },
      { key: 'gender', label: 'Gender' },
    ],
  },
  {
    title: 'Membership',
    items: [
      { key: 'platform', label: 'Platform category' },
      { key: 'membership_category', label: 'Membership category' },
      { key: 'membership_status', label: 'Umusanzu (2025)' },
      { key: 'registration_status', label: 'Registration' },
      { key: 'registration_paid_date', label: 'Registration paid date' },
      { key: 'rwvca_role', label: 'RWVCA role' },
      { key: 'is_active', label: 'Member status' },
      { key: 'date_joined', label: 'Date joined' },
    ],
  },
  {
    title: 'Contact',
    items: [
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'province', label: 'Province' },
      { key: 'district', label: 'District' },
    ],
  },
  {
    title: 'Employees',
    items: [
      { key: 'employees_women', label: 'Women employees' },
      { key: 'employees_men', label: 'Men employees' },
      { key: 'employees_pwd', label: 'PWD employees' },
    ],
  },
];

const COLUMN_OPTIONS = COLUMN_GROUPS.flatMap((group) => group.items);

export default function MembersListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const manager = canManageMembers(user?.role);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, active: 0, showing: 0 });
  const [platforms, setPlatforms] = useState([]);
  const [years, setYears] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    membership_category_platform_id: '',
    membership_category: '',
    membership_status: '',
    registration_status: '',
    year_id: '',
    year_payment_status: '',
  });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [draftColumns, setDraftColumns] = useState(DEFAULT_COLUMNS);
  const [visible, setVisible] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rwvca_members_display_columns') || 'null');
      return Array.isArray(saved) && saved.length ? saved : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  const orderedKeys = (keys) => COLUMN_OPTIONS.map((col) => col.key).filter((key) => keys.includes(key));

  const toggleDraft = (key, checked) => {
    setDraftColumns((prev) => orderedKeys(checked ? [...prev, key] : prev.filter((item) => item !== key)));
  };

  const loadMeta = async () => {
    const res = await api.get('/members/meta');
    setPlatforms(res.data?.platforms || []);
    setYears(res.data?.years || []);
  };

  const load = async () => {
    try {
      const res = await api.get('/members', { search, ...filters, limit: 200 });
      setItems(res.data?.items || []);
      setSummary(res.data?.summary || { total: 0, paid: 0, active: 0, showing: 0 });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load members');
    }
  };

  useEffect(() => {
    loadMeta().catch(() => {});
    load().catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('rwvca_members_display_columns', JSON.stringify(visible));
  }, [visible]);

  const columns = useMemo(() => COLUMN_OPTIONS.filter((col) => visible.includes(col.key)).map((col) => ({
    ...col,
    render: (row) => {
      if (col.key === 'platform') return row.platformCategory?.name || '—';
      if (col.key === 'shareholder') return Number(row.shareholder) === 1 ? 'Yes' : 'No';
      if (col.key === 'is_active') return <StatusBadge value={Number(row.is_active) === 1 ? 'Active' : 'Inactive'} />;
      if (['membership_status', 'registration_status', 'membership_category'].includes(col.key)) {
        return <StatusBadge value={row[col.key]} />;
      }
      if (col.key === 'rwvca_role') return Number(row.has_rwvca_role) === 1 ? (row.rwvca_role || 'Yes') : '—';
      if (col.key === 'date_joined' || col.key === 'registration_paid_date') return formatDate(row[col.key]);
      if (col.key.startsWith('employees_')) return Number(row[col.key] || 0);
      return row[col.key] || '—';
    },
  })), [visible]);

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.company_name || 'this member'}? This cannot be undone.`)) return;
    try {
      await api.del(`/members/${row.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete member');
    }
  };

  const exportRows = () => {
    exportCsv('rwvca-members', columns.map((col) => ({
      key: col.key,
      label: col.label,
      value: (row) => {
        if (col.key === 'platform') return row.platformCategory?.name || '';
        if (col.key === 'shareholder') return Number(row.shareholder) === 1 ? 'Yes' : 'No';
        if (col.key === 'is_active') return Number(row.is_active) === 1 ? 'Active' : 'Inactive';
        return row[col.key] ?? '';
      },
    })), items);
  };

  return (
    <div className="space-y-4">
      <PageHeading
        title="Members"
        subtitle="Browse, search, and manage all registered members"
        icon={<Users className="h-6 w-6" />}
        actions={[
          { label: 'Columns', variant: 'secondary', icon: <Columns3 className="h-4 w-4" />, onClick: () => { setDraftColumns(orderedKeys(visible)); setColumnsOpen(true); } },
          { label: 'Export', variant: 'secondary', icon: <Download className="h-4 w-4" />, onClick: exportRows, disabled: !items.length },
          ...(manager ? [{ label: 'Add member', variant: 'primary', icon: <Plus className="h-4 w-4" />, onClick: () => navigate('/dashboard/members/new') }] : []),
        ]}
      />
      <MemberNav />

      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ['Total members', summary.total],
          ['Umusanzu paid', summary.paid],
          ['Active', summary.active],
          ['Showing', summary.showing ?? items.length],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-[#2f5d31] mt-1">{value}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); load(); }}
        className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
      >
        <label className="text-sm text-gray-600">
          Search
          <input className={`mt-1 ${inputClass}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company, owner, email, phone" />
        </label>
        <label className="text-sm text-gray-600">
          Platform
          <select className={`mt-1 ${inputClass}`} value={filters.membership_category_platform_id} onChange={(e) => setFilters((prev) => ({ ...prev, membership_category_platform_id: e.target.value }))}>
            <option value="">All platforms</option>
            {platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-600">
          Membership category
          <select className={`mt-1 ${inputClass}`} value={filters.membership_category} onChange={(e) => setFilters((prev) => ({ ...prev, membership_category: e.target.value }))}>
            <option value="">All categories</option>
            {MEMBERSHIP_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-600">
          Umusanzu 2025
          <select className={`mt-1 ${inputClass}`} value={filters.membership_status} onChange={(e) => setFilters((prev) => ({ ...prev, membership_status: e.target.value }))}>
            <option value="">All</option>
            {PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-600">
          Registration
          <select className={`mt-1 ${inputClass}`} value={filters.registration_status} onChange={(e) => setFilters((prev) => ({ ...prev, registration_status: e.target.value }))}>
            <option value="">All</option>
            <option value="Paid">Paid</option>
            <option value="Not Paid">Not Paid</option>
          </select>
        </label>
        <label className="text-sm text-gray-600">
          Payment year
          <select className={`mt-1 ${inputClass}`} value={filters.year_id} onChange={(e) => setFilters((prev) => ({ ...prev, year_id: e.target.value }))}>
            <option value="">Any year</option>
            {years.map((item) => <option key={item.id} value={item.id}>{item.year_value}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-600">
          Year payment status
          <select className={`mt-1 ${inputClass}`} value={filters.year_payment_status} onChange={(e) => setFilters((prev) => ({ ...prev, year_payment_status: e.target.value }))}>
            <option value="">All</option>
            {PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="bg-[#2f5d31] text-white px-4 py-2.5 rounded-lg text-sm font-medium">Filter</button>
          <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => { setSearch(''); setFilters({ membership_category_platform_id: '', membership_category: '', membership_status: '', registration_status: '', year_id: '', year_payment_status: '' }); setTimeout(load, 0); }}>Reset</button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">{items.length} record(s) · Actions is always shown</p>
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <DataTable
          columns={columns}
          rows={items}
          actionsLabel="Actions"
          renderActions={(row) => (
            <>
              <button type="button" className="inline-flex items-center gap-1 text-[#2f5d31] font-medium mr-2" onClick={() => navigate(`/dashboard/members/${row.id}`)}>
                <Eye size={14} /> View
              </button>
              {manager && (
                <>
                  <button type="button" className="inline-flex items-center gap-1 text-emerald-700 font-medium mr-2" onClick={() => navigate(`/dashboard/members/${row.id}/edit`)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" className="inline-flex items-center gap-1 text-rose-600 font-medium" onClick={() => remove(row)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </>
          )}
        />
      </div>

      {columnsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Customize columns</h3>
                <p className="text-xs text-gray-500 mt-0.5">Choose which fields appear in the table. Actions is always shown.</p>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-700" onClick={() => setColumnsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] grid sm:grid-cols-2 gap-5">
              {COLUMN_GROUPS.map((group) => (
                <section key={group.title}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[#2f5d31] mb-2">{group.title}</h4>
                  <div className="space-y-2">
                    {group.items.map((col) => (
                      <label key={col.key} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#2f5d31] focus:ring-[#2f5d31]"
                          checked={draftColumns.includes(col.key)}
                          onChange={(e) => toggleDraft(col.key, e.target.checked)}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-[#2f5d31]"
                onClick={() => setDraftColumns(DEFAULT_COLUMNS)}
              >
                Reset to defaults
              </button>
              <div className="flex gap-2">
                <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium" onClick={() => setColumnsOpen(false)}>Close</button>
                <button
                  type="button"
                  className="bg-[#2f5d31] text-white px-4 py-2 rounded-lg text-sm font-medium"
                  onClick={() => {
                    setVisible(draftColumns.length ? draftColumns : DEFAULT_COLUMNS);
                    setColumnsOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
