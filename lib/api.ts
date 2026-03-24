// lib/api.ts
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Access token lives in memory only.
// Never written to localStorage or sessionStorage.
// Lost on page refresh — silentRefresh restores it via httpOnly cookie.
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  skipRefresh?: boolean;
};

export type ApiError = {
  status: number;
  message: string;
};

export async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipRefresh = false } = options;

  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await silentRefresh();
    if (!refreshed) {
      throw { status: 401, message: 'Session expired' };
    }
    return apiRequest<T>(path, { ...options, skipRefresh: true });
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw { status: res.status, message: error.message ?? 'Request failed' };
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}
