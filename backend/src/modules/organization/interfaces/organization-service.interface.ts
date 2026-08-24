import { Organization } from '@prisma/client';
import { IBaseService } from '../../../common/interfaces/base.interface';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { OrganizationFilterDto } from '../dto/organization-filter.dto';

export interface IOrganizationService
  extends IBaseService<Organization, CreateOrganizationDto, UpdateOrganizationDto, OrganizationFilterDto> {}
