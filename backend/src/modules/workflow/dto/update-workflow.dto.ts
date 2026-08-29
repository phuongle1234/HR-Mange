import { Transform } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkflowStatus } from '@prisma/client';
import { IsValidWorkflowFormSchema } from '../validators/form-schema.validator';

/**
 * `code` is deliberately absent: it is the stable business key and immutable
 * after create (contract 5.1). Omitting the field is the enforcement - there
 * is nothing for a client to send.
 */
export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'name must not be empty.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsObject()
  @IsValidWorkflowFormSchema()
  formSchema?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(WorkflowStatus, { message: 'status must be one of DRAFT, ACTIVE, ARCHIVED.' })
  status?: WorkflowStatus;
}
