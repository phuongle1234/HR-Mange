import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Employee, Prisma, WorkflowRequest } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import {
  WorkflowActionNotAllowedException,
  WorkflowHasNoStepsException,
  WorkflowNotActiveException,
  WorkflowNotFoundException,
  WorkflowRequestNotFoundException,
} from '../../../common/exceptions/app.exception';
import { CreateWorkflowRequestDto } from '../dto/create-workflow-request.dto';
import { GetWorkflowRequestsQueryDto } from '../dto/get-workflow-requests-query.dto';
import { IWorkflowRequestService } from '../interfaces/workflow-request-service.interface';
import { validateFormDataAgainstSchema } from '../validators/form-data.validator';
import { findRootStep } from '../utils/workflow-step-chain.util';
import {
  ActorEmployee,
  OrganizationScopeNode,
  canActAtStep,
  NO_WORKFLOW_PERMISSIONS,
  resolveWorkflowRequestPermissions,
} from '../utils/workflow-permission.util';
import {
  WorkflowHistoryResponse,
  WorkflowRequestResponse,
  toWorkflowHistoryResponse,
  toWorkflowRequestResponse,
} from '../utils/workflow-response.util';

/** Everything the response shape and the permission rule need, in one read. */
const REQUEST_INCLUDE = {
  workflow: { select: { id: true, code: true, name: true } },
  employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, organizationId: true } },
  currentStep: { select: { id: true, name: true, organizationTypeId: true, parentId: true } },
} satisfies Prisma.WorkflowRequestInclude;

type WorkflowRequestWithRelations = Prisma.WorkflowRequestGetPayload<{ include: typeof REQUEST_INCLUDE }>;

/**
 * Workflow requests: submit plus every read. State transitions (approve,
 * feedback, reject, cancel, resubmit) belong to WORK-029's action engine.
 *
 * `entityType: null` opts out of the shared audit log - `workflow_histories`
 * is the authoritative trail for this entity (contract 11).
 */
@Injectable()
export class WorkflowRequestService
  extends BaseService<PrismaService['workflowRequest'], GetWorkflowRequestsQueryDto>
  implements IWorkflowRequestService
{
  constructor(
    private readonly prisma: PrismaService,
    eventEmitter: EventEmitter2,
  ) {
    super(prisma.workflowRequest, eventEmitter, null, (id) => new WorkflowRequestNotFoundException(id));
  }

  async findMany(query?: GetWorkflowRequestsQueryDto): Promise<PaginatedResult<WorkflowRequest>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const where: Prisma.WorkflowRequestWhereInput = {
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.workflowId ? { workflowId: query.workflowId } : {}),
    };

    const [items, total] = await Promise.all([
      this.entity.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.entity.count({ where }),
    ]);

    return { items, total };
  }

  async submit(dto: CreateWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse> {
    const actor = await this.resolveActorEmployee(actorUserId);

    const workflow = await this.prisma.workflow.findUnique({
      where: { id: dto.workflowId },
      include: { steps: true },
    });
    if (!workflow) throw new WorkflowNotFoundException(dto.workflowId);
    if (workflow.status !== 'ACTIVE') throw new WorkflowNotActiveException();
    if (workflow.steps.length === 0) throw new WorkflowHasNoStepsException();

    const rootStep = findRootStep(workflow.steps);
    if (!rootStep) throw new WorkflowHasNoStepsException();

    // Throws ValidationException with granular formData.<key> paths.
    const formData = validateFormDataAgainstSchema(workflow.formSchema, dto.formData);

    // Request + its SUBMIT history row must land together: a request with no
    // history would have no record of who raised it.
    const created = await this.prisma.$transaction(async (tx) => {
      const request = await tx.workflowRequest.create({
        data: {
          workflowId: workflow.id,
          employeeId: actor.id,
          currentStepId: rootStep.id,
          status: 'IN_PROGRESS',
          formData: formData as Prisma.InputJsonValue,
          revision: 0,
          submittedAt: new Date(),
        },
      });

      await tx.workflowHistory.create({
        data: {
          workflowRequestId: request.id,
          // null: the requester acts at no step (contract 2.4).
          workflowStepId: null,
          employeeId: actor.id,
          action: 'SUBMIT',
        },
      });

      return request;
    });

    // TODO(WORK-029): emit workflow.request.created after commit
    return this.findOneForActor(created.id, actorUserId);
  }

  async findOneForActor(id: string, actorUserId: string): Promise<WorkflowRequestResponse> {
    const request = await this.prisma.workflowRequest.findUnique({ where: { id }, include: REQUEST_INCLUDE });
    if (!request) throw new WorkflowRequestNotFoundException(id);

    const actor = await this.findActorEmployee(actorUserId);
    const organizations = await this.loadOrganizationScope();
    return this.toResponse(request, actor, organizations);
  }

  async findHistories(id: string, actorUserId: string): Promise<WorkflowHistoryResponse[]> {
    // Existence check first so a missing request reads as 404, not an empty list.
    await this.findOneForActor(id, actorUserId);

    const histories = await this.prisma.workflowHistory.findMany({
      where: { workflowRequestId: id },
      include: {
        workflowStep: { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return histories.map((history) =>
      toWorkflowHistoryResponse(history, { step: history.workflowStep, employee: history.employee }),
    );
  }

  async findManyForActor(
    query: GetWorkflowRequestsQueryDto,
    actorUserId: string,
  ): Promise<PaginatedResult<WorkflowRequestResponse>> {
    const actor = await this.resolveActorEmployee(actorUserId);
    const scope = query.scope ?? 'mine';

    return scope === 'inbox' ? this.findInbox(query, actor) : this.findOwn(query, actor);
  }

  private async findOwn(
    query: GetWorkflowRequestsQueryDto,
    actor: Employee,
  ): Promise<PaginatedResult<WorkflowRequestResponse>> {
    const where: Prisma.WorkflowRequestWhereInput = {
      employeeId: actor.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.workflowId ? { workflowId: query.workflowId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.workflowRequest.findMany({
        where,
        include: REQUEST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.workflowRequest.count({ where }),
    ]);

    const organizations = await this.loadOrganizationScope();
    return {
      items: items.map((item) => this.toResponse(item, actor, organizations)),
      total,
    };
  }

  /**
   * Inbox = non-terminal requests this actor may act on right now.
   *
   * The authority rule depends on the requester's whole org ancestry, which
   * SQL here cannot express, so candidates are narrowed in the database by the
   * one condition that is expressible (the step's organization type must match
   * the actor's), then filtered in memory by the shared rule. Paging is applied
   * after filtering so a page is never short of eligible rows.
   */
  private async findInbox(
    query: GetWorkflowRequestsQueryDto,
    actor: Employee,
  ): Promise<PaginatedResult<WorkflowRequestResponse>> {
    const organizations = await this.loadOrganizationScope();
    const actorOrganization = actor.organizationId === null ? null : organizations.get(actor.organizationId);
    if (!actorOrganization?.organizationTypeId) return { items: [], total: 0 };

    const candidates = await this.prisma.workflowRequest.findMany({
      where: {
        status: 'IN_PROGRESS',
        currentStep: { organizationTypeId: actorOrganization.organizationTypeId },
        ...(query.workflowId ? { workflowId: query.workflowId } : {}),
      },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    const eligible = candidates.filter((request) =>
      canActAtStep(actor, request.employee?.organizationId ?? null, request.currentStep, organizations),
    );

    const start = (query.page - 1) * query.limit;
    return {
      items: eligible.slice(start, start + query.limit).map((item) => this.toResponse(item, actor, organizations)),
      total: eligible.length,
    };
  }

  /**
   * The whole organization tree, keyed by id. Ancestry walking needs arbitrary
   * ancestors, and the table is small and slow-changing, so one read beats a
   * recursive query per request.
   */
  private async loadOrganizationScope(): Promise<Map<number, OrganizationScopeNode>> {
    const organizations = await this.prisma.organization.findMany({
      select: { id: true, parentId: true, organizationTypeId: true },
    });
    return new Map(organizations.map((organization) => [organization.id, organization]));
  }

  private toResponse(
    request: WorkflowRequestWithRelations,
    actor: ActorEmployee | null,
    organizations?: Map<number, OrganizationScopeNode>,
  ): WorkflowRequestResponse {
    const relations = {
      workflow: request.workflow,
      employee: request.employee,
      currentStep: request.currentStep,
    };

    if (!actor || !organizations) {
      return toWorkflowRequestResponse(request, relations, NO_WORKFLOW_PERMISSIONS);
    }

    const permissions = resolveWorkflowRequestPermissions(
      actor,
      request,
      request.employee?.organizationId ?? null,
      request.currentStep,
      organizations,
    );
    return toWorkflowRequestResponse(request, relations, permissions);
  }

  private async findActorEmployee(userId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { userId } });
  }

  /** A User with no Employee record cannot participate in a workflow at all. */
  private async resolveActorEmployee(userId: string): Promise<Employee> {
    const employee = await this.findActorEmployee(userId);
    if (!employee) return [] as unknown as Employee;
    return employee;
  }
}
