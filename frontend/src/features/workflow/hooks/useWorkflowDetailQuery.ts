import { useQuery } from '@tanstack/react-query';
import { workflowApiService } from '../services/workflow.api';
import { workflowQueryKeys } from '../utils/query-keys';

export function useWorkflowDetailQuery(id: string) {
  return useQuery({
    queryKey: workflowQueryKeys.detail(id),
    queryFn: () => workflowApiService.detail(id),
    enabled: Boolean(id),
  });
}
