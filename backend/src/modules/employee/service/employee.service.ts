import { Injectable } from '@nestjs/common';
import { Employee, EmployeeStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import { AuditEntityType } from '../../../common/constants/audit-action.constant';
import { IEmployeeService } from '../interfaces/employee-service.interface';
import { GetEmployeesQueryDto } from '../dto/get-employees-query.dto';
import { EmployeeNotFoundException } from '../../../common/exceptions/app.exception';

/**
 * create/createMany/findOne/update/updateMany/delete/deleteMany are not
 * redeclared here - they are fully inherited from BaseService (see
 * common/services/base.service.ts), which derives every Prisma type it
 * needs from the `PrismaService['employee']` delegate alone. Only findMany
 * is overridden, since Employee's search/filter fields are specific to this
 * entity and have no generic equivalent in BaseService.
 */
@Injectable()
export class EmployeeService
  extends BaseService<PrismaService['employee'], GetEmployeesQueryDto>
  implements IEmployeeService
{
  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma.employee, eventEmitter, AuditEntityType.EMPLOYEE, (id) => new EmployeeNotFoundException(id));
  }

  async findMany(query: GetEmployeesQueryDto): Promise<PaginatedResult<Employee>> {
    const where = this.buildWhere(query.search, query.status);

    const [items, total] = await Promise.all([
      this.entity.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.entity.count({ where }),
    ]);

    return { items, total };
  }

  private buildWhere(search: string | undefined, status: EmployeeStatus | undefined): Prisma.EmployeeWhereInput {
    return {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { employeeCode: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }
}
