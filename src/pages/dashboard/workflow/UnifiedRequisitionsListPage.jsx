import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Eye, Plus } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, inputClass } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { canAuthorizeSupply, canManageSupply, hasPrivilege } from '../../../utils/rwvcaAccess';
import ListPage from './ListPage';

const TYPE_TABS = [
  { value: 'purchase', label: 'Purchase / expense' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'hygienic', label: 'Hygienic' },
];

const DATE_FILTERS = [
  { name: 'date_from', type: 'date', label: 'From Date' },
  { name: 'date_to', type: 'date', label: 'To Date' },
];

const REQ_STATUS = {
  name: 'status',
  label: 'Status',
  allLabel: 'All Statuses',
  options: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'verification_process', label: 'Verification' },
    { value: 'approved', label: 'Approved' },
    { value: 'authorized', label: 'Authorized' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'reverted', label: 'Reverted' },
  ],
};

function SupplyList({ supplyType }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const manage = canManageSupply(user);
  const authorize = canAuthorizeSupply(user);
  const scopeTabs = useMemo(() => {
    const list = [{ value: 'my', label: 'My' }];
    if (manage) list.push({ value: 'logistic', label: 'Logistic' });
    if (manage || authorize) list.push({ value: 'all', label: 'All' });
    return list;
  }, [manage, authorize]);

  const [scope, setScope] = useState(scopeTabs[0]?.value || 'my');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!scopeTabs.some((t) => t.value === scope)) setScope(scopeTabs[0]?.value || 'my');
  }, [scopeTabs, scope]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/supply-requisitions', {
        tab: scope,
        search: search || undefined,
        supply_type: supplyType,
        limit: 200,
      });
      const rows = (res.data?.items || []).filter(
        (row) => !supplyType || String(row.supply_type || '').toLowerCase() === supplyType
      );
      setItems(rows);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load requisitions');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [scope, supplyType]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {scopeTabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setScope(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              scope === t.value ? 'bg-[#2f5d31] text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          className={`max-w-sm ${inputClass}`}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <DataTable
        loading={loading}
        empty={`No ${supplyType} requisitions`}
        columns={[
          { key: 'id', label: 'Requisition #', value: (row) => `#${row.id}` },
          {
            key: 'supply_type',
            label: 'Type',
            value: (row) => <span className="capitalize">{row.supply_type}</span>,
          },
          { key: 'status', label: 'Status', value: (row) => <StatusBadge value={row.status} /> },
          { key: 'preparer', label: 'Prepared by', value: (row) => row.preparer?.names || '—' },
          { key: 'items', label: 'Items', value: (row) => (row.items || []).length },
          { key: 'created_at', label: 'Created', value: (row) => String(row.created_at || '').slice(0, 10) },
        ]}
        rows={items}
        renderActions={(row) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31]"
            onClick={() => navigate(`/dashboard/requisitions/supply/${row.id}`)}
          >
            <Eye className="h-4 w-4" /> Open
          </button>
        )}
      />
    </div>
  );
}

export default function UnifiedRequisitionsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = String(searchParams.get('type') || 'purchase').toLowerCase();
  const activeType = TYPE_TABS.some((t) => t.value === typeParam) ? typeParam : 'purchase';
  const canCreate = hasPrivilege(user, 'menu.create.requisition')
    || hasPrivilege(user, 'menu.create.supply_requisition')
    || hasPrivilege(user, 'menu.supply_requisitions');

  const setType = (value) => {
    setSearchParams({ type: value }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<ClipboardList className="h-6 w-6" />}
        title="Requisitions"
        subtitle="Purchase, kitchen, and hygienic requests — same place; kitchen & hygienic go to logistic"
        actions={canCreate ? [{
          label: 'Create',
          onClick: () => navigate(`/dashboard/create/requisitions?type=${activeType === 'purchase' ? 'purchase' : activeType}`),
          icon: <Plus className="h-4 w-4" />,
        }] : undefined}
      />

      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              activeType === t.value ? 'bg-[#2f5d31] text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeType === 'purchase' ? (
        <ListPage
          hideHeading
          title="Requisitions"
          subtitle="Manage purchase and expense requisitions"
          apiPath="/requisitions"
          openTo="/dashboard/requisitions"
          createTo="/dashboard/create/requisitions?type=purchase"
          editTo="/dashboard/requisitions/:id/edit"
          canEditRow={() => true}
          canDeleteRow={() => true}
          actionsIconOnly
          tabs={[
            { value: 'my', label: 'My Requisitions' },
            { value: 'received', label: 'Received' },
            { value: 'all', label: 'All Requisitions', reviewerOnly: true },
          ]}
          filters={[REQ_STATUS, ...DATE_FILTERS]}
          columns={[
            { key: 'id', label: 'Requisition #', format: 'id' },
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'preparer.names', label: 'Prepared By' },
            { key: 'department.name', label: 'Department' },
            { key: 'status', label: 'Status', format: 'status' },
            { key: 'total_amount_requested', label: 'Total Amount', format: 'money' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ]}
          documentTo="/dashboard/requisitions/:id/document"
        />
      ) : (
        <SupplyList supplyType={activeType} />
      )}
    </div>
  );
}
