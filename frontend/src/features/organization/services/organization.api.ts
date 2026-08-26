import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type { CreateOrganizationsPayload, DeleteOrganizationsPayload, OrganizationApiItem, OrganizationListQuery, UpdateOrganizationsPayload } from '../types/organization.types';

function buildListParams(query?: OrganizationListQuery): Record<string, string | number | boolean> {
  return {
    ...(query?.parentId !== undefined ? { parentId: query.parentId } : {}),
    ...(query?.type ? { type: query.type } : {}),
    ...(query?.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query?.organizationTypeId ? { organizationTypeId: query.organizationTypeId } : {}),
  };
}

export const organizationApiService = {
  list(query?: OrganizationListQuery): Promise<OrganizationApiItem[]> {
    return baseApiService.get<OrganizationApiItem[]>(ApiEndpoints.organizations.list(), { params: buildListParams(query) });
  },
  createMany(payload: CreateOrganizationsPayload): Promise<OrganizationApiItem[]> {
    return baseApiService.post<OrganizationApiItem[]>(ApiEndpoints.organizations.createMany(), payload);
  },
  updateMany(payload: UpdateOrganizationsPayload): Promise<OrganizationApiItem[]> {
    return baseApiService.patch<OrganizationApiItem[]>(ApiEndpoints.organizations.updateMany(), payload);
  },
  deleteMany(payload: DeleteOrganizationsPayload): Promise<{ deletedCount: number }> {
    return baseApiService.delete<{ deletedCount: number }>(ApiEndpoints.organizations.deleteMany(), { data: payload });
  },
};
