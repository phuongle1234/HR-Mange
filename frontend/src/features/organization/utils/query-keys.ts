import type { OrganizationListQuery } from '../types/organization.types';

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  list: (query?: OrganizationListQuery) => ['organizations', query ?? {}] as const,
};
