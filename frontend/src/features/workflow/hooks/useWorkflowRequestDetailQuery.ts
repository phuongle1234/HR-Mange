import { useQuery } from '@tanstack/react-query';
import { workflowRequestApiService } from '../services/workflow.api';
import { workflowRequestQueryKeys } from '../utils/query-keys';

export function useWorkflowRequestDetailQuery(id: string) {
  return useQuery({
    queryKey: workflowRequestQueryKeys.detail(id),
    queryFn: () => workflowRequestApiService.detail(id),
    enabled: Boolean(id),
  });
}
