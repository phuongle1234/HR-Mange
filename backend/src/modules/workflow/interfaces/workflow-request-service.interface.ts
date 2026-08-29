import { Prisma, WorkflowRequest } from '@prisma/client';
import { IBaseService, PaginatedResult } from '../../../common/interfaces/base.interface';
import { CreateWorkflowRequestDto } from '../dto/create-workflow-request.dto';
import { GetWorkflowRequestsQueryDto } from '../dto/get-workflow-requests-query.dto';
import {
  WorkflowHistoryResponse,
  WorkflowRequestResponse,
} from '../utils/workflow-response.util';

export type WorkflowRequestCreateInput = Prisma.WorkflowRequestUncheckedCreateInput;

export interface IWorkflowRequestService
  extends IBaseService<
    WorkflowRequest,
    WorkflowRequestCreateInput,
    Prisma.WorkflowRequestUncheckedUpdateInput,
    GetWorkflowRequestsQueryDto
  > {
  findMany(query?: GetWorkflowRequestsQueryDto): Promise<PaginatedResult<WorkflowRequest>>;

  /**
   * Submits a new request: validates the workflow is usable, validates
   * formData against its schema, then writes the request and its SUBMIT
   * history row atomically.
   */
  submit(dto: CreateWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse>;

  /** Detail view including workflow/employee/currentStep and per-actor permissions. */
  findOneForActor(id: string, actorUserId: string): Promise<WorkflowRequestResponse>;

  /** History rows for one request, `createdAt` ascending. Read-only: history is immutable. */
  findHistories(id: string, actorUserId: string): Promise<WorkflowHistoryResponse[]>;

  /** List for the actor, scoped to `mine` (own requests) or `inbox` (awaiting my decision). */
  findManyForActor(
    query: GetWorkflowRequestsQueryDto,
    actorUserId: string,
  ): Promise<PaginatedResult<WorkflowRequestResponse>>;
}
