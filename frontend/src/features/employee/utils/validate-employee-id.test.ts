import { describe, expect, it } from 'vitest';
import { isValidEmployeeId } from './validate-employee-id';

describe('isValidEmployeeId', () => {
  it('accepts a well-formed UUID', () => {
    expect(isValidEmployeeId('3fa85f64-5717-4562-b3fc-2c963f66afa6')).toBe(true);
  });

  it('rejects undefined', () => {
    expect(isValidEmployeeId(undefined)).toBe(false);
  });

  it('rejects a non-UUID string', () => {
    expect(isValidEmployeeId('not-a-uuid')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmployeeId('')).toBe(false);
  });
});
