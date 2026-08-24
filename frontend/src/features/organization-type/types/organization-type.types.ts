export interface OrganizationType {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}

export interface OrganizationTypeListQueryState {
  page: number;
  limit: number;
  search: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface OrganizationTypeListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface OrganizationTypeCreateItem {
  name: string;
  description?: string | null;
}

export interface CreateOrganizationTypesPayload {
  items: OrganizationTypeCreateItem[];
}

export interface GetOrganizationTypesByIdsPayload {
  ids: string[];
}

export interface OrganizationTypeUpdateItem {
  id: string;
  name?: string;
  description?: string | null;
}

export interface UpdateOrganizationTypesPayload {
  items: OrganizationTypeUpdateItem[];
}

export interface DeleteOrganizationTypesPayload {
  ids: string[];
}
