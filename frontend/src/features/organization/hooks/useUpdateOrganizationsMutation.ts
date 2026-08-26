import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApiService } from '../services/organization.api';
import type { UpdateOrganizationsPayload } from '../types/organization.types';
import { organizationQueryKeys } from '../utils/query-keys';

export function useUpdateOrganizationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationsPayload) => organizationApiService.updateMany(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  });
}
