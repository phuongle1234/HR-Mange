import { describe, expect, it } from 'vitest';
import { buildChangedFieldsReview, mapEmployeeToFormValues } from './employee-form-mapping';
import type { Employee } from '../types/employee.types';

const employee: Employee = {
  id: 'emp-1',
  employeeCode: 'EMP-001',
  firstName: 'Mai',
  lastName: 'Nguyen',
  email: 'mai@example.com',
  phone: null,
  position: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('mapEmployeeToFormValues', () => {
  it('maps null phone/position to empty strings for the form', () => {
    expect(mapEmployeeToFormValues(employee)).toEqual({
      employeeCode: 'EMP-001',
      firstName: 'Mai',
      lastName: 'Nguyen',
      email: 'mai@example.com',
      phone: '',
      position: '',
      status: 'ACTIVE',
    });
  });
});

describe('buildChangedFieldsReview', () => {
  it('builds a previous -> next row for the one changed field (matches the edit preview)', () => {
    const review = buildChangedFieldsReview({ email: 'mai.updated@example.com' }, employee);
    expect(review).toEqual([
      {
        field: 'email',
        label: 'Email',
        previousValue: 'mai@example.com',
        nextValue: 'mai.updated@example.com',
      },
    ]);
  });

  it('builds a row per changed field when multiple fields change', () => {
    const review = buildChangedFieldsReview(
      { email: 'mai.updated@example.com', position: 'Senior HR Lead' },
      employee,
    );
    expect(review).toHaveLength(2);
    expect(review.map((row) => row.field)).toEqual(['email', 'position']);
  });

  it('renders an em-dash placeholder for empty previous values', () => {
    const review = buildChangedFieldsReview({ position: 'Recruiter' }, employee);
    expect(review[0].previousValue).toBe('—');
    expect(review[0].nextValue).toBe('Recruiter');
  });
});
