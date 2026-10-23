import { useEffect, useMemo, useState } from 'react';
import { Download, Package, Warehouse } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, StatusBadge, exportCsv, inputClass } from '../../../components/ui/dataUi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { hasPrivilege } from '../../../utils/rwvcaAccess';

function conditionOf(asset) {
  const raw = String(asset.condition_status || asset.condition || '').toLowerCase();
  if (raw) return raw;
  const status = String(asset.status || '').toLowerCase();
  if (status === 'damaged') return 'damaged';
  if (status === 'issued') return 'in_use';
  if (status === 'available' || status === 'returned') return 'good';
  return status || 'unknown';
}

function isInUse(asset) {
  if (asset.in_use === 1 || asset.in_use === true) return true;
  return String(asset.status || '').toLowerCase() === 'issued' || String(asset.location || '').toLowerCase() === 'user';
}

function parseItemNames(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function summarizeItems(row, preview = 3) {
  const names = parseItemNames(row.item_names);
  const count = Number(row.item_count) || names.length;
  if (!count && !names.length) return { count: 0, preview: '—', title: '' };
  const unique = [...new Set(names)];
  const shown = unique.slice(0, preview);
  const more = Math.max(unique.length - shown.length, 0);
  const previewText = shown.length
    ? `${shown.join(', ')}${more ? ` +${more} more` : ''}`
    : `${count} item${count === 1 ? '' : 's'}`;
  return {
    count,
    preview: previewText,
    title: unique.join(', '),
  };
}

async function fetchInventorySummary() {
  try {
    const res = await api.get('/inventory/summary');
    return res.data?.items || res.data || [];
  } catch {
    const res = await api.get('/inventory/summary/report');
    return res.data?.items || res.data || [];
  }
}

export default function LogisticDashboardPage() {
  const { user } = useAuth();
  const allowed = hasPrivilege(user, 'menu.logistic_dashboard')
    || hasPrivilege(user, 'logistic.dashboard')
    || hasPrivilege(user, 'menu.inventory');

  const [summary, setSummary] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [conditionFilter, setConditionFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRows, invRes, assetsRes] = await Promise.all([
        fetchInventorySummary(),
        api.get('/inventory', { limit: 500 }).catch(() => ({ data: { items: [] } })),
        api.get('/assets', { limit: 500 }).catch(() => ({ data: { items: [] } })),
      ]);
      setSummary(Array.isArray(summaryRows) ? summaryRows : []);
      setInventoryItems(invRes.data?.items || invRes.data || []);
      setAssets(assetsRes.data?.items || assetsRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load logistic dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    load().catch(() => {});
  }, [allowed]);

  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => Number(item.current_quantity || 0) <= Number(item.min_stock || 0)),
    [inventoryItems]
  );

  const assetStats = useMemo(() => {
    const stats = {
      in_use: 0,
      out_of_service: 0,
      damaged: 0,
      missing: 0,
      good: 0,
      total: assets.length,
    };
    assets.forEach((asset) => {
      const cond = conditionOf(asset);
      if (cond === 'out_of_service' || cond === 'out of service') stats.out_of_service += 1;
      else if (cond === 'damaged') stats.damaged += 1;
      else if (cond === 'missing') stats.missing += 1;
      else if (cond === 'good' || cond === 'in_use') stats.good += 1;
      if (isInUse(asset)) stats.in_use += 1;
      if (String(asset.status || '').toLowerCase() === 'damaged' && cond !== 'damaged') stats.damaged += 1;
    });
    return stats;
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!conditionFilter) return assets;
    return assets.filter((asset) => {
      const cond = conditionOf(asset);
      if (conditionFilter === 'in_use') return isInUse(asset);
      return cond === conditionFilter || String(asset.status || '').toLowerCase() === conditionFilter;
    });
  }, [assets, conditionFilter]);

  const totalStock = summary
    .filter((row) => String(row.category || '').toUpperCase() !== 'TOTAL')
    .reduce((sum, row) => sum + Number(row.total_stock || 0), 0);
  const totalLow = summary
    .filter((row) => String(row.category || '').toUpperCase() !== 'TOTAL')
    .reduce((sum, row) => sum + Number(row.low_stock_count || 0), 0)
    || lowStockItems.length;

  if (!allowed) {
    return (
      <PageHeading
        icon={<Warehouse className="h-6 w-6" />}
        title="Logistic Dashboard"
        subtitle="Access denied"
        showBack
        backTo="/dashboard"
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading
        icon={<Warehouse className="h-6 w-6" />}
        title="Logistic Dashboard"
        subtitle="Inventory stock levels and asset condition overview"
        actions={[
          {
            label: 'Export inventory CSV',
            icon: <Download className="h-4 w-4" />,
            onClick: () => exportCsv('inventory-summary', [
              { key: 'category', label: 'Category' },
              { key: 'item_names', label: 'Items' },
              { key: 'total_stock', label: 'Total stock' },
              { key: 'low_stock_count', label: 'Low stock' },
            ], summary),
          },
          {
            label: 'Export assets CSV',
            icon: <Download className="h-4 w-4" />,
            onClick: () => exportCsv('assets-logistic', [
              { key: 'name', label: 'Name' },
              { key: 'status', label: 'Status' },
              { key: 'condition_status', label: 'Condition', value: (r) => conditionOf(r) },
              { key: 'location', label: 'Location' },
              { key: 'serial_number', label: 'Serial' },
            ], filteredAssets),
          },
        ]}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card label="Inventory stock (units)" value={totalStock} icon={<Warehouse className="h-5 w-5" />} />
        <Card label="Low stock items" value={totalLow} tone="amber" />
        <Card label="Assets total" value={assetStats.total} icon={<Package className="h-5 w-5" />} />
        <Card label="Assets in use" value={assetStats.in_use} />
        <Card label="Out of service" value={assetStats.out_of_service} tone="orange" />
        <Card label="Damaged" value={assetStats.damaged} tone="rose" />
        <Card label="Missing" value={assetStats.missing} tone="rose" />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Inventory summary</h3>
        <DataTable
          empty="No inventory summary"
          columns={[
            { key: 'category', label: 'Category' },
            {
              key: 'item_names',
              label: 'Items',
              value: (row) => {
                const { count, preview, title } = summarizeItems(row);
                return (
                  <span title={title || undefined} className="block max-w-sm">
                    <span className="font-medium text-gray-800">{count} {count === 1 ? 'item' : 'items'}</span>
                    {preview !== '—' && (
                      <span className="mt-0.5 block text-xs text-gray-500 line-clamp-2">{preview}</span>
                    )}
                  </span>
                );
              },
            },
            { key: 'total_stock', label: 'Stock' },
            { key: 'low_stock_count', label: 'Low stock' },
          ]}
          rows={summary}
          rowClassName={(row) => (String(row.category || '').toUpperCase() === 'TOTAL' ? 'font-semibold bg-gray-50' : '')}
        />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-800">Assets</h3>
          <label className="text-sm text-gray-600">
            Condition filter
            <select
              className={`mt-1 ${inputClass} min-w-[180px]`}
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="in_use">In use</option>
              <option value="good">Good</option>
              <option value="out_of_service">Out of service</option>
              <option value="damaged">Damaged</option>
              <option value="missing">Missing</option>
              <option value="issued">Issued</option>
              <option value="available">Available</option>
            </select>
          </label>
        </div>
        <DataTable
          empty="No assets"
          columns={[
            { key: 'name', label: 'Asset' },
            { key: 'status', label: 'Status', value: (r) => <StatusBadge value={r.status} /> },
            { key: 'condition', label: 'Condition', value: (r) => <StatusBadge value={conditionOf(r)} /> },
            { key: 'location', label: 'Location' },
            { key: 'user', label: 'Assigned', value: (r) => r.user?.names || '—' },
            { key: 'serial_number', label: 'Serial' },
          ]}
          rows={filteredAssets}
        />
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-800">Low stock detail</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5d31]"
              onClick={() => exportCsv('low-stock', [
                { key: 'name', label: 'Item' },
                { key: 'category', label: 'Category' },
                { key: 'current_quantity', label: 'Qty' },
                { key: 'min_stock', label: 'Min' },
              ], lowStockItems)}
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <DataTable
            empty="None"
            columns={[
              { key: 'name', label: 'Item' },
              { key: 'category', label: 'Category' },
              { key: 'current_quantity', label: 'Qty' },
              { key: 'min_stock', label: 'Min stock' },
            ]}
            rows={lowStockItems}
          />
        </div>
      )}
    </div>
  );
}

function Card({ label, value, icon, tone = 'green' }) {
  const tones = {
    green: 'text-[#2f5d31]',
    amber: 'text-amber-600',
    orange: 'text-orange-600',
    rose: 'text-rose-600',
  };
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-[#2f5d31]/70">{icon}</span>}
      </div>
      <p className={`mt-1 text-3xl font-bold ${tones[tone] || tones.green}`}>{value ?? 0}</p>
    </div>
  );
}
