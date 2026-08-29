import { Prisma, Workflow, WorkflowStep } from '@prisma/client';
import { IBaseService, PaginatedResult } from '../../../common/interfaces/base.interface';
import { GetWorkflowsQueryDto } from '../dto/get-workflows-query.dto';
import { ReplaceWorkflowStepsDto } from '../dto/replace-workflow-steps.dto';

export type WorkflowCreateInput = Prisma.WorkflowUncheckedCreateInput;

/** A workflow plus its step chain, ordered root-first by following `parentId`. */
export type WorkflowWithSteps = Workflow & { steps: WorkflowStep[] };

export interface IWorkflowService
  extends IBaseService<Workflow, WorkflowCreateInput, Prisma.WorkflowUncheckedUpdateInput, GetWorkflowsQueryDto> {
  findMany(query?: GetWorkflowsQueryDto): Promise<PaginatedResult<Workflow>>;

  /** Detail view: the workflow with its chain ordered root-first. */
  findOneWithSteps(id: string): Promise<WorkflowWithSteps>;

  /**
   * Replaces the entire step chain. Named distinctly from any inherited base
   * method because it is not CRUD on one row: it deletes the old chain and
   * inserts a new one atomically, deriving `parentId` from array order.
   */
  replaceSteps(workflowId: string, dto: ReplaceWorkflowStepsDto, actorUserId: string): Promise<WorkflowWithSteps>;

  /** Throws WorkflowCodeExistsException when `code` is already taken. */
  assertCodeIsAvailable(code: string): Promise<void>;
}
