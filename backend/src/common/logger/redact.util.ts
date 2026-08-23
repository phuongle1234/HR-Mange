import { SENSITIVE_LOG_KEYS } from './sensitive-keys.constant';

const REDACTED = '[REDACTED]';

/**
 * Deep-clones a value and replaces any sensitive key's value with [REDACTED].
 * Used as a last-resort safety net; callers should still avoid passing
 * request bodies for auth endpoints into the logger in the first place.
 */
export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_LOG_KEYS.some(
        (sensitiveKey) => sensitiveKey.toLowerCase() === key.toLowerCase(),
      );
      result[key] = isSensitive ? REDACTED : redactSensitive(val);
    }
    return result;
  }

  return value;
}
