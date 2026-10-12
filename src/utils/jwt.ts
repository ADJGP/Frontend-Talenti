/**
 * Decode a JWT payload without verifying the signature.
 *
 * The SPA only reads non-sensitive display claims (`sub`, `email`) to build the
 * session. Authorization is always decided by the backend, and the token is
 * still validated server-side on every request. Role detection needs a real
 * `GET /auth/me` (see sugerencias.md S-03); until then only these claims are used.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const json = decodeURIComponent(
      binary
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
