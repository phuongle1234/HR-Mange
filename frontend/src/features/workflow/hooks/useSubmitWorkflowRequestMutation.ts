import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowRequestApiService } from '../services/workflow.api';
import { workflowQueryKeys, workflowRequestQueryKeys } from '../utils/query-keys';

export function useSubmitWorkflowRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { workflowId: string; formData: Record<string, unknown> }) => workflowRequestApiService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowRequestQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
    },
  });
}
