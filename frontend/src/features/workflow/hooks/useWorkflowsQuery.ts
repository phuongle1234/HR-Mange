import { useQuery } from '@tanstack/react-query';
import { workflowApiService } from '../services/workflow.api';
import { workflowQueryKeys } from '../utils/query-keys';
import type { WorkflowListQuery } from '../types/workflow.types';

export function useWorkflowsQuery(query?: WorkflowListQuery) {
  return useQuery({
    queryKey: workflowQueryKeys.list(query),
    queryFn: () => workflowApiService.list(query),
  });
}
