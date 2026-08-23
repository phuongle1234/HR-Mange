import { describe, expect, it } from 'vitest';
import { changePasswordSchema, forgotPasswordSchema, loginSchema } from './auth.schemas';

describe('loginSchema', () => {
  it('accepts a valid email/password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(
      true,
    );
  });

  it('rejects an invalid email format', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(
      false,
    );
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(
      false,
    );
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  const base = {
    currentPassword: 'oldpass1',
    newPassword: 'NewPass1',
    confirmNewPassword: 'NewPass1',
  };

  it('accepts a valid payload', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it('rejects when confirmation does not match', () => {
    const result = changePasswordSchema.safeParse({ ...base, confirmNewPassword: 'Different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('confirmNewPassword');
    }
  });

  it('rejects a new password shorter than 8 characters (WORK-000 decision #6)', () => {
    const result = changePasswordSchema.safeParse({
      ...base,
      newPassword: 'Ab1',
      confirmNewPassword: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a new password without a number', () => {
    const result = changePasswordSchema.safeParse({
      ...base,
      newPassword: 'NoNumbers',
      confirmNewPassword: 'NoNumbers',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a new password without a letter', () => {
    const result = changePasswordSchema.safeParse({
      ...base,
      newPassword: '12345678',
      confirmNewPassword: '12345678',
    });
    expect(result.success).toBe(false);
  });
});
