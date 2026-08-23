import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EmployeeStatus } from '@prisma/client';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  EMPLOYEE_SORTABLE_FIELDS,
  EmployeeSortableField,
  MAX_PAGE_LIMIT,
  SORT_ORDERS,
  SortOrder,
} from '../../../common/constants/app.constants';

export class GetEmployeesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = DEFAULT_PAGE_LIMIT;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus, { message: 'status must be one of ACTIVE, INACTIVE, ON_LEAVE, TERMINATED.' })
  status?: EmployeeStatus;

  @IsOptional()
  @IsIn(EMPLOYEE_SORTABLE_FIELDS, {
    message: `sortBy must be one of ${EMPLOYEE_SORTABLE_FIELDS.join(', ')}.`,
  })
  sortBy: EmployeeSortableField = 'createdAt';

  @IsOptional()
  @IsIn(SORT_ORDERS, { message: `sortOrder must be one of ${SORT_ORDERS.join(', ')}.` })
  sortOrder: SortOrder = 'desc';
}
