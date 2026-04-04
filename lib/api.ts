// lib/api.ts
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─── Access token state ───────────────────────────────────────────────────────
//
// Access token lives in memory only.
// Never written to localStorage, sessionStorage, or cookies.
// Lost on page refresh — silentRefresh restores it via httpOnly cookie.
//
// tokenExpiry tracks when the access token expires (Unix ms).
// Used by isTokenExpiringSoon() to trigger proactive refresh.

let _accessToken: string | null = null;
let _tokenExpiry: number | null = null;
let _proactiveTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Race condition guard ─────────────────────────────────────────────────────
//
// Single shared promise for in-flight refresh requests.
// When multiple requests fire simultaneously on an expired token,
// all of them await the same refresh promise — only one request
// hits the server. Without this, multiple refreshes would trigger
// simultaneously, the second would see a rotated (revoked) token,
// and reuse detection would log out the merchant.

let _refreshPromise: Promise<boolean> | null = null;

// ─── Token management ─────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return _accessToken;
}

/**
 * Stores the access token and its expiry in memory.
 * Schedules a proactive refresh 30 seconds before expiry.
 *
 * expiresIn: seconds until the token expires (from server response)
 */
export function setAccessToken(token: string, expiresIn: number): void {
  _accessToken = token;
  // Store expiry with 30-second buffer — refresh before actual expiry
  _tokenExpiry = Date.now() + (expiresIn - 30) * 1000;
  scheduleProactiveRefresh(expiresIn - 30);
}

export function clearAccessToken(): void {
  _accessToken = null;
  _tokenExpiry = null;
  if (_proactiveTimer) {
    clearTimeout(_proactiveTimer);
    _proactiveTimer = null;
  }
}

/**
 * Returns true if the access token is missing or expiring within 30 seconds.
 * Used by apiRequest to trigger a proactive refresh before sending a request.
 */
export function isTokenExpiringSoon(): boolean {
  if (!_accessToken || !_tokenExpiry) return true;
  return Date.now() >= _tokenExpiry;
}

// ─── Proactive refresh ────────────────────────────────────────────────────────

/**
 * Schedules a silent refresh to run delaySeconds from now.
 * Clears any existing timer first — only one timer runs at a time.
 * On success, setAccessToken is called which schedules the next timer.
 * This creates a self-sustaining refresh chain while the tab is open.
 */
function scheduleProactiveRefresh(delaySeconds: number): void {
  if (_proactiveTimer) {
    clearTimeout(_proactiveTimer);
    _proactiveTimer = null;
  }

  // Don't schedule if delay is unreasonably short or negative
  if (delaySeconds <= 0) return;

  _proactiveTimer = setTimeout(async () => {
    _proactiveTimer = null;
    await silentRefresh();
    // setAccessToken (called inside silentRefresh on success)
    // will schedule the next proactive refresh automatically
  }, delaySeconds * 1000);
}

// ─── Silent refresh ───────────────────────────────────────────────────────────

export type ApiError = {
  status: number;
  message: string;
};

/**
 * Silently refreshes the access token using the httpOnly refresh cookie.
 * Uses a single shared promise to prevent race conditions — if a refresh
 * is already in flight, all callers await the same promise.
 *
 * On success: stores new access token via setAccessToken (which also
 *             schedules the next proactive refresh).
 * On failure: clears the access token — caller handles redirect to login.
 */
export async function silentRefresh(): Promise<boolean> {
  // If already refreshing — share the same promise
  if (_refreshPromise) {
    return _refreshPromise;
  }

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends httpOnly refresh_token cookie
      });

      if (!res.ok) {
        clearAccessToken();
        return false;
      }

      const data = await res.json();
      // expiresIn returned by refreshHandler — used for proactive refresh timer
      setAccessToken(data.accessToken, data.expiresIn ?? 900);
      return true;
    } catch {
      clearAccessToken();
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── API request ──────────────────────────────────────────────────────────────

type RequestOptions = {
  method?: string;
  body?: unknown;
  skipRefresh?: boolean;
};

/**
 * Makes an authenticated API request.
 *
 * Proactive check: if access token is expiring soon, refreshes before
 * sending the request — prevents 401s mid-action (e.g. mid form save).
 *
 * Reactive fallback: if server returns 401 (e.g. token expired between
 * the check and the request), attempts one silent refresh and retries.
 *
 * Race condition: silentRefresh uses a shared promise — multiple
 * simultaneous requests on an expired token all await the same refresh.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipRefresh = false } = options;

  // Proactive refresh — refresh before sending if token is expiring soon
  if (!skipRefresh && isTokenExpiringSoon()) {
    const refreshed = await silentRefresh();
    if (!refreshed) {
      throw { status: 401, message: 'Session expired' };
    }
  }

  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
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

  // Reactive fallback — 401 after proactive check means token was
  // rejected server-side (revoked, reuse detected, absolute limit reached)
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
