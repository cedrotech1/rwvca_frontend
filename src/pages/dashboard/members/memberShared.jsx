import { Link, useLocation } from 'react-router-dom';

export const UMUSANZU_YEAR = 2025;
export const MEMBERSHIP_CATEGORIES = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Orange'];
export const PAYMENT_STATUSES = ['Paid', 'Partial', 'Not Paid'];
export const DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge', 'Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo',
  'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango',
  'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana',
  'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro',
];
export const PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'];

export const emptyMember = () => ({
  company_name: '',
  owner_name: '',
  shareholder: 0,
  gender: 'Male',
  membership_category_platform_id: '',
  membership_category: '',
  phone: '',
  email: '',
  province: '',
  district: '',
  role: '',
  has_rwvca_role: 0,
  rwvca_role: '',
  rdb_certificate: '',
  tin: '',
  national_id: '',
  membership_status: 'Not Paid',
  registration_status: 'Not Paid',
  registration_paid_date: '',
  date_joined: new Date().toISOString().slice(0, 10),
  is_active: 1,
  employees_women: 0,
  employees_men: 0,
  employees_pwd: 0,
  year_payments: {},
  land_size: '',
  seed_type: '',
  seed_quantity: '',
  land_ownership: '',
  forest_area: '',
  forest_type: '',
  harvesting_cluster: '',
  furniture_products: '',
  furniture_cluster: '',
  sales_products: '',
  sales_cluster: '',
});

export function memberFromApi(row) {
  const form = emptyMember();
  if (!row) return form;
  Object.keys(form).forEach((key) => {
    if (row[key] !== undefined && row[key] !== null && key !== 'year_payments') form[key] = row[key];
  });
  const payments = {};
  (row.member_year_payments_member_id || []).forEach((item) => {
    payments[item.year_id] = item.payment_status;
  });
  form.year_payments = payments;
  const nursery = row.nursery_details_member_id?.[0] || {};
  const forest = row.forest_details_member_id?.[0] || {};
  const harvest = row.harvesting_details_member_id?.[0] || {};
  const furniture = row.furniture_details_member_id?.[0] || {};
  const sales = row.sales_details_member_id?.[0] || {};
  form.land_size = nursery.land_size || '';
  form.seed_type = nursery.seed_type || '';
  form.seed_quantity = nursery.seed_quantity || '';
  form.land_ownership = nursery.land_ownership || '';
  form.forest_area = forest.forest_area || '';
  form.forest_type = forest.forest_type || '';
  form.harvesting_cluster = harvest.cluster || '';
  form.furniture_products = furniture.products || '';
  form.furniture_cluster = furniture.cluster || '';
  form.sales_products = sales.products || '';
  form.sales_cluster = sales.cluster || '';
  return form;
}

export function categoryDetails(row) {
  const id = Number(row?.membership_category_platform_id);
  if (id === 1) return row.nursery_details_member_id?.[0] || null;
  if (id === 2) return row.forest_details_member_id?.[0] || null;
  if (id === 3) return row.harvesting_details_member_id?.[0] || null;
  if (id === 4) return row.furniture_details_member_id?.[0] || null;
  if (id === 5) return row.sales_details_member_id?.[0] || null;
  return null;
}

export function MemberNav() {
  const location = useLocation();
  const items = [
    { to: '/dashboard/members/new', label: 'Add member' },
    { to: '/dashboard/members', label: 'Member list' },
    { to: '/dashboard/members/statistics', label: 'Membership statistics' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${active ? 'bg-[#2f5d31] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
