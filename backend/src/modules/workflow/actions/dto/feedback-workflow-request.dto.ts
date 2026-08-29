import { IsNotEmpty, IsString } from 'class-validator';
import { BaseWorkflowActionDto } from './base-workflow-action.dto';

export class FeedbackWorkflowRequestDto extends BaseWorkflowActionDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}
