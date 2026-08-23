import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApiService } from '../services/employee.api';
import { employeeQueryKeys } from '../utils/query-keys';

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeApiService.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.removeQueries({ queryKey: employeeQueryKeys.detail(id) });
    },
  });
}
