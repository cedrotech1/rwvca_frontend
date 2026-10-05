import axios from 'axios';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, isPublicPath, routerBasename } from '../../utils/appPaths.js';

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isLocalApiUrl(url) {
  if (!url) return true;
  if (url.startsWith('/')) return false;
  try {
    return isLocalHostname(new URL(url).hostname);
  } catch {
    return true;
  }
}

const PUBLIC_API_BASE_URL = 'https://api-2.rwvca.org.rw/api/v1';

export function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof window === 'undefined' || isLocalHostname(window.location.hostname)) {
    return fromEnv || 'http://localhost:9000/api/v1';
  }
  if (fromEnv && !isLocalApiUrl(fromEnv) && !fromEnv.startsWith('/')) return fromEnv;
  return PUBLIC_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 20000),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    if (status === 401 || code === 'ACCOUNT_FORCE_DEACTIVATED') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
        const loginPath = `${routerBasename() === '/' ? '' : routerBasename()}/login`;
        if (code === 'ACCOUNT_FORCE_DEACTIVATED') {
          window.location.href = `${loginPath}?error=${encodeURIComponent('Your account has been deactivated by an administrator.')}`;
        } else {
          window.location.href = loginPath;
        }
      }
    } else if (status === 403 && code === 'PROFILE_INCOMPLETE') {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/dashboard/profile')) {
        const base = routerBasename() === '/' ? '' : routerBasename();
        window.location.href = `${base}/dashboard/profile`;
      }
    }
    return Promise.reject(error);
  }
);

export function fileUrl(storedPath, { auth = false } = {}) {
  if (!storedPath) return '';
  const value = String(storedPath);
  if (value.startsWith('data:')) return value;
  if ((value.startsWith('http://') || value.startsWith('https://')) && !/\/uploads\//i.test(value)) {
    return value;
  }

  let relative = value;
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      relative = new URL(value).pathname;
    }
  } catch {
    relative = value;
  }

  relative = String(relative)
    .replace(/^\/+/, '')
    .replace(/^api\/v1\//i, '')
    .replace(/^uploads\//i, '')
    .split('?')[0];

  let url = `${API_BASE_URL}/uploads/${relative}`;
  if (auth) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
  }
  return url;
}

export async function fetchProtectedBlob(urlOrPath) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const href = String(urlOrPath || '');
  const looksLikeStoredFile = href && !href.startsWith('/documents/') && (
    href.includes('/uploads/') || !href.startsWith('/')
  );
  const url = href.startsWith('http')
    ? href
    : looksLikeStoredFile && !href.startsWith('/api')
      ? fileUrl(href, { auth: true })
      : `${API_BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    let message = 'Could not download file';
    try {
      const payload = await response.clone().json();
      if (payload?.message) message = payload.message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  const contentType = String(response.headers.get('content-type') || '');
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    throw new Error(payload?.message || 'Could not download file');
  }
  return response.blob();
}

export async function openProtectedFile(urlOrPath) {
  const blob = await fetchProtectedBlob(urlOrPath);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return objectUrl;
}

export async function downloadProtectedFile(urlOrPath, filename = 'download') {
  const blob = await fetchProtectedBlob(urlOrPath);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export default apiClient;
