import type { OrganizationTypeListQueryState } from '../types/organization-type.types';

export const organizationTypeQueryKeys = {
  all: ['organization-types'] as const,
  list: (query: OrganizationTypeListQueryState) => ['organization-types', query] as const,
  byIds: (ids: string[]) => ['organization-types', 'by-ids', ids] as const,
};
