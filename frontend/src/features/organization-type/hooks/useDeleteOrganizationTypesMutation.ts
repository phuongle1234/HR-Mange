import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationTypeApiService } from '../services/organization-type.api';
import { organizationTypeQueryKeys } from '../utils/query-keys';
import type { DeleteOrganizationTypesPayload } from '../types/organization-type.types';

export function useDeleteOrganizationTypesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteOrganizationTypesPayload) => organizationTypeApiService.deleteMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationTypeQueryKeys.all });
    },
  });
}
