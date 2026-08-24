import { OrganizationType, Prisma } from '@prisma/client';
import { IBaseService, PaginatedResult } from '../../../common/interfaces/base.interface';
import { GetOrganizationTypesQueryDto } from '../dto/get-organization-types-query.dto';

export type OrganizationTypeCreateInput = {
  name: string;
  description?: string | null;
  createdByUserId?: string;
  updatedByUserId?: string;
};

export type OrganizationTypeUpdateInput = {
  id: string;
  data: Prisma.OrganizationTypeUpdateInput;
};

export interface IOrganizationTypeService
  extends IBaseService<OrganizationType, OrganizationTypeCreateInput, Prisma.OrganizationTypeUpdateInput, GetOrganizationTypesQueryDto> {
  // createMany(dataArray: OrganizationTypeCreateInput[], actorUserId?: string): Promise<OrganizationType[]>;
  findMany(query?: GetOrganizationTypesQueryDto): Promise<PaginatedResult<OrganizationType>>;
  // bulkUpdate(items: OrganizationTypeUpdateInput[], actorUserId?: string): Promise<OrganizationType[]>;
  // deleteManyByIds(ids: string[], actorUserId?: string): Promise<number>;
}
