import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrganizationChartType } from '@prisma/client';

/**
 * Shared filter shape: used as GET /organizations query params, and as the
 * `where` field of the updateMany/deleteMany request bodies below.
 */
export class OrganizationFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsEnum(OrganizationChartType, { message: 'type must be one of COMPANY, BRANCH, DIVISION, DEPARTMENT, TEAM.' })
  type?: OrganizationChartType;

  @IsOptional()
  @IsUUID()
  organizationTypeId?: string;

  @IsOptional()
  // Query params arrive as strings - `@Type(() => Boolean)` would use the
  // `Boolean` constructor, and `Boolean('false')` is `true` (any non-empty
  // string is truthy). Map the two textual values explicitly instead.
  @Transform(({ value }) => (typeof value === 'string' ? value === 'true' : value))
  @IsBoolean()
  isActive?: boolean;
}
