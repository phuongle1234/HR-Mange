import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApiService } from '../services/employee.api';
import { employeeQueryKeys } from '../utils/query-keys';
import type { CreateEmployeePayload } from '../types/employee.types';

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeeApiService.create(payload),
    onSuccess: (createdEmployee) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.setQueryData(employeeQueryKeys.detail(createdEmployee.id), createdEmployee);
    },
  });
}
