import { Organization } from '@prisma/client';
import { IBaseService } from '../../../common/interfaces/base.interface';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { OrganizationFilterDto } from '../dto/organization-filter.dto';

/**
 * createMany/updateMany/deleteMany are not on the shared IBaseService yet
 * (see AGENTS.md Backend Rules - extend additively per real feature rather
 * than growing the shared interface speculatively), so this module declares
 * them itself. OrganizationService does not redeclare any of them though -
 * BaseService's generic implementations already satisfy these signatures.
 */
export interface IOrganizationService
  extends IBaseService<Organization, CreateOrganizationDto, UpdateOrganizationDto, OrganizationFilterDto> {
  createMany(dtos: CreateOrganizationDto[], actorUserId?: string): Promise<Organization[]>;
  updateMany(
    args: { where: OrganizationFilterDto; data: UpdateOrganizationDto },
    actorUserId?: string,
  ): Promise<Organization[]>;
  deleteMany(args: { where: OrganizationFilterDto }, actorUserId?: string): Promise<void>;
}
