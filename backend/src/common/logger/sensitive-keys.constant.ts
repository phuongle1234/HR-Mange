/**
 * Field/key names that must never appear in log output, per AGENTS.md
 * ("Do not log passwords, JWTs, refresh tokens, secrets, API keys,
 * credentials...") and docs/02-solution/logging.md.
 */
export const SENSITIVE_LOG_KEYS = [
  'password',
  'currentPassword',
  'newPassword',
  'confirmNewPassword',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
  'secret',
  'apiKey',
];
