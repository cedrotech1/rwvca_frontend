export const VAT_RATE = 18 / 118;
export const TIMBER_TYPES = [
  { name: 'PINUS', msf: 50 },
  { name: 'MADRIEN', msf: 30 },
  { name: 'PLANCHE', msf: 20 },
  { name: 'INTURUSU NINI', msf: 30 },
  { name: 'INTURUSU NTOYA', msf: 30 },
  { name: 'PINUS NTOYA', msf: 50 },
];
export const DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge', 'Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo',
  'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango',
  'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana',
  'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro',
];
export const PAYMENT_FIELDS = [
  { method: 'MOMO', label: 'TOTAL RWF PAID ON MOMO PAY' },
  { method: 'CASH', label: 'TOTAL RWF PAID ON CASH' },
  { method: 'NOT_INVOICED', label: 'AMOUNT NOT INVOICED' },
  { method: 'BANK', label: 'TOTAL RWF DEPOSITED ON BANK' },
  { method: 'MEMBERSHIP_FEES_REGISTRETION', label: 'MEMBERSHIP FEES REGISTRATION' },
  { method: 'MEMBERSHIP_FEES_CONTRIBUTION', label: 'MEMBERSHIP FEES CONTRIBUTION' },
];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function num(value) {
  if (value == null || value === '') return 0;
  const amount = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(amount) ? 0 : amount;
}

export function round2(value) {
  return Math.round(num(value) * 100) / 100;
}

export function calcNormal(row) {
  const quantity = num(row.number_of_timber);
  const price = num(row.price);
  const type = TIMBER_TYPES.find((item) => item.name === row.timber_name);
  const total_cost = round2(quantity * price);
  const vat = round2(total_cost * VAT_RATE);
  const msf = round2(quantity * (type?.msf || 0));
  return { ...row, total_cost, vat, msf, mst: 0, vat_and_msf: round2(vat + msf), vat_and_mst: 0 };
}

export function calcOther(row) {
  const quantity = num(row.number_of_timber);
  const price = num(row.price);
  const msfInput = num(row.msf);
  const total_cost = round2(quantity * price);
  const vat = round2(total_cost * VAT_RATE);
  const mst = round2(quantity * msfInput);
  return { ...row, total_cost, vat, msf: msfInput, mst, vat_and_msf: 0, vat_and_mst: round2(vat + mst) };
}

export function sum(rows, key) {
  return rows.reduce((total, row) => total + num(row[key]), 0);
}

export function periodFromType(form) {
  const type = form.report_type;
  const year = Number(form.year || form.yearly_year || new Date().getFullYear());
  if (type === 'DAILY') {
    const date = form.daily_date || form.start_date;
    return { start_date: date, end_date: date, year: date ? new Date(date).getFullYear() : year };
  }
  if (type === 'WEEKLY') {
    return { start_date: form.start_date, end_date: form.end_date, year: form.start_date ? new Date(form.start_date).getFullYear() : year };
  }
  if (type === 'MONTHLY') {
    const monthIndex = MONTHS.indexOf(form.monthly_month);
    if (monthIndex < 0 || !form.yearly_year) return { start_date: '', end_date: '', year };
    const y = Number(form.yearly_year);
    const last = new Date(y, monthIndex + 1, 0).getDate();
    return { start_date: `${y}-${String(monthIndex + 1).padStart(2, '0')}-01`, end_date: `${y}-${String(monthIndex + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`, year: y };
  }
  if (type === 'QUARTERLY') {
    const q = Number(form.quarter);
    const y = Number(form.yearly_year || year);
    if (!q) return { start_date: '', end_date: '', year: y };
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const last = new Date(y, endMonth, 0).getDate();
    return {
      start_date: `${y}-${String(startMonth).padStart(2, '0')}-01`,
      end_date: `${y}-${String(endMonth).padStart(2, '0')}-${String(last).padStart(2, '0')}`,
      year: y,
    };
  }
  if (type === 'YEARLY') {
    const y = Number(form.yearly_year || year);
    return { start_date: `${y}-01-01`, end_date: `${y}-12-31`, year: y };
  }
  return { start_date: form.start_date, end_date: form.end_date, year };
}

function padDate(value) {
  return String(value).padStart(2, '0');
}

export function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;
}

export function currentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

export function formatReportPeriod(row) {
  const type = String(row.report_type || '').toUpperCase();
  if (type === 'MONTHLY' && row.monthly_month) return `${row.monthly_month} ${row.yearly_year || ''}`.trim();
  if (type === 'QUARTERLY' && row.quarter) return `Q${row.quarter} ${row.yearly_year || ''}`.trim();
  if (type === 'YEARLY' && (row.yearly_year || row.year)) return String(row.yearly_year || row.year);
  if (row.start_date && row.end_date && String(row.start_date).slice(0, 10) !== String(row.end_date).slice(0, 10)) {
    return `${String(row.start_date).slice(0, 10)} – ${String(row.end_date).slice(0, 10)}`;
  }
  return row.start_date ? String(row.start_date).slice(0, 10) : '—';
}
