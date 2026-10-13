import { create } from 'zustand';
import { ApiError, setOnAuthFailure } from '../services/api';
import { authApi, type LoginPayload, type RegisterPayload } from '../services/authApi';
import { clearSession, getRefreshToken, hasSession } from '../services/tokenStorage';
import { decodeJwtPayload } from '../utils/jwt';
import type { AccessTokenClaims, TokenPairDto } from '../services/talentiTypes';
import type { SessionUser } from '../types';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
  /** Last auth error message (login/register), cleared on success. */
  error: string | null;
  isSubmitting: boolean;

  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Fallback session user built from the access token claims when `/auth/me`
 * cannot be reached (e.g. transient network failure). Carries no roles, so
 * role-gated navigation stays hidden until the next refresh succeeds.
 */
function userFromAccessToken(accessToken: string): SessionUser | null {
  const claims = decodeJwtPayload<AccessTokenClaims>(accessToken);
  if (!claims?.sub) return null;
  return {id: claims.sub, email: claims.email ?? '', fullName: null, roles: []};
}

/**
 * Resolve the session user through `GET /api/v1/auth/me` (backend S-03), which
 * exposes the role slugs the JWT does not carry. Falls back to the token claims
 * if the call fails, so a hiccup never blocks the login itself.
 */
async function resolveUser(tokens: TokenPairDto): Promise<SessionUser | null> {
  try {
    const me = await authApi.me();
    return {
      id: me.id,
      email: me.email,
      fullName: me.full_name,
      roles: Array.isArray(me.roles) ? me.roles : [],
    };
  } catch {
    return userFromAccessToken(tokens.access_token);
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'No se pudo contactar con el servidor.';
    if (err.status === 401) return 'Correo o contraseña incorrectos.';
    if (err.status === 409) return 'Ese correo ya está registrado.';
    if (err.status === 429) {
      return err.retryAfter
        ? `Demasiados intentos. Vuelve a intentarlo en ${err.retryAfter} s.`
        : 'Demasiados intentos. Inténtalo más tarde.';
    }
    return err.detail ?? 'Ocurrió un error inesperado.';
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,
  isSubmitting: false,

  /** Restore the session on boot: the access token lives in memory only, so a
   *  stored refresh token has to be exchanged for a fresh pair. */
  bootstrap: async () => {
    if (!hasSession() || !getRefreshToken()) {
      set({status: 'anonymous', user: null});
      return;
    }
    try {
      const tokens = await authApi.refresh();
      set({status: 'authenticated', user: await resolveUser(tokens)});
    } catch {
      clearSession();
      set({status: 'anonymous', user: null});
    }
  },

  login: async (payload) => {
    set({isSubmitting: true, error: null});
    try {
      const tokens = await authApi.login(payload);
      set({
        status: 'authenticated',
        user: await resolveUser(tokens),
        isSubmitting: false,
      });
      return true;
    } catch (err) {
      set({error: errorMessage(err), isSubmitting: false});
      return false;
    }
  },

  register: async (payload) => {
    set({isSubmitting: true, error: null});
    try {
      const tokens = await authApi.register(payload);
      set({
        status: 'authenticated',
        user: await resolveUser(tokens),
        isSubmitting: false,
      });
      return true;
    } catch (err) {
      set({error: errorMessage(err), isSubmitting: false});
      return false;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({status: 'anonymous', user: null, error: null});
  },

  clearError: () => set({error: null}),
}));

// The HTTP client calls this when a session is definitively lost (refresh failed).
setOnAuthFailure(() => {
  useAuthStore.setState({status: 'anonymous', user: null});
});
