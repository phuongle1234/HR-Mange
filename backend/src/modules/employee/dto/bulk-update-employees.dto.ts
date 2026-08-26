import { ArrayMaxSize, ArrayMinSize, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EmployeeStatus } from '@prisma/client';
import {
  EmployeeBulkFieldsAreUniqueInDatabase,
  EmployeeBulkOrganizationsExist,
  HasEmployeeBulkMutableField,
  HasUniqueEmployeeBulkCodes,
  HasUniqueEmployeeBulkEmails,
  HasUniqueEmployeeBulkIds,
} from '../validators/employee-bulk-dto.validator';

export class BulkUpdateEmployeeItemDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'employeeCode must not be empty.' })
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  employeeCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'firstName must not be empty.' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'lastName must not be empty.' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  position?: string | null;

  @IsOptional()
  @IsEnum(EmployeeStatus, { message: 'status must be one of ACTIVE, INACTIVE, ON_LEAVE, TERMINATED.' })
  status?: EmployeeStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organizationId?: number | null;
}

export class BulkUpdateEmployeesDto {
  @ArrayMinSize(1, { message: 'items must contain at least 1 employee.' })
  @ArrayMaxSize(100, { message: 'items must contain no more than 100 employees.' })
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateEmployeeItemDto)
  @HasUniqueEmployeeBulkIds()
  @HasUniqueEmployeeBulkCodes()
  @HasUniqueEmployeeBulkEmails()
  @HasEmployeeBulkMutableField()
  @EmployeeBulkFieldsAreUniqueInDatabase()
  @EmployeeBulkOrganizationsExist()
  items!: BulkUpdateEmployeeItemDto[];
}
