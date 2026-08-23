import { describe, expect, it } from 'vitest';
import { employeeCreateSchema, employeeEditSchema } from './employee.schemas';

const validValues = {
  employeeCode: 'EMP-001',
  firstName: 'Mai',
  lastName: 'Nguyen',
  email: 'mai@example.com',
  phone: '0901234567',
  position: 'HR Lead',
  status: 'ACTIVE' as const,
};

describe('employeeCreateSchema', () => {
  it('accepts a fully valid payload', () => {
    expect(employeeCreateSchema.safeParse(validValues).success).toBe(true);
  });

  it('accepts optional phone/position as empty strings', () => {
    const result = employeeCreateSchema.safeParse({ ...validValues, phone: '', position: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing employeeCode', () => {
    expect(employeeCreateSchema.safeParse({ ...validValues, employeeCode: '' }).success).toBe(
      false,
    );
  });

  it('rejects a missing firstName', () => {
    expect(employeeCreateSchema.safeParse({ ...validValues, firstName: '' }).success).toBe(false);
  });

  it('rejects an invalid email format', () => {
    expect(employeeCreateSchema.safeParse({ ...validValues, email: 'not-an-email' }).success).toBe(
      false,
    );
  });

  it('rejects an employeeCode longer than 50 characters', () => {
    const result = employeeCreateSchema.safeParse({
      ...validValues,
      employeeCode: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a status outside the EmployeeStatus enum', () => {
    const result = employeeCreateSchema.safeParse({ ...validValues, status: 'ON_VACATION' });
    expect(result.success).toBe(false);
  });

  it('accepts every EmployeeStatus enum value (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)', () => {
    for (const status of ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']) {
      expect(employeeCreateSchema.safeParse({ ...validValues, status }).success).toBe(true);
    }
  });

  it('has no departmentId field (WORK-000 decision #1)', () => {
    expect('departmentId' in employeeCreateSchema.shape).toBe(false);
  });
});

describe('employeeEditSchema', () => {
  it('accepts the same fully valid payload as create', () => {
    expect(employeeEditSchema.safeParse(validValues).success).toBe(true);
  });

  it('rejects an invalid email when provided', () => {
    expect(employeeEditSchema.safeParse({ ...validValues, email: 'nope' }).success).toBe(false);
  });
});
