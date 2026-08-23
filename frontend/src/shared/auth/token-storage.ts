/**
 * The ONLY module allowed to read/write localStorage for the access token
 * (per docs/07-frontend/providers/auth-provider.md). Pages, components, and
 * other modules must go through this module, never touch localStorage directly.
 */
const ACCESS_TOKEN_KEY = 'employeeos.accessToken';

export function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeStoredToken(token: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors (e.g. private browsing mode, quota exceeded).
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore storage errors.
  }
}
