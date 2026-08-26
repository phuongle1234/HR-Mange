import { Injectable } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import { AuditEntityType } from '../../../common/constants/audit-action.constant';
import { OrganizationNotFoundException } from '../../../common/exceptions/app.exception';
import { IOrganizationService } from '../interfaces/organization-service.interface';
import { OrganizationFilterDto } from '../dto/organization-filter.dto';

/**
 * create/createMany/findOne/update/updateMany/delete/deleteMany are not
 * redeclared here - they are fully inherited from BaseService. Only
 * findMany is overridden, since Organization's filter fields are specific
 * to this entity. The single-record methods (create/findOne/update/delete)
 * exist on this service (required by IBaseService) but have no controller
 * route in this module - only the bulk + list operations are exposed.
 */
@Injectable()
export class OrganizationService
  extends BaseService<PrismaService['organization'], OrganizationFilterDto>
  implements IOrganizationService
{
  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma.organization, eventEmitter, AuditEntityType.ORGANIZATION, (id) => new OrganizationNotFoundException(id));
  }

  async findMany(query?: OrganizationFilterDto): Promise<PaginatedResult<Organization>> {
    const where = this.buildWhere(query);
    const items = await this.entity.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return { items, total: items.length };
  }

  private buildWhere(query?: OrganizationFilterDto): Prisma.OrganizationWhereInput {
    return {
      ...(query?.parentId !== undefined ? { parentId: query.parentId } : {}),
      ...(query?.type ? { type: query.type } : {}),
      ...(query?.organizationTypeId ? { organizationTypeId: query.organizationTypeId } : {}),
      ...(query?.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
  }
}
