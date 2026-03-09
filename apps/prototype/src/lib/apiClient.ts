/**
 * Centralized HTTP client for the MUSAED backend API.
 * Handles auth tokens, base URL, and common request/response patterns.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  try {
    localStorage.setItem('musaed_access_token', access);
    localStorage.setItem('musaed_refresh_token', refresh);
  } catch {
    // SSR or restricted context
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  try {
    localStorage.removeItem('musaed_access_token');
    localStorage.removeItem('musaed_refresh_token');
    localStorage.removeItem('musaed_user');
  } catch {
    // ignore
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  try {
    accessToken = localStorage.getItem('musaed_access_token');
  } catch {
    // ignore
  }
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  try {
    refreshToken = localStorage.getItem('musaed_refresh_token');
  } catch {
    // ignore
  }
  return refreshToken;
}

export function saveUser(user: Record<string, unknown>): void {
  try {
    localStorage.setItem('musaed_user', JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function getSavedUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('musaed_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken ?? rt);
    return true;
  } catch {
    return false;
  }
}

export interface ApiError {
  status: number;
  message: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: ApiError = {
      status: res.status,
      message: body.message ?? res.statusText,
    };
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
