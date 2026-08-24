import { useQuery } from '@tanstack/react-query';
import { organizationTypeApiService } from '../services/organization-type.api';
import { organizationTypeQueryKeys } from '../utils/query-keys';
import type { OrganizationTypeListQueryState } from '../types/organization-type.types';

export function useOrganizationTypesQuery(query: OrganizationTypeListQueryState) {
  return useQuery({
    queryKey: organizationTypeQueryKeys.list(query),
    queryFn: () => organizationTypeApiService.list(query),
  });
}
