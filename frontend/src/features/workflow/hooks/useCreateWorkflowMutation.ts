import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApiService } from '../services/workflow.api';
import { workflowQueryKeys } from '../utils/query-keys';

export function useCreateWorkflowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => workflowApiService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
    },
  });
}
