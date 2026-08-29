import { IsObject } from 'class-validator';
import { BaseWorkflowActionDto } from './base-workflow-action.dto';

export class ResubmitWorkflowRequestDto extends BaseWorkflowActionDto {
  @IsObject()
  formData: Record<string, unknown>;
}
