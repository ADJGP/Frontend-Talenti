// Authentication API (backend stage 1 — closed).
//
// Endpoints: POST /api/v1/auth/{register,login,refresh,logout,logout/refresh}.

import { ApiError, apiFetch } from './api';
import { clearSession, getAccessToken, getRefreshToken, setSession } from './tokenStorage';
import type { RevokeDto, TokenPairDto } from './talentiTypes';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<TokenPairDto> {
    const tokens = await apiFetch<TokenPairDto>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: false,
    });
    setSession(tokens);
    return tokens;
  },

  async login(payload: LoginPayload): Promise<TokenPairDto> {
    const tokens = await apiFetch<TokenPairDto>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: false,
    });
    setSession(tokens);
    return tokens;
  },

  /** Exchange the stored refresh token for a fresh pair (session restore). */
  async refresh(): Promise<TokenPairDto> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new ApiError('No refresh token stored', 401);
    const tokens = await apiFetch<TokenPairDto>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({refresh_token: refreshToken}),
      auth: false,
    });
    setSession(tokens);
    return tokens;
  },

  /**
   * Revoke the session server-side, then drop the local one.
   *
   * `POST /auth/logout` validates whatever it receives as a **refresh** token
   * (`_revoke_token` in `src/api/v1/deps.py`), so with a bearer access token it
   * always answers 401 and the access token's `jti` is never revoked
   * (see sugerencias.md S-17). Two things this method must therefore respect:
   *
   * 1. That 401 must **not** go through the automatic refresh: rotating the
   *    pair here would revoke the stored refresh token and issue a new one that
   *    `logout/refresh` (called with the captured value) can no longer revoke,
   *    leaving a live refresh token behind.
   * 2. The token that actually gets revoked is the refresh one, via
   *    `/auth/logout/refresh` with the body payload.
   */
  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    const calls: Array<Promise<unknown>> = [];

    if (getAccessToken()) {
      calls.push(
        apiFetch<RevokeDto>('/api/v1/auth/logout', {
          method: 'POST',
          retryOn401: false,
        }).catch(() => undefined)
      );
    }
    if (refreshToken) {
      calls.push(
        apiFetch<RevokeDto>('/api/v1/auth/logout/refresh', {
          method: 'POST',
          body: JSON.stringify({refresh_token: refreshToken}),
          auth: false,
        }).catch(() => undefined)
      );
    }

    await Promise.all(calls);
    clearSession();
  },
};
