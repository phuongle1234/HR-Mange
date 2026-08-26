import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrganizationChartType } from '@prisma/client';
import { OrganizationTypeReferenceExists } from '../validators/organization-type-reference.validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1, { message: 'code must not be empty.' })
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code!: string;

  @IsString()
  @MinLength(1, { message: 'name must not be empty.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

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
  @IsUUID()
  @OrganizationTypeReferenceExists()
  organizationTypeId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
