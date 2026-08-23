import { describe, expect, it } from 'vitest';
import { employeeQueryKeys } from './query-keys';
import type { EmployeeListQueryState } from '../types/employee.types';

describe('employeeQueryKeys', () => {
  it('builds a stable, serializable list key from the query state', () => {
    const queryState: EmployeeListQueryState = {
      page: 1,
      limit: 10,
      search: 'mai',
      status: 'ACTIVE',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    expect(employeeQueryKeys.list(queryState)).toEqual(['employees', queryState]);
  });

  it('builds a detail key from the id', () => {
    expect(employeeQueryKeys.detail('abc-123')).toEqual(['employees', 'abc-123']);
  });

  it('the "all" key is a prefix of both list and detail keys, so invalidating it matches both', () => {
    const listKey = employeeQueryKeys.list({
      page: 1,
      limit: 10,
      search: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    const detailKey = employeeQueryKeys.detail('abc-123');

    expect(listKey[0]).toBe(employeeQueryKeys.all[0]);
    expect(detailKey[0]).toBe(employeeQueryKeys.all[0]);
  });
});
