import { describe, expect, it } from 'vitest';
import { buildCreateEmployeePayload, buildUpdateEmployeePayload } from './build-employee-payload';
import type { EmployeeCreateFormValues, EmployeeEditFormValues } from '../schemas/employee.schemas';

describe('buildCreateEmployeePayload', () => {
  it('trims fields and lowercases the email', () => {
    const values: EmployeeCreateFormValues = {
      employeeCode: '  EMP-001  ',
      firstName: '  Mai ',
      lastName: ' Nguyen ',
      email: '  Mai@Example.com ',
      phone: '  0901234567 ',
      position: ' HR Lead ',
      status: 'ACTIVE',
    };

    expect(buildCreateEmployeePayload(values)).toEqual({
      employeeCode: 'EMP-001',
      firstName: 'Mai',
      lastName: 'Nguyen',
      email: 'mai@example.com',
      phone: '0901234567',
      position: 'HR Lead',
      status: 'ACTIVE',
    });
  });

  it('omits optional fields when left blank instead of sending empty strings', () => {
    const values: EmployeeCreateFormValues = {
      employeeCode: 'EMP-002',
      firstName: 'An',
      lastName: 'Tran',
      email: 'an@example.com',
      phone: '',
      position: '',
      status: 'ACTIVE',
    };

    const payload = buildCreateEmployeePayload(values);
    expect(payload.phone).toBeUndefined();
    expect(payload.position).toBeUndefined();
  });
});

describe('buildUpdateEmployeePayload', () => {
  const values: EmployeeEditFormValues = {
    employeeCode: 'EMP-001',
    firstName: 'Mai',
    lastName: 'Nguyen',
    email: 'mai.updated@example.com',
    phone: '0901234567',
    position: 'HR Lead',
    status: 'ACTIVE',
  };

  it('includes only fields React Hook Form marked dirty', () => {
    const payload = buildUpdateEmployeePayload(values, { email: true });
    expect(payload).toEqual({ email: 'mai.updated@example.com' });
  });

  it('returns an empty payload when nothing is dirty', () => {
    const payload = buildUpdateEmployeePayload(values, {});
    expect(payload).toEqual({});
  });

  it('includes every dirty field, normalized', () => {
    const payload = buildUpdateEmployeePayload(values, {
      email: true,
      firstName: true,
      status: true,
    });
    expect(payload).toEqual({
      email: 'mai.updated@example.com',
      firstName: 'Mai',
      status: 'ACTIVE',
    });
  });
});
