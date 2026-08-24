import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, BarChart3, Eye, Search, Users } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { DataTable, inputClass } from '../../../components/ui/dataUi';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { canReviewLists } from '../../../utils/rwvcaAccess';
import { useStaffOptions } from '../workflow/helpers';
import { Donut, EmployeeProfileView, HBar, StatCard } from '../analysis/analysisShared';

function EmployeeOverview({ data, onSelect, loading }) {
  const summary = data?.summary || {};
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Employees" value={summary.employees} />
        <StatCard label="Active" value={summary.active} className="bg-emerald-600" />
        <StatCard label="Inactive" value={summary.inactive} className="bg-gray-600" />
        <StatCard label="Departments" value={summary.departments} className="bg-sky-700" />
        <StatCard label="Roles" value={summary.roles} className="bg-violet-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Gender breakdown</h3>
          <Donut items={data?.gender || []} />
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">By department</h3>
          <HBar items={data?.by_department || []} />
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Top active employees</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {(data?.top_active || []).map((item) => (
              <button
                key={item.user_id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-left text-sm hover:bg-sky-50"
                onClick={() => onSelect(item.user_id)}
              >
                <span className="truncate font-medium text-[#2f5d31]">{item.names}</span>
                <span className="ml-2 shrink-0 text-xs text-gray-500">{item.activity_total} actions</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">All employees</h3>
        <DataTable
          columns={[
            {
              key: 'names',
              label: 'Employee',
              render: (row) => (
                <button type="button" className="font-medium text-[#2f5d31]" onClick={() => onSelect(row.user_id)}>
                  {row.names}
                </button>
              ),
            },
            { key: 'department', label: 'Department' },
            { key: 'role', label: 'Role' },
            { key: 'gender', label: 'Gender' },
            {
              key: 'activity_total',
              label: 'Activity',
              render: (row) => (
                <span className="inline-flex items-center gap-1">
                  <Activity size={14} className="text-gray-400" />
                  {row.activity_total}
                </span>
              ),
            },
            {
              key: 'modules',
              label: 'Modules used',
              render: (row) => {
                const a = row.activity || {};
                const parts = [
                  a.missions ? `${a.missions} missions` : null,
                  a.leave ? `${a.leave} leave` : null,
                  a.requisitions ? `${a.requisitions} req` : null,
                  a.vehicles ? `${a.vehicles} vehicle` : null,
                ].filter(Boolean);
                return parts.length ? parts.join(' · ') : '—';
              },
            },
          ]}
          rows={data?.employees || []}
          empty={loading ? 'Loading employees...' : 'No employees match your filters'}
          renderActions={(row) => (
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-[#2f5d31]"
              onClick={() => onSelect(row.user_id)}
            >
              <Eye size={14} /> View
            </button>
          )}
        />
      </div>
    </div>
  );
}

export default function EmployeeAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departments } = useStaffOptions();
  const isHr = canReviewLists(user?.role);
  const isSelf = id && Number(id) === Number(user?.id);
  const canView = isHr || isSelf;
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [overview, setOverview] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/analysis/overview', { year, search, department_id: departmentId || undefined, role: role || undefined, limit: 300 });
      setOverview(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load employee overview');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (employeeId) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${employeeId}/analysis`, { year });
      setDetail(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load employee profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    if (id) loadDetail(id).catch(() => {});
    else if (isHr) loadOverview().catch(() => {});
  }, [id, year, isHr, canView]);

  const roles = useMemo(() => {
    const set = new Set((overview?.employees || []).map((row) => row.role).filter(Boolean));
    return [...set].sort();
  }, [overview]);

  if (!canView) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-gray-600 ring-1 ring-gray-100">
        Employee analysis is available to HR, ED, and administrators. Use My Analysis for your own records.
      </div>
    );
  }

  const selectEmployee = (employeeId) => {
    navigate(`/dashboard/employee-analysis/${employeeId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title={id ? (detail?.employee?.names || 'Employee profile') : 'Employee Analysis'}
        subtitle="Analyze employee data, attendance, and performance"
        icon={<Users className="h-6 w-6" />}
        showBack
        backTo={id ? '/dashboard/employee-analysis' : '/dashboard'}
        actions={id ? [{
          label: 'All employees',
          variant: 'secondary',
          icon: <ArrowLeft className="h-4 w-4" />,
          onClick: () => navigate('/dashboard/employee-analysis'),
        }] : [{
          label: 'My analysis',
          variant: 'secondary',
          icon: <BarChart3 className="h-4 w-4" />,
          onClick: () => navigate('/dashboard/my-analysis'),
        }]}
      />

      {!id && isHr && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <form
            onSubmit={(e) => { e.preventDefault(); loadOverview(); }}
            className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <label className="text-sm text-gray-600">
              Search employee
              <div className="relative mt-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, role..." />
              </div>
            </label>
            <label className="text-sm text-gray-600">
              Year
              <select className={`mt-1 ${inputClass}`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[year - 1, year, year + 1].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Department
              <select className={`mt-1 ${inputClass}`} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">All departments</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Role
              <select className={`mt-1 ${inputClass}`} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">All roles</option>
                {roles.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white">
              {loading ? 'Loading...' : 'Apply filters'}
            </button>
          </form>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {id ? (
        detail ? (
          <EmployeeProfileView data={detail} year={year} onYearChange={setYear} />
        ) : (
          <p className="text-sm text-gray-500">{loading ? 'Loading employee profile...' : 'Employee not found'}</p>
        )
      ) : (
        <EmployeeOverview data={overview} onSelect={selectEmployee} loading={loading} />
      )}
    </div>
  );
}
