import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Workflow } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import {
  OrganizationTypeReferenceNotFoundException,
  WorkflowCodeExistsException,
  WorkflowHasActiveRequestsException,
  WorkflowNotFoundException,
} from '../../../common/exceptions/app.exception';
import { GetWorkflowsQueryDto } from '../dto/get-workflows-query.dto';
import { ReplaceWorkflowStepsDto } from '../dto/replace-workflow-steps.dto';
import { IWorkflowService, WorkflowWithSteps } from '../interfaces/workflow-service.interface';
import { orderStepChain } from '../utils/workflow-step-chain.util';

/** Statuses that mean a request is still in flight, so its chain must not be rewired. */
const NON_TERMINAL_STATUSES: Prisma.EnumWorkflowRequestStatusFilter = {
  in: ['DRAFT', 'IN_PROGRESS', 'NEEDS_REVISION'],
};

/**
 * Workflow definitions. create/update/findOne/delete are inherited from
 * BaseService untouched; only findMany plus the two genuinely non-CRUD
 * operations below are declared here.
 *
 * `entityType: null` opts out of the shared audit log (contract 11): workflow
 * activity is recorded in `workflow_histories`, a richer immutable trail, and
 * duplicating it into `audit_logs` would create two half-authoritative
 * histories.
 */
@Injectable()
export class WorkflowService
  extends BaseService<PrismaService['workflow'], GetWorkflowsQueryDto>
  implements IWorkflowService
{
  constructor(
    private readonly prisma: PrismaService,
    eventEmitter: EventEmitter2,
  ) {
    super(prisma.workflow, eventEmitter, null, (id) => new WorkflowNotFoundException(id));
  }

  async findMany(query?: GetWorkflowsQueryDto): Promise<PaginatedResult<Workflow>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const where = this.buildWhere(query?.search, query?.status);

    const [items, total] = await Promise.all([
      this.entity.findMany({
        where,
        orderBy: { [query?.sortBy ?? 'createdAt']: query?.sortOrder ?? 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.entity.count({ where }),
    ]);

    return { items, total };
  }

  async findOneWithSteps(id: string): Promise<WorkflowWithSteps> {
    const workflow = await this.prisma.workflow.findUnique({ where: { id }, include: { steps: true } });
    if (!workflow) throw new WorkflowNotFoundException(id);

    // Ordered by walking parentId, never by stepOrder (contract 2.2).
    return { ...workflow, steps: orderStepChain(workflow.steps) };
  }

  /**
   * Replaces the whole chain in one transaction: delete the old steps, insert
   * the new ones, and derive `parentId` from array order so a branch cannot be
   * expressed. Refused outright while any request is in flight, because
   * rewiring under a live request would leave its `current_step_id` dangling.
   */
  async replaceSteps(
    workflowId: string,
    dto: ReplaceWorkflowStepsDto,
    actorUserId: string,
  ): Promise<WorkflowWithSteps> {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new WorkflowNotFoundException(workflowId);

    await this.assertNoActiveRequests(workflowId);
    await this.assertOrganizationTypesExist(dto.steps.map((step) => step.organizationTypeId));

    await this.prisma.$transaction(async (tx) => {
      await tx.workflowStep.deleteMany({ where: { workflowId } });

      // Sequential inserts: each step needs the previous row's generated id as
      // its parentId, so this cannot be a createMany.
      let parentId: string | null = null;
      for (const [index, step] of dto.steps.entries()) {
        const created = await tx.workflowStep.create({
          data: {
            workflowId,
            parentId,
            name: step.name,
            organizationTypeId: step.organizationTypeId,
            stepOrder: index,
          },
        });
        parentId = created.id;
      }

      await tx.workflow.update({ where: { id: workflowId }, data: { version: { increment: 1 } } });
    });

    return this.findOneWithSteps(workflowId);
  }

  private async assertNoActiveRequests(workflowId: string): Promise<void> {
    const activeCount = await this.prisma.workflowRequest.count({
      where: { workflowId, status: NON_TERMINAL_STATUSES },
    });
    if (activeCount > 0) throw new WorkflowHasActiveRequestsException();
  }

  private async assertOrganizationTypesExist(organizationTypeIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(organizationTypeIds)];
    const found = await this.prisma.organizationType.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (found.length === uniqueIds.length) return;

    const existing = new Set(found.map((organizationType) => organizationType.id));
    const missingIndex = organizationTypeIds.findIndex((id) => !existing.has(id));
    throw new OrganizationTypeReferenceNotFoundException(`steps.${missingIndex}.organizationTypeId`);
  }

  /** Translates the unique-constraint violation on `code` into the domain conflict. */
  async assertCodeIsAvailable(code: string): Promise<void> {
    const existing = await this.entity.findUnique({ where: { code } });
    if (existing) throw new WorkflowCodeExistsException();
  }

  private buildWhere(search?: string, status?: Workflow['status']): Prisma.WorkflowWhereInput {
    const trimmed = search?.trim();
    return {
      ...(status ? { status } : {}),
      ...(trimmed
        ? {
            OR: [
              { code: { contains: trimmed, mode: 'insensitive' as const } },
              { name: { contains: trimmed, mode: 'insensitive' as const } },
              { description: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }
}
