import { useQuery } from '@tanstack/react-query';
import { organizationTypeApiService } from '../services/organization-type.api';
import { organizationTypeQueryKeys } from '../utils/query-keys';

export function useOrganizationTypesByIdsQuery(ids: string[]) {
  return useQuery({
    queryKey: organizationTypeQueryKeys.byIds(ids),
    queryFn: () => organizationTypeApiService.findByIds({ ids }),
    enabled: ids.length > 0,
  });
}
