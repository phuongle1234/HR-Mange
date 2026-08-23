import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../providers/useAuth';
import { employeeApiService } from '../services/employee.api';
import { employeeQueryKeys } from '../utils/query-keys';
import type { EmployeeListQueryState } from '../types/employee.types';

export function useEmployeesQuery(queryState: EmployeeListQueryState) {
  const { authStatus } = useAuth();

  return useQuery({
    queryKey: employeeQueryKeys.list(queryState),
    queryFn: () => employeeApiService.list(queryState),
    enabled: authStatus === 'authenticated',
  });
}
