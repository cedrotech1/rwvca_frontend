export function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncate(value = '', length = 100) {
  const text = stripHtml(value);
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

export function breakName(name = '') {
  const words = String(name).trim().split(/\s+/);
  if (words.length < 2) return [name, ''];
  return [words[0], words.slice(1).join(' ')];
}

export function formatEventDate(dateString) {
  const date = dateString ? new Date(dateString) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { month: '', day: '', full: '' };
  }
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
    full: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

export function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export const ABOUT_COPY = {
  intro:
    'RWVCA is a national association representing stakeholders across Rwanda’s wood value chain. It promotes collaboration, advocacy, and sustainable development by bringing together actors from forestry, processing, and trade to address sector challenges and advance members’ interests.',
  objectiveTitle: 'Our Objective',
  objective:
    'Strengthen Rwanda’s wood value chain through membership, training, market access, and advocacy for sustainable forest and furniture industries.',
  missionTitle: 'Our Mission',
  mission:
    'RWVCA unites forest owners, furniture makers, and wood-product businesses to grow a sustainable wood value chain in Rwanda.',
  visionTitle: 'Our Vision',
  vision: 'A competitive, inclusive, and environmentally responsible wood industry that creates jobs and quality products.',
};

export const MAP_EMBED = 'https://www.google.com/maps?q=X4F4+V2J+Kigali&output=embed';
