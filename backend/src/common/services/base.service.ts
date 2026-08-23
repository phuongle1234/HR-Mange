import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { IBaseService, PaginatedResult } from '../interfaces/base.interface';
import { AuditEntityType } from '../constants/audit-action.constant';
import {
  BULK_ENTITY_ID_SENTINEL,
  ENTITY_CREATED_EVENT,
  ENTITY_DELETED_EVENT,
  ENTITY_UPDATED_EVENT,
  EntityCrudEvent,
} from '../events/entity-crud.event';
import {
  CreateDataOf,
  CreateManyDataOf,
  CrudDelegateShape,
  DeleteManyWhereOf,
  EntityOf,
  UpdateDataOf,
  UpdateManyDataOf,
  UpdateManyWhereOf,
  unsafeCoerce,
} from './prisma-crud.types';

function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

/**
 * Shared CRUD + audit-eventing for entity services (per AGENTS.md Backend
 * Rules). Every method here is concrete except `findMany` - concrete
 * services (e.g. EmployeeService) do not redeclare create/createMany/
 * findOne/update/updateMany/delete/deleteMany at all.
 *
 * Single generic parameter for everything Prisma-related: `TDelegate`, the
 * injected Prisma model delegate (e.g. `PrismaService['employee']`). Entity
 * shape and every Prisma input/where type are derived from it via Prisma's
 * own public `Prisma.Args`/`Prisma.Result` utilities (see
 * prisma-crud.types.ts) - no separate TEntity/CreateInput/UpdateInput
 * generics, no hand-maintained model registry.
 *
 * The caller decides the exact data shape for create/update/createMany/
 * updateMany and is responsible for including any system-managed field
 * (e.g. `createdByUserId`/`updatedByUserId`) directly in that data itself -
 * this class does NOT transform, merge, add, or drop any field, not even on
 * a separate object built just for the Prisma write. `data` is forwarded to
 * `this.entity.*` completely unchanged, and that same `data` is exactly
 * what gets published as the audit event payload (see
 * docs/09-workflow/plans/base-service-generic-refactor.md). `actorUserId` is
 * used only to tag the emitted audit event's actor - it is never written
 * into the persisted row by this class.
 *
 * `update`/`delete` (single and bulk) detect a missing record by catching
 * Prisma's own not-found error (`P2025`) from the write itself, rather than
 * querying first - there is no snapshot query anywhere in this class purely
 * to serve the audit event.
 */
export abstract class BaseService<TDelegate extends CrudDelegateShape, TQuery = unknown>
  implements IBaseService<EntityOf<TDelegate>, CreateDataOf<TDelegate>, UpdateDataOf<TDelegate>, TQuery>
{
  protected constructor(
    protected readonly entity: TDelegate,
    private readonly eventEmitter: EventEmitter2,
    private readonly entityType: AuditEntityType,
    private readonly notFoundException: (id: string) => Error,
  ) {}

  abstract findMany(query?: TQuery): Promise<PaginatedResult<EntityOf<TDelegate>>>;

  async findOne(id: string): Promise<EntityOf<TDelegate>> {
    const found = unsafeCoerce<EntityOf<TDelegate> | null>(await this.entity.findUnique({ where: { id } }));
    if (!found) throw this.notFoundException(id);
    return found;
  }

  async create(data: CreateDataOf<TDelegate>, actorUserId?: string): Promise<EntityOf<TDelegate>> {
    const created = unsafeCoerce<EntityOf<TDelegate>>(await this.entity.create({ data }));
    this.emit(ENTITY_CREATED_EVENT, unsafeCoerce<{ id: string }>(created).id, data, actorUserId);
    return created;
  }

  async createMany(dataArray: CreateManyDataOf<TDelegate>, actorUserId?: string): Promise<EntityOf<TDelegate>[]> {
    const items = unsafeCoerce<Record<string, unknown>[]>(dataArray);
    const created = unsafeCoerce<EntityOf<TDelegate>[]>(await this.entity.createManyAndReturn({ data: items }));
    created.forEach((row, index) => {
      this.emit(ENTITY_CREATED_EVENT, unsafeCoerce<{ id: string }>(row).id, items[index], actorUserId);
    });
    return created;
  }

  async update(id: string, data: UpdateDataOf<TDelegate>, actorUserId?: string): Promise<EntityOf<TDelegate>> {
    try {
      const updated = unsafeCoerce<EntityOf<TDelegate>>(await this.entity.update({ where: { id }, data }));
      this.emit(ENTITY_UPDATED_EVENT, id, data, actorUserId);
      return updated;
    } catch (error) {
      if (isRecordNotFoundError(error)) throw this.notFoundException(id);
      throw error;
    }
  }

  async updateMany(
    args: { where: UpdateManyWhereOf<TDelegate>; data: UpdateManyDataOf<TDelegate> },
    actorUserId?: string,
  ): Promise<EntityOf<TDelegate>[]> {
    const updated = unsafeCoerce<EntityOf<TDelegate>[]>(
      await this.entity.updateManyAndReturn({ where: args.where, data: args.data }),
    );
    updated.forEach((row) => {
      this.emit(ENTITY_UPDATED_EVENT, unsafeCoerce<{ id: string }>(row).id, args.data, actorUserId);
    });
    return updated;
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    try {
      await this.entity.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) throw this.notFoundException(id);
      throw error;
    }
    this.emit(ENTITY_DELETED_EVENT, id, {}, actorUserId);
  }

  async deleteMany(args: { where: DeleteManyWhereOf<TDelegate> }, actorUserId?: string): Promise<void> {
    await this.entity.deleteMany({ where: args.where });
    this.emit(ENTITY_DELETED_EVENT, BULK_ENTITY_ID_SENTINEL, { where: args.where }, actorUserId);
  }

  private emit(eventName: string, entityId: string, payload: unknown, actorUserId?: string): void {
    this.eventEmitter.emit(
      eventName,
      new EntityCrudEvent(this.entityType, entityId, payload, actorUserId, new Date()),
    );
  }
}
