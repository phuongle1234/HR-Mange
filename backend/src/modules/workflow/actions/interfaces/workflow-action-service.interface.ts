import { IBaseService, PaginatedResult } from '../../../../common/interfaces/base.interface';
import type { WorkflowRequestEntity, WorkflowRequestResponse } from '../../shared/workflow-contract.types';
import type { ApproveWorkflowRequestDto } from '../dto/approve-workflow-request.dto';
import type { CancelWorkflowRequestDto } from '../dto/cancel-workflow-request.dto';
import type { FeedbackWorkflowRequestDto } from '../dto/feedback-workflow-request.dto';
import type { RejectWorkflowRequestDto } from '../dto/reject-workflow-request.dto';
import type { ResubmitWorkflowRequestDto } from '../dto/resubmit-workflow-request.dto';

export interface IWorkflowActionService extends IBaseService<any, any, any, never> {
  findMany(query?: never): Promise<PaginatedResult<WorkflowRequestEntity>>;
  approve(id: string, dto: ApproveWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse>;
  feedback(id: string, dto: FeedbackWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse>;
  reject(id: string, dto: RejectWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse>;
  cancel(id: string, dto: CancelWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse>;
  resubmit(id: string, dto: ResubmitWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse>;
}

export type WorkflowActionServiceDelegate = any;
