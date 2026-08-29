import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { WorkflowRequestStatus } from '@prisma/client';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../../../common/constants/app.constants';

export const WORKFLOW_REQUEST_SCOPES = ['mine', 'inbox'] as const;
export type WorkflowRequestScope = (typeof WORKFLOW_REQUEST_SCOPES)[number];

export class GetWorkflowRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = DEFAULT_PAGE_LIMIT;

  @IsOptional()
  @IsEnum(WorkflowRequestStatus, {
    message: 'status must be one of DRAFT, IN_PROGRESS, NEEDS_REVISION, APPROVED, REJECTED, CANCELLED.',
  })
  status?: WorkflowRequestStatus;

  @IsOptional()
  @IsUUID(undefined, { message: 'workflowId must be a UUID.' })
  workflowId?: string;

  /** `mine` = my own requests; `inbox` = awaiting my decision. No "all" scope exists. */
  @IsOptional()
  @IsIn(WORKFLOW_REQUEST_SCOPES, { message: `scope must be one of ${WORKFLOW_REQUEST_SCOPES.join(', ')}.` })
  scope: WorkflowRequestScope = 'mine';
}
