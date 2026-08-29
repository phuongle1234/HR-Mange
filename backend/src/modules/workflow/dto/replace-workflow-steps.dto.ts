import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { MAX_CHAIN_LENGTH } from '../utils/workflow-step-chain.util';

/**
 * The client sends the whole ordered chain, root first, and NEVER sends
 * `parentId` - the server derives it from array position (contract 5.4).
 * That is what makes a branching chain unrepresentable through the API and
 * keeps the linked-list invariant true by construction.
 */
export class ReplaceWorkflowStepItemDto {
  @IsString()
  @MinLength(1, { message: 'name must not be empty.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsUUID(undefined, { message: 'organizationTypeId must be a UUID.' })
  organizationTypeId!: string;
}

export class ReplaceWorkflowStepsDto {
  @ArrayMinSize(1, { message: 'steps must contain at least 1 step.' })
  @ArrayMaxSize(MAX_CHAIN_LENGTH, { message: `steps must contain no more than ${MAX_CHAIN_LENGTH} steps.` })
  @ValidateNested({ each: true })
  @Type(() => ReplaceWorkflowStepItemDto)
  steps!: ReplaceWorkflowStepItemDto[];
}
