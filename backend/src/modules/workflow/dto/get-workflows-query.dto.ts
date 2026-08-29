import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { WorkflowStatus } from '@prisma/client';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  SORT_ORDERS,
  SortOrder,
} from '../../../common/constants/app.constants';

export const WORKFLOW_SORTABLE_FIELDS = ['code', 'name', 'status', 'createdAt', 'updatedAt'] as const;
export type WorkflowSortableField = (typeof WORKFLOW_SORTABLE_FIELDS)[number];

export class GetWorkflowsQueryDto {
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
  @IsEnum(WorkflowStatus, { message: 'status must be one of DRAFT, ACTIVE, ARCHIVED.' })
  status?: WorkflowStatus;

  @IsOptional()
  @IsIn(WORKFLOW_SORTABLE_FIELDS, { message: `sortBy must be one of ${WORKFLOW_SORTABLE_FIELDS.join(', ')}.` })
  sortBy: WorkflowSortableField = 'createdAt';

  @IsOptional()
  @IsIn(SORT_ORDERS, { message: `sortOrder must be one of ${SORT_ORDERS.join(', ')}.` })
  sortOrder: SortOrder = 'desc';
}
