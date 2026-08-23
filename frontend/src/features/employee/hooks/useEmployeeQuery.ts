import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../providers/useAuth';
import { employeeApiService } from '../services/employee.api';
import { employeeQueryKeys } from '../utils/query-keys';
import { isValidEmployeeId } from '../utils/validate-employee-id';

export function useEmployeeQuery(id: string | undefined) {
  const { authStatus } = useAuth();
  const hasValidId = isValidEmployeeId(id);

  return useQuery({
    queryKey: employeeQueryKeys.detail(id ?? ''),
    queryFn: () => employeeApiService.detail(id as string),
    enabled: authStatus === 'authenticated' && hasValidId,
  });
}
