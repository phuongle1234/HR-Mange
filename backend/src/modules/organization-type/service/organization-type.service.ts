import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganizationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditEntityType } from '../../../common/constants/audit-action.constant';
import {
  OrganizationTypeNameExistsException,
  OrganizationTypeNotFoundException,
} from '../../../common/exceptions/app.exception';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import { BaseService } from '../../../common/services/base.service';
import { GetOrganizationTypesQueryDto } from '../dto/get-organization-types-query.dto';
import { IOrganizationTypeService, OrganizationTypeCreateInput } from '../interfaces/organization-type-service.interface';

@Injectable()
export class OrganizationTypeService
  extends BaseService<PrismaService['organizationType'], GetOrganizationTypesQueryDto>
  implements IOrganizationTypeService
{
  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(
      prisma.organizationType,
      eventEmitter,
      AuditEntityType.ORGANIZATION_TYPE,
      (id) => new OrganizationTypeNotFoundException(id),
    );
  }

  async findMany(query: GetOrganizationTypesQueryDto = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }): Promise<PaginatedResult<OrganizationType>> {
    const where = this.buildWhere(query.search);

    const [items, total] = await Promise.all([
      this.entity.findMany({
        where,
        orderBy: { [query?.sortBy || 'createdAt']: query?.sortOrder || "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.entity.count({ where }),
    ]);

    return { items, total };
  }

  private buildWhere(search?: string): Prisma.OrganizationTypeWhereInput {
    return search
      ? {
          OR: [
            { name: { contains: search.trim(), mode: 'insensitive' } },
            { description: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }
      : {};
  }

}
