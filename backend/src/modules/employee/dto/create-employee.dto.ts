import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { EmployeeStatus } from '@prisma/client';
import { IsEmployeeCodeUnique, IsEmployeeEmailUnique } from '../validators/employee-unique.validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1, { message: 'employeeCode must not be empty.' })
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmployeeCodeUnique()
  employeeCode!: string;

  @IsString()
  @MinLength(1, { message: 'firstName must not be empty.' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'lastName must not be empty.' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @IsEmail({}, { message: 'email must be a valid email address.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmployeeEmailUnique()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  position?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus, { message: 'status must be one of ACTIVE, INACTIVE, ON_LEAVE, TERMINATED.' })
  status?: EmployeeStatus;
}
