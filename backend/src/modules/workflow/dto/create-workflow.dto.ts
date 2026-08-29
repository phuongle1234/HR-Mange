import { Transform } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkflowStatus } from '@prisma/client';
import { IsValidWorkflowFormSchema } from '../validators/form-schema.validator';

export class CreateWorkflowDto {
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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsObject()
  @IsValidWorkflowFormSchema()
  formSchema!: Record<string, unknown>;

  @IsOptional()
  @IsEnum(WorkflowStatus, { message: 'status must be one of DRAFT, ACTIVE, ARCHIVED.' })
  status?: WorkflowStatus;
}
