import { PrismaService } from '../../../prisma/prisma.service';

export type WorkflowDelegate = {
  findUnique(args: unknown): Promise<unknown>;
  findMany(args?: unknown): Promise<unknown[]>;
  count(args?: unknown): Promise<number>;
  create(args: unknown): Promise<unknown>;
  createManyAndReturn(args: unknown): Promise<unknown[]>;
  update(args: unknown): Promise<unknown>;
  updateManyAndReturn(args: unknown): Promise<unknown[]>;
  updateMany(args: unknown): Promise<{ count: number }>;
  delete(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<{ count: number }>;
};

export interface WorkflowPrismaClient {
  $transaction<T>(fn: (tx: WorkflowPrismaClient) => Promise<T>): Promise<T>;
  workflowRequest: WorkflowDelegate;
  workflowHistory: WorkflowDelegate;
  workflowStep: WorkflowDelegate;
  workflow: WorkflowDelegate;
  notification: WorkflowDelegate;
  employee: WorkflowDelegate;
  organization: WorkflowDelegate;
}

export function workflowPrisma(prisma: PrismaService): WorkflowPrismaClient {
  return prisma as unknown as WorkflowPrismaClient;
}
