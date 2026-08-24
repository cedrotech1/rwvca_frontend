/**
 * Validate post-login redirect targets (internal dashboard paths only).
 */
export function sanitizeRedirectPath(path) {
  if (!path || typeof path !== 'string') return null;
  const value = decodeURIComponent(path.trim());
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/login') || value.startsWith('/forgot-password')) return null;
  return value;
}

const deployPath = (import.meta.env.BASE_URL || '/').replace(/^\/+|\/+$/g, '');
const storagePrefix = deployPath.replace(/\//g, '_') || 'rwvca';

export const TOKEN_STORAGE_KEY = `${storagePrefix}_token`;
export const USER_STORAGE_KEY = `${storagePrefix}_user`;

export function routerBasename() {
  const base = import.meta.env.BASE_URL || '/';
  const cleaned = base.replace(/\/$/, '');
  return cleaned === '' ? '/' : cleaned;
}

export function publicAssetUrl(path = '') {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = String(path).replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

export const PUBLIC_PATHS = [
  '/',
  '/about',
  '/gallery',
  '/programs',
  '/membership',
  '/members',
  '/events',
  '/contact',
  '/platforms',
  '/login',
  '/forgot-password',
];

export function isPublicPath(pathname = '') {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/dashboard')) return false;
  return PUBLIC_PATHS.some((item) => path === item || path.startsWith(`${item}/`));
}
