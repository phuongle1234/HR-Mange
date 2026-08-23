import { describe, expect, it } from 'vitest';
import { ApiEndpoints } from './api-endpoints';

describe('ApiEndpoints', () => {
  it('builds every auth path', () => {
    expect(ApiEndpoints.auth.login()).toBe('/api/auth/login');
    expect(ApiEndpoints.auth.me()).toBe('/api/auth/me');
    expect(ApiEndpoints.auth.logout()).toBe('/api/auth/logout');
    expect(ApiEndpoints.auth.changePassword()).toBe('/api/auth/change-password');
    expect(ApiEndpoints.auth.forgotPassword()).toBe('/api/auth/forgot-password');
  });

  it('builds every employee path, encoding dynamic ids', () => {
    expect(ApiEndpoints.employees.list()).toBe('/api/employees');
    expect(ApiEndpoints.employees.create()).toBe('/api/employees');
    expect(ApiEndpoints.employees.detail('abc-123')).toBe('/api/employees/abc-123');
    expect(ApiEndpoints.employees.update('abc-123')).toBe('/api/employees/abc-123');
    expect(ApiEndpoints.employees.delete('abc-123')).toBe('/api/employees/abc-123');
    expect(ApiEndpoints.employees.detail('a/b c')).toBe('/api/employees/a%2Fb%20c');
  });
});
