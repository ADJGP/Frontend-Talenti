import { create } from 'zustand';
import { ApiError, setOnAuthFailure } from '../services/api';
import { authApi, type LoginPayload, type RegisterPayload } from '../services/authApi';
import { clearSession, getRefreshToken, hasSession } from '../services/tokenStorage';
import { decodeJwtPayload } from '../utils/jwt';
import type { AccessTokenClaims } from '../services/talentiTypes';
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

/** Build the session user from the access token claims (no backend /auth/me yet). */
function userFromAccessToken(accessToken: string): SessionUser | null {
  const claims = decodeJwtPayload<AccessTokenClaims>(accessToken);
  if (!claims?.sub) return null;
  return {id: claims.sub, email: claims.email ?? ''};
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
      set({status: 'authenticated', user: userFromAccessToken(tokens.access_token)});
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
        user: userFromAccessToken(tokens.access_token),
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
        user: userFromAccessToken(tokens.access_token),
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
