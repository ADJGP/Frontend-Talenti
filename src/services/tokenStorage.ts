// Token persistence for the Talenti SPA (backend stage 1 — auth service).
//
// The access token is short-lived (15 min) and stays **in memory only**, so it
// never touches disk where an XSS payload could read it. The refresh token is
// the long-lived credential and the backend currently returns it in the
// response body (see sugerencias.md S-07), so it is persisted to localStorage
// until the API offers an HttpOnly cookie.

const REFRESH_TOKEN_KEY = 'talenti_refresh_token';

let accessToken: string | null = null;

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSession(tokens: TokenPair): void {
  accessToken = tokens.access_token;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  } catch {
    // Storage disabled (private mode): the session lives for this tab only.
  }
}

export function clearSession(): void {
  accessToken = null;
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** True when a refresh token is still around (the access token may be gone). */
export function hasSession(): boolean {
  return accessToken !== null || getRefreshToken() !== null;
}
