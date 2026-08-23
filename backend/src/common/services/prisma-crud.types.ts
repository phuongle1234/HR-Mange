import { Prisma } from '@prisma/client';

/**
 * Minimal shape BaseService needs from any Prisma model delegate. Methods
 * are declared loosely (args: any) so every real Prisma delegate (each has
 * its own generic-overloaded method signature per call) structurally
 * satisfies this bound - Prisma's per-model generic overloads cannot be
 * expressed through a single free type parameter. Precise per-operation
 * types are recovered separately via Prisma.Args/Prisma.Result below.
 */
export interface CrudDelegateShape {
  create(args: any): Promise<any>;
  createManyAndReturn(args: any): Promise<any>;
  findUnique(args: any): Promise<any>;
  findMany(args: any): Promise<any>;
  count(args: any): Promise<number>;
  update(args: any): Promise<any>;
  updateManyAndReturn(args: any): Promise<any>;
  delete(args: any): Promise<any>;
  deleteMany(args: any): Promise<any>;
}

/** The full entity row Prisma returns for this delegate. */
export type EntityOf<D> = Prisma.Result<D, {}, 'create'>;

/** `data` shape accepted by this delegate's single-record `create`. */
export type CreateDataOf<D> = Prisma.Args<D, 'create'>['data'];

/** `data` shape accepted by this delegate's single-record `update`. */
export type UpdateDataOf<D> = Prisma.Args<D, 'update'>['data'];

/** `data` shape accepted by this delegate's `createManyAndReturn`. */
export type CreateManyDataOf<D> = Prisma.Args<D, 'createManyAndReturn'>['data'];

/** `where` filter shape for this delegate's `updateManyAndReturn`. */
export type UpdateManyWhereOf<D> = Prisma.Args<D, 'updateManyAndReturn'>['where'];

/** `data` shape accepted by this delegate's `updateManyAndReturn`. */
export type UpdateManyDataOf<D> = Prisma.Args<D, 'updateManyAndReturn'>['data'];

/** `where` filter shape for this delegate's `deleteMany`. */
export type DeleteManyWhereOf<D> = Prisma.Args<D, 'deleteMany'>['where'];

/**
 * The one sanctioned type assertion for this generic-CRUD design. Used for
 * exactly one reason: CrudDelegateShape's methods are intentionally typed
 * loosely (args: any) => Promise<any> so arbitrary concrete Prisma delegates
 * satisfy the bound - Prisma's per-model generic-overloaded method
 * signatures can't be expressed through a free type parameter otherwise.
 * That means their return value is seen as `any` through the bound and must
 * be reasserted to the precise type already derived via Prisma.Result.
 * This is NOT used to "trust" caller-supplied data matches a Prisma input -
 * create/update take CreateDataOf<TDelegate>/UpdateDataOf<TDelegate>
 * directly as their parameter type, so TypeScript checks that at the call
 * site with no cast needed.
 * Do not scatter `as any`/`as unknown` elsewhere - every such gap in this
 * file funnels through this one, documented function.
 */
export function unsafeCoerce<T>(value: unknown): T {
  return value as T;
}
