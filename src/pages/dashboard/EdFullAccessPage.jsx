import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  Calendar,
  ChartBar,
  CheckCircle,
  FileText,
  Grid3x3,
  List,
  MapPin,
  MessageSquare,
  Package,
  Shield,
  Ticket,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/dataUi';
import {
  cellValue,
  formatDate,
  formatPhpDateTime,
  formatMoney,
} from './workflow/helpers';
import EdCommentModal from './edFullAccess/EdCommentModal';
import {
  ED_MODULE_COLUMNS,
  ED_MODULE_GROUPS,
  ED_RECORD_LINKS,
  ED_TAB_META,
} from './edFullAccess/edFullAccessConfig';

const ICONS = {
  grid: Grid3x3,
  cart: Package,
  truck: Truck,
  calendar: Calendar,
  map: MapPin,
  files: FileText,
  file: FileText,
  chart: ChartBar,
  ticket: Ticket,
  list: List,
  chat: MessageSquare,
  tool: Wrench,
  check: CheckCircle,
  shield: Shield,
  users: Users,
  box: Box,
};

const VALID_TABS = Object.keys(ED_TAB_META);

function TabIcon({ name }) {
  const Icon = ICONS[name] || FileText;
  return <Icon className="h-4 w-4" />;
}

function formatCell(row, col) {
  const raw = cellValue(row, col.key);
  if (col.format === 'date') return formatDate(raw);
  if (col.format === 'datetime') return formatPhpDateTime(raw);
  if (col.format === 'money') return formatMoney(raw);
  if (col.format === 'status') return <StatusBadge status={raw} />;
  if (col.format === 'vehicle_type') {
    const type = row.type === 'Other' && row.type_other ? row.type_other : row.type;
    return <StatusBadge status={type || '—'} />;
  }
  if (col.format === 'ed_auth') {
    return row.authorized_by ? cellValue(row, 'authorized_by_name') : <span className="text-amber-600">Pending</span>;
  }
  if (col.format === 'period') {
    return `${formatDate(row[col.key])} – ${formatDate(row[col.endKey])}`;
  }
  if (col.format === 'read_hr') {
    const read = String(raw).toLowerCase() === 'read';
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${read ? 'bg-emerald-600 text-white' : 'bg-orange-500 text-white'}`}>{read ? 'HR Read' : 'HR Unread'}</span>;
  }
  if (col.format === 'read_ed') {
    const read = String(raw).toLowerCase() === 'read';
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${read ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>{read ? 'ED Read' : 'ED Unread'}</span>;
  }
  if (col.format === 'bool') return raw === true || raw === 1 || raw === '1' ? 'Yes' : 'No';
  if (col.format === 'attendance_signed') {
    return `${row.signed_count || 0} / ${row[col.totalKey] || 0}`;
  }
  if (col.empty && (raw === '—' || !raw)) return col.empty;
  if (col.subKey) {
    const sub = cellValue(row, col.subKey);
    return (
      <div>
        <div>{raw}</div>
        {sub !== '—' && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    );
  }
  return raw;
}

export default function EdFullAccessPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const commentRecord = Number(searchParams.get('comment_record') || 0);

  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [commentModal, setCommentModal] = useState({ open: false, module: '', recordId: 0, label: '' });

  const setTab = (tab) => {
    const next = new URLSearchParams();
    if (tab !== 'overview') next.set('tab', tab);
    setSearchParams(next);
  };

  const loadSummary = useCallback(async () => {
    const res = await api.get('/ed-full-access/summary');
    setSummary(res.data?.summary || {});
  }, []);

  const loadModule = useCallback(async (tab) => {
    if (tab === 'overview') {
      setRows([]);
      setCommentCounts({});
      return;
    }
    const res = await api.get(`/ed-full-access/modules/${tab}`);
    setRows(res.data?.rows || []);
    setCommentCounts(res.data?.comment_counts || {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadModule(activeTab)])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab, loadSummary, loadModule]);

  useEffect(() => {
    if (commentRecord && activeTab !== 'overview' && VALID_TABS.includes(activeTab)) {
      setCommentModal({ open: true, module: activeTab, recordId: commentRecord, label: '' });
    }
  }, [commentRecord, activeTab]);

  const grandTotal = useMemo(
    () => Object.values(summary).reduce((sum, n) => sum + Number(n || 0), 0),
    [summary],
  );

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [rows, filter]);

  const tabMeta = ED_TAB_META[activeTab] || ED_TAB_META.overview;
  const columns = ED_MODULE_COLUMNS[activeTab] || [];

  const openNotes = (module, row) => {
    const label = row.title || row.name || row.company_name || row.names || `Record #${row.id}`;
    setCommentModal({ open: true, module, recordId: row.id, label });
    const next = new URLSearchParams(searchParams);
    next.set('tab', module);
    next.set('comment_record', String(row.id));
    setSearchParams(next);
  };

  const closeNotes = () => {
    setCommentModal({ open: false, module: '', recordId: 0, label: '' });
    const next = new URLSearchParams(searchParams);
    next.delete('comment_record');
    setSearchParams(next);
  };

  const recordLink = (module, id) => {
    const fn = ED_RECORD_LINKS[module];
    return fn ? fn(id) : null;
  };

  return (
    <div className="min-h-screen bg-[#eceff1] pb-10 font-sans">
      <div className="border border-[#c5d4c8] border-l-[5px] border-l-[#025016] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide text-[#025016]">RWVCA — Executive Director Console</h1>
            <p className="mt-1 text-sm text-[#5f6b63]">
              Full system access for <strong>{user?.names || 'Executive Director'}</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs uppercase tracking-widest text-gray-500">Grand Total</div>
            <div className="inline-block border-2 border-[#025016] px-4 py-1 text-xl font-bold text-[#025016]">
              {grandTotal.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {activeTab !== 'overview' && (
        <div className="mt-3 border border-[#c5d4c8] bg-white">
          <div className="flex flex-wrap border-b-2 border-[#025016] px-2">
            {VALID_TABS.map((key) => {
              const tab = ED_TAB_META[key];
              const count = key === 'overview' ? null : summary[key];
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1 border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                    active
                      ? 'border-[#025016] bg-[#025016] text-white'
                      : 'border-transparent text-[#3d4a42] hover:bg-[#f3f7f4]'
                  }`}
                >
                  <TabIcon name={tab.icon} />
                  {tab.label}
                  {count != null && (
                    <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-black/15' : 'bg-[#e8efe9] text-[#025016]'}`}>
                      {Number(count).toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 px-4 sm:px-6">
        {activeTab === 'overview' ? (
          <div className="border border-[#c5d4c8] bg-white">
            <div className="border-b-[3px] border-[#013a10] bg-[#025016] px-4 py-3 text-sm font-bold uppercase tracking-widest text-white">
              System Modules — Summary Register
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#e8efe9] text-xs uppercase tracking-wide text-[#013a10]">
                    <th className="w-10 border border-[#c5d4c8] p-2" />
                    <th className="border border-[#c5d4c8] p-2 text-left">Module Name</th>
                    <th className="w-24 border border-[#c5d4c8] p-2 text-center">Records</th>
                    <th className="w-52 border border-[#c5d4c8] p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ED_MODULE_GROUPS).flatMap(([groupName, keys]) => [
                    <tr key={groupName} className="bg-[#dfe9e1] text-xs font-bold uppercase tracking-wide text-[#013a10]">
                      <td colSpan={4} className="border border-[#c5d4c8] p-2">{groupName}</td>
                    </tr>,
                    ...keys.map((key) => {
                      const tab = ED_TAB_META[key];
                      const count = Number(summary[key] || 0);
                      return (
                        <tr key={key} className="even:bg-[#f7faf8] hover:bg-[#eef6f0]">
                          <td className="border border-[#c5d4c8] p-2 text-center text-[#025016]">
                            <TabIcon name={tab.icon} />
                          </td>
                          <td className="border border-[#c5d4c8] p-2 text-[#2f3b34]">{tab.label}</td>
                          <td className="border border-[#c5d4c8] p-2 text-center text-lg font-bold text-[#025016]">{count.toLocaleString()}</td>
                          <td className="border border-[#c5d4c8] p-2">
                            <button type="button" onClick={() => setTab(key)} className="mr-2 border border-[#025016] px-2 py-1 text-xs font-semibold text-[#025016] hover:bg-[#025016] hover:text-white">
                              View List
                            </button>
                            <Link to={tab.openLink} className="inline-block border border-[#025016] bg-[#025016] px-2 py-1 text-xs font-semibold text-white hover:bg-[#013a10]">
                              Open Module
                            </Link>
                          </td>
                        </tr>
                      );
                    }),
                  ])}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#025016] bg-[#f0f4f1] font-bold">
                    <td className="border border-[#c5d4c8] p-2" />
                    <td className="border border-[#c5d4c8] p-2">Total across all modules</td>
                    <td className="border border-[#c5d4c8] p-2 text-center text-lg text-[#025016]">{grandTotal.toLocaleString()}</td>
                    <td className="border border-[#c5d4c8] p-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border border-[#c5d4c8] bg-white p-3">
              {VALID_TABS.filter((k) => k !== 'overview').map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className="border border-[#025016] px-3 py-1.5 text-xs font-semibold uppercase text-[#025016] hover:bg-[#025016] hover:text-white"
                >
                  {ED_TAB_META[key].label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setTab('overview')}
              className="mb-3 inline-flex items-center gap-1 border border-[#025016] px-3 py-1.5 text-xs font-semibold text-[#025016] hover:bg-[#025016] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Summary Register
            </button>

            <div className="border border-[#c5d4c8] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#013a10] bg-[#025016] px-4 py-3 text-white">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                  <TabIcon name={tabMeta.icon} />
                  {tabMeta.label} — Record Register
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter records..."
                    className="rounded border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white placeholder:text-white/70 focus:bg-white focus:text-gray-900"
                  />
                  <Link
                    to={tabMeta.openLink}
                    className="border border-white px-3 py-1.5 text-xs font-semibold uppercase hover:bg-white/10"
                  >
                    {tabMeta.openLabel}
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto p-3">
                {loading ? (
                  <p className="py-10 text-center text-sm text-gray-500">Loading records...</p>
                ) : (
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#e8efe9] text-xs uppercase tracking-wide text-[#013a10]">
                        <th className="border border-[#c5d4c8] p-2 w-10">#</th>
                        {columns.map((col) => (
                          <th key={col.key} className="border border-[#c5d4c8] p-2 text-left whitespace-nowrap">{col.label}</th>
                        ))}
                        <th className="border border-[#c5d4c8] p-2 w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length ? filteredRows.map((row, index) => {
                        const viewTo = recordLink(activeTab, row.id);
                        const noteCount = commentCounts[row.id] || 0;
                        return (
                          <tr key={row.id} className="hover:bg-[#eef6f0]">
                            <td className="border border-[#e2e8e4] p-2">{index + 1}</td>
                            {columns.map((col) => (
                              <td key={col.key} className="border border-[#e2e8e4] p-2 align-middle text-[#2f3b34]">
                                {formatCell(row, col)}
                              </td>
                            ))}
                            <td className="border border-[#e2e8e4] p-2 whitespace-nowrap">
                              {viewTo && (
                                <Link to={viewTo} className="mr-1 border border-[#025016] px-2 py-1 text-xs font-semibold text-[#025016] hover:bg-[#025016] hover:text-white">
                                  View
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => openNotes(activeTab, row)}
                                className="border border-gray-400 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                              >
                                Notes{noteCount > 0 ? ` (${noteCount})` : ''}
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={columns.length + 2} className="border border-[#e2e8e4] p-8 text-center text-gray-500">
                            No records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="border-t border-[#c5d4c8] bg-gray-50 px-4 py-2 text-xs text-gray-500">
                Showing up to 150 most recent records — use <strong>Open Module</strong> for full features.
              </div>
            </div>
          </>
        )}
      </div>

      <EdCommentModal
        open={commentModal.open}
        module={commentModal.module}
        recordId={commentModal.recordId}
        recordLabel={commentModal.label}
        onClose={closeNotes}
      />
    </div>
  );
}
