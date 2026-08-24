import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrganizationChartType } from '@prisma/client';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'code must not be empty.' })
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'name must not be empty.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsEnum(OrganizationChartType, { message: 'type must be one of COMPANY, BRANCH, DIVISION, DEPARTMENT, TEAM.' })
  type?: OrganizationChartType;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
