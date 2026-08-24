import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import { StatusBadge } from '../../../components/ui/dataUi';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import api from '../../../services/api';
import { formatDate } from '../workflow/helpers';
import { MemberNav, UMUSANZU_YEAR, categoryDetails } from './memberShared';

function Row({ label, children }) {
  return (
    <div className="grid sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="sm:col-span-2 text-sm text-gray-800">{children || '—'}</div>
    </div>
  );
}

export default function MemberViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/members/${id}`).then((res) => setItem(res.data)).catch((err) => {
      setError(err.response?.data?.message || 'Member not found');
    });
  }, [id]);

  if (!item && !error) return <DetailPageSkeleton />;
  const details = categoryDetails(item || {});
  const payments = (item?.member_year_payments_member_id || []).slice().sort((a, b) => Number(b.year?.year_value || 0) - Number(a.year?.year_value || 0));
  const employees = Number(item?.employees_women || 0) + Number(item?.employees_men || 0) + Number(item?.employees_pwd || 0);

  return (
    <div className="space-y-4">
      <PageHeading
        title={item?.company_name || 'Member details'}
        subtitle="View member profile and details"
        icon={<UserCheck className="h-6 w-6" />}
        showBack
        backTo="/dashboard/members"
        actions={[
          { label: 'Edit', variant: 'primary', onClick: () => navigate(`/dashboard/members/${id}/edit`) },
        ]}
      />
      <MemberNav />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {item && (
        <>
          <div className="bg-[#2f5d31] text-white rounded-xl p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xl font-semibold">{item.company_name}</p>
              <p className="text-white/80">{item.owner_name}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge value={Number(item.is_active) === 1 ? 'Active' : 'Inactive'} />
              <StatusBadge value={item.membership_category} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
              <h3 className="font-semibold mb-3">Basic information</h3>
              <Row label="Company">{item.company_name}</Row>
              <Row label="Owner">{item.owner_name}</Row>
              <Row label="Shareholder">{Number(item.shareholder) === 1 ? 'Yes' : 'No'}</Row>
              <Row label="Gender">{item.gender}</Row>
              <Row label="RDB Certificate">{item.rdb_certificate}</Row>
              <Row label="TIN">{item.tin}</Row>
              <Row label="National ID">{item.national_id}</Row>
            </section>
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
              <h3 className="font-semibold mb-3">Contact</h3>
              <Row label="Province">{item.province}</Row>
              <Row label="District">{item.district}</Row>
              <Row label="Role in company">{item.role}</Row>
              {Number(item.has_rwvca_role) === 1 && <Row label="RWVCA role">{item.rwvca_role}</Row>}
              <Row label="Phone">{item.phone}</Row>
              <Row label="Email">{item.email}</Row>
              <Row label="Date joined">{formatDate(item.date_joined)}</Row>
            </section>
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
              <h3 className="font-semibold mb-3">Membership</h3>
              <Row label="Platform">{item.platformCategory?.name}</Row>
              <Row label="Membership category"><StatusBadge value={item.membership_category} /></Row>
              <Row label={`Umusanzu ${UMUSANZU_YEAR}`}><StatusBadge value={item.membership_status} /></Row>
              <Row label="Registration"><StatusBadge value={item.registration_status} /></Row>
              <Row label="Registration paid date">{formatDate(item.registration_paid_date)}</Row>
            </section>
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
              <h3 className="font-semibold mb-3">Employees</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Women</p><p className="text-xl font-bold text-[#2f5d31]">{item.employees_women || 0}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Men</p><p className="text-xl font-bold text-[#2f5d31]">{item.employees_men || 0}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">PWD</p><p className="text-xl font-bold text-[#2f5d31]">{item.employees_pwd || 0}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-[#2f5d31]">{employees}</p></div>
              </div>
            </section>
          </div>

          <section className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
            <h3 className="font-semibold mb-3">Annual payments by year</h3>
            <div className="flex flex-wrap gap-2">
              {payments.length ? payments.map((row) => (
                <div key={row.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">{row.year?.year_value}</span>
                  <StatusBadge value={row.payment_status} />
                </div>
              )) : <p className="text-sm text-gray-400">No yearly payments recorded</p>}
            </div>
          </section>

          {details && (
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5">
              <h3 className="font-semibold mb-3">Platform details</h3>
              {Number(item.membership_category_platform_id) === 1 && (
                <>
                  <Row label="Land size (ha)">{details.land_size}</Row>
                  <Row label="Seed type">{details.seed_type}</Row>
                  <Row label="Seed quantity">{details.seed_quantity}</Row>
                  <Row label="Land ownership">{details.land_ownership}</Row>
                </>
              )}
              {Number(item.membership_category_platform_id) === 2 && (
                <>
                  <Row label="Forest area (ha)">{details.forest_area}</Row>
                  <Row label="Forest type">{details.forest_type}</Row>
                </>
              )}
              {Number(item.membership_category_platform_id) === 3 && <Row label="Cluster">{details.cluster}</Row>}
              {Number(item.membership_category_platform_id) === 4 && (
                <>
                  <Row label="Products">{details.products}</Row>
                  <Row label="Cluster">{details.cluster}</Row>
                </>
              )}
              {Number(item.membership_category_platform_id) === 5 && (
                <>
                  <Row label="Products">{details.products}</Row>
                  <Row label="Cluster">{details.cluster}</Row>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
