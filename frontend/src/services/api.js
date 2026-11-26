const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export function readCookie(name) {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  return cookie ? cookie.split('=').slice(1).join('=') : '';
}

export async function api(path, options = {}, csrfToken = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    headers['X-CSRF-Token'] = csrfToken || decodeURIComponent(readCookie('csrf_token'));
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
  return data;
}

export function asList(value, key) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}
