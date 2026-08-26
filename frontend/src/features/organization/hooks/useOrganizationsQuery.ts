import { useQuery } from '@tanstack/react-query';
import { organizationApiService } from '../services/organization.api';
import type { OrganizationListQuery } from '../types/organization.types';
import { organizationQueryKeys } from '../utils/query-keys';

export function useOrganizationsQuery(query?: OrganizationListQuery) {
  return useQuery({
    queryKey: organizationQueryKeys.list(query),
    queryFn: () => organizationApiService.list(query),
  });
}
