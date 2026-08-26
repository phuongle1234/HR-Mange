import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApiService } from '../services/organization.api';
import type { DeleteOrganizationsPayload } from '../types/organization.types';
import { organizationQueryKeys } from '../utils/query-keys';

export function useDeleteOrganizationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteOrganizationsPayload) => organizationApiService.deleteMany(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  });
}
