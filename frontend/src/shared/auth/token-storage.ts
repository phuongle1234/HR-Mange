/**
 * The ONLY module allowed to read/write the access token's browser storage
 * (per docs/07-frontend/providers/auth-provider.md). Pages, components, and
 * other modules must go through this module, never touch document.cookie
 * directly.
 *
 * Storage is a cookie rather than localStorage so the token expires on its
 * own instead of living until an explicit logout. The cookie's `expires` is
 * derived from the JWT's own `exp` claim, so the cookie and the token always
 * expire together - a hard-coded lifetime here would silently drift the day
 * the backend's JWT_ACCESS_EXPIRES_IN changes.
 *
 * The value is stored as-is (a JWT is already opaque-looking Base64url).
 * It is deliberately NOT encrypted: any key the frontend could decrypt with
 * would have to ship in the JS bundle, so encryption here would only be
 * obfuscation and would not stop an XSS attacker. Real protection against
 * script access requires an httpOnly cookie set by the backend, which is a
 * separate change to the auth flow (see Pending Decisions in
 * docs/07-frontend/providers/auth-provider.md).
 */
const ACCESS_TOKEN_KEY = 'employeeos.accessToken';

/**
 * Fallback lifetime used only when the token carries no usable `exp` claim.
 * Kept short so a token that cannot be inspected never outlives a plausible
 * session.
 */
const FALLBACK_MAX_AGE_SECONDS = 15 * 60;

/**
 * Reads the `exp` claim (seconds since epoch, per RFC 7519) without
 * verifying the signature - this is only used to decide a client-side
 * expiry, never to trust the token's contents. The backend remains the sole
 * authority on validity.
 */
function readTokenExpiry(token: string): Date | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    // JWT uses Base64url; atob needs standard Base64 with padding.
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(window.atob(padded)) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;

    const expiresAt = new Date(payload.exp * 1000);
    return expiresAt.getTime() > Date.now() ? expiresAt : null;
  } catch {
    return null;
  }
}

function buildCookieAttributes(expiresAt: Date): string {
  const attributes = [`Path=/`, `Expires=${expiresAt.toUTCString()}`, `SameSite=Strict`];
  // Secure would make the cookie unwritable over plain-HTTP local dev.
  if (window.location.protocol === 'https:') {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}

export function readStoredToken(): string | null {
  try {
    const prefix = `${encodeURIComponent(ACCESS_TOKEN_KEY)}=`;
    const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix));
    if (!entry) return null;

    const value = decodeURIComponent(entry.slice(prefix.length));
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredToken(token: string): void {
  try {
    const expiresAt = readTokenExpiry(token) ?? new Date(Date.now() + FALLBACK_MAX_AGE_SECONDS * 1000);
    document.cookie = `${encodeURIComponent(ACCESS_TOKEN_KEY)}=${encodeURIComponent(token)}; ${buildCookieAttributes(expiresAt)}`;
  } catch {
    // Ignore storage errors (e.g. cookies disabled).
  }
}

export function clearStoredToken(): void {
  try {
    document.cookie = `${encodeURIComponent(ACCESS_TOKEN_KEY)}=; ${buildCookieAttributes(new Date(0))}`;
  } catch {
    // Ignore storage errors.
  }
}
