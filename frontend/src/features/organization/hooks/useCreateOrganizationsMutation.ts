import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApiService } from '../services/organization.api';
import type { CreateOrganizationsPayload } from '../types/organization.types';
import { organizationQueryKeys } from '../utils/query-keys';

export function useCreateOrganizationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrganizationsPayload) => organizationApiService.createMany(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  });
}
