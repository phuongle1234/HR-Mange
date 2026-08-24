import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationTypeApiService } from '../services/organization-type.api';
import { organizationTypeQueryKeys } from '../utils/query-keys';
import type { CreateOrganizationTypesPayload } from '../types/organization-type.types';

export function useCreateOrganizationTypesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrganizationTypesPayload) => organizationTypeApiService.createMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationTypeQueryKeys.all });
    },
  });
}
