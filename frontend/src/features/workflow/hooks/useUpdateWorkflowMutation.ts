import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApiService } from '../services/workflow.api';
import { workflowQueryKeys } from '../utils/query-keys';

export function useUpdateWorkflowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => workflowApiService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
    },
  });
}
