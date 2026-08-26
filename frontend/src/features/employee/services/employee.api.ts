import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type {
  BulkCreateEmployeesPayload,
  BulkDeleteEmployeesPayload,
  BulkUpdateEmployeesPayload,
  CreateEmployeePayload,
  Employee,
  EmployeeListMeta,
  EmployeeListQueryState,
  GetEmployeesByIdsPayload,
  UpdateEmployeePayload,
} from '../types/employee.types';

export interface EmployeeListResult {
  items: Employee[];
  meta: EmployeeListMeta;
}

function buildListParams(query: EmployeeListQueryState): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: query.limit,
  };

  if (query.search) {
    params.search = query.search;
  }
  if (query.status) {
    params.status = query.status;
  }
  if (query.sortBy) {
    params.sortBy = query.sortBy;
  }
  if (query.sortOrder) {
    params.sortOrder = query.sortOrder;
  }

  return params;
}

/**
 * Employee API service. Pages call query/mutation hooks, hooks call this
 * service — components never call Axios or hard-code `/api/employees`.
 */
export const employeeApiService = {
  async list(query: EmployeeListQueryState): Promise<EmployeeListResult> {
    const envelope = await baseApiService.getWithEnvelope<Employee[]>(
      ApiEndpoints.employees.list(),
      { params: buildListParams(query) },
    );

    return {
      items: envelope.data,
      meta: envelope.meta ?? { page: query.page, limit: query.limit, total: envelope.data.length },
    };
  },
  detail(id: string): Promise<Employee> {
    return baseApiService.get<Employee>(ApiEndpoints.employees.detail(id));
  },
  create(payload: CreateEmployeePayload): Promise<Employee> {
    return baseApiService.post<Employee>(ApiEndpoints.employees.create(), payload);
  },
  update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    return baseApiService.put<Employee>(ApiEndpoints.employees.update(id), payload);
  },
  delete(id: string): Promise<null> {
    return baseApiService.delete<null>(ApiEndpoints.employees.delete(id));
  },
  findByIds(payload: GetEmployeesByIdsPayload): Promise<Employee[]> {
    return baseApiService.post<Employee[]>(ApiEndpoints.employees.byIds(), payload);
  },
  bulkCreate(payload: BulkCreateEmployeesPayload): Promise<Employee[]> {
    return baseApiService.post<Employee[]>(ApiEndpoints.employees.bulkCreate(), payload);
  },
  bulkUpdate(payload: BulkUpdateEmployeesPayload): Promise<Employee[]> {
    return baseApiService.patch<Employee[]>(ApiEndpoints.employees.bulkUpdate(), payload);
  },
  bulkDelete(payload: BulkDeleteEmployeesPayload): Promise<{ deletedCount: number }> {
    return baseApiService.delete<{ deletedCount: number }>(ApiEndpoints.employees.bulkDelete(), { data: payload });
  },
};
