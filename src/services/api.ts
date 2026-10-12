// Shared HTTP client for the Talenti backend (FastAPI — repo BD_Bolsa_Trabajo).
//
// - With VITE_API_URL empty (default) every request is same-origin, which is
//   what the Vite dev proxy (`server.proxy` in vite.config.ts) forwards to the
//   API, so the browser never hits CORS during development.
// - With VITE_API_URL set, requests go straight to that absolute base URL
//   (the backend must then allow the SPA origin via CORS_ALLOW_ORIGINS).
//
// The client attaches the bearer access token, transparently refreshes it once
// on a 401, and normalizes every failure into an `ApiError`.

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
  type TokenPair,
} from './tokenStorage';

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

export const API_BASE_URL = (env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  /** Seconds from a `Retry-After` header (429 rate limiting), when present. */
  readonly retryAfter?: number;

  constructor(message: string, status: number, body?: unknown, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.retryAfter = retryAfter;
  }

  /**
   * Human-readable detail when the backend returned one. FastAPI uses
   * `{"detail": "..."}` for HTTPException and a `detail` array for 422
   * validation errors.
   */
  get detail(): string | null {
    const body = this.body as {detail?: unknown} | undefined;
    if (!body || body.detail === undefined) return null;
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => (item as {msg?: string})?.msg)
        .filter((msg): msg is string => typeof msg === 'string');
      return messages.length ? messages.join('; ') : null;
    }
    return null;
  }

  /** True when the SPA could not reach the API at all (offline / proxy down). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/** Build a query string, dropping empty/undefined values. */
export function buildQuery<T extends object>(params: T): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

// --- Session refresh -------------------------------------------------------- //

let onAuthFailure: (() => void) | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** Register a callback fired when the session is definitively lost (logout UI). */
export function setOnAuthFailure(handler: (() => void) | null): void {
  onAuthFailure = handler;
}

/**
 * Exchange the stored refresh token for a new pair. Concurrent 401s share one
 * in-flight request so a burst of calls cannot rotate the token twice.
 */
async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify({refresh_token: refreshToken}),
      });
      if (!res.ok) {
        clearSession();
        return false;
      }
      setSession((await res.json()) as TokenPair);
      return true;
    } catch {
      // Network failure: keep the refresh token, the session may recover.
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

// --- Fetch ------------------------------------------------------------------ //

export interface ApiFetchOptions extends RequestInit {
  /** Attach the bearer token (default true). Use false for auth endpoints. */
  auth?: boolean;
  /** Allow the one-shot refresh-and-retry on 401 (default true). */
  retryOn401?: boolean;
}

export async function apiFetch<T>(path: string, init: ApiFetchOptions = {}): Promise<T> {
  const {auth = true, retryOn401 = true, ...requestInit} = init;
  const hasBody = requestInit.body !== undefined && requestInit.body !== null;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    // FormData must keep the browser-generated multipart boundary.
    ...(hasBody && !(requestInit.body instanceof FormData)
      ? {'Content-Type': 'application/json'}
      : {}),
    ...((requestInit.headers as Record<string, string> | undefined) ?? {}),
  };

  const token = auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {...requestInit, headers});
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  }

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, {...init, retryOn401: false});
    clearSession();
    onAuthFailure?.();
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw new ApiError(`API ${res.status} on ${path}`, res.status, body, retryAfter);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Loose UUID check — ids that are not backend UUIDs must never hit the API. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
