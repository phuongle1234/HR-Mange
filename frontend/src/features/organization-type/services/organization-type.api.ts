import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type {
  CreateOrganizationTypesPayload,
  DeleteOrganizationTypesPayload,
  GetOrganizationTypesByIdsPayload,
  OrganizationType,
  OrganizationTypeListMeta,
  OrganizationTypeListQueryState,
  UpdateOrganizationTypesPayload,
} from '../types/organization-type.types';

export interface OrganizationTypeListResult {
  items: OrganizationType[];
  meta: OrganizationTypeListMeta;
}

function buildListParams(query: OrganizationTypeListQueryState): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };

  if (query.search) {
    params.search = query.search;
  }

  return params;
}

export const organizationTypeApiService = {
  async list(query: OrganizationTypeListQueryState): Promise<OrganizationTypeListResult> {
    const envelope = await baseApiService.getWithEnvelope<OrganizationType[]>(ApiEndpoints.organizationTypes.list(), { params: buildListParams(query) });
    return {
      items: envelope.data,
      meta: envelope.meta ?? { page: query.page, limit: query.limit, total: envelope.data.length },
    };
  },
  findByIds(payload: GetOrganizationTypesByIdsPayload): Promise<OrganizationType[]> {
    return baseApiService.post<OrganizationType[]>(ApiEndpoints.organizationTypes.byIds(), payload);
  },
  createMany(payload: CreateOrganizationTypesPayload): Promise<OrganizationType[]> {
    return baseApiService.post<OrganizationType[]>(ApiEndpoints.organizationTypes.createMany(), payload);
  },
  updateMany(payload: UpdateOrganizationTypesPayload): Promise<OrganizationType[]> {
    return baseApiService.patch<OrganizationType[]>(ApiEndpoints.organizationTypes.updateMany(), payload);
  },
  deleteMany(payload: DeleteOrganizationTypesPayload): Promise<{ deletedCount: number }> {
    return baseApiService.delete<{ deletedCount: number }>(ApiEndpoints.organizationTypes.deleteMany(), { data: payload });
  },
};
