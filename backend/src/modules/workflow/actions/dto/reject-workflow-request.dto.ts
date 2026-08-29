import { IsNotEmpty, IsString } from 'class-validator';
import { BaseWorkflowActionDto } from './base-workflow-action.dto';

export class RejectWorkflowRequestDto extends BaseWorkflowActionDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}
