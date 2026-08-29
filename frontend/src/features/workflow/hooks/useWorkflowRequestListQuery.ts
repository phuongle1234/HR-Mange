import { useQuery } from '@tanstack/react-query';
import { workflowRequestApiService } from '../services/workflow.api';
import { workflowRequestQueryKeys } from '../utils/query-keys';
import type { WorkflowRequestListQuery } from '../types/workflow.types';

export function useWorkflowRequestListQuery(query: WorkflowRequestListQuery) {
  return useQuery({
    queryKey: workflowRequestQueryKeys.list(query),
    queryFn: () => workflowRequestApiService.list(query),
  });
}
