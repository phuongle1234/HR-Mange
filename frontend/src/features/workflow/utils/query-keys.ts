import type { WorkflowListQuery, WorkflowRequestListQuery } from '../types/workflow.types';

export const workflowQueryKeys = {
  all: ['workflows'] as const,
  list: (query?: WorkflowListQuery) => ['workflows', query ?? {}] as const,
  detail: (id: string) => ['workflows', id] as const,
};

export const workflowRequestQueryKeys = {
  all: ['workflow-requests'] as const,
  list: (query: WorkflowRequestListQuery) => ['workflow-requests', query] as const,
  detail: (id: string) => ['workflow-requests', id] as const,
  histories: (id: string) => ['workflow-requests', id, 'histories'] as const,
};

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications'] as const,
};
