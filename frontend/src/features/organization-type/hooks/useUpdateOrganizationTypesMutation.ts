import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationTypeApiService } from '../services/organization-type.api';
import { organizationTypeQueryKeys } from '../utils/query-keys';
import type { UpdateOrganizationTypesPayload } from '../types/organization-type.types';

export function useUpdateOrganizationTypesMutation(ids: string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationTypesPayload) => organizationTypeApiService.updateMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationTypeQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationTypeQueryKeys.byIds(ids) });
    },
  });
}
