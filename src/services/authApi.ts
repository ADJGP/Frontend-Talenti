// Authentication API (backend stage 1 — closed).
//
// Endpoints: GET  /api/v1/auth/me
//            POST /api/v1/auth/{register,login,refresh,logout,logout/refresh}.

import { ApiError, apiFetch } from './api';
import { clearSession, getAccessToken, getRefreshToken, setSession } from './tokenStorage';
import type { CurrentUserMeDto, RevokeDto, TokenPairDto } from './talentiTypes';

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
  /**
   * `GET /api/v1/auth/me` — current user + role slugs (backend S-03).
   *
   * Drives role-based navigation without decoding the JWT; the access token is
   * attached by `apiFetch` from the in-memory session.
   */
  async me(): Promise<CurrentUserMeDto> {
    return apiFetch<CurrentUserMeDto>('/api/v1/auth/me');
  },

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
   * S-17 is fixed in the backend: `POST /auth/logout` now accepts **both** the
   * access and the refresh token (`_revocation_attempt_configs` in
   * `src/api/v1/deps.py`, commit `3cb9ba0`), so the bearer we send revokes the
   * access token's `jti` too. We still also call `/auth/logout/refresh` with
   * the refresh token so the whole session is invalidated.
   *
   * `retryOn401: false` on the bearer call is deliberate: a failure here must
   * not go through the automatic refresh, which would rotate the pair and issue
   * a new refresh token that the captured value could no longer revoke.
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
