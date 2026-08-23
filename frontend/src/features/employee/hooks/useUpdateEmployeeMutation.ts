import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApiService } from '../services/employee.api';
import { employeeQueryKeys } from '../utils/query-keys';
import type { UpdateEmployeePayload } from '../types/employee.types';

interface UpdateEmployeeVariables {
  id: string;
  payload: UpdateEmployeePayload;
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateEmployeeVariables) =>
      employeeApiService.update(id, payload),
    onSuccess: (updatedEmployee, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.setQueryData(employeeQueryKeys.detail(variables.id), updatedEmployee);
    },
  });
}
