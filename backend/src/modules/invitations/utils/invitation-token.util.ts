import { createHash, randomBytes } from 'crypto';

/**
 * Cryptographically secure token generation (never Math.random(), per
 * DB-INVITATION). The raw token is only ever returned to the caller to
 * build the invitation URL for the email - it is never persisted; only
 * `hashInvitationToken(raw)` is stored, and the same hash function is used
 * again at accept time to look the row up.
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
