import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowRequestApiService } from '../services/workflow.api';
import { workflowRequestQueryKeys } from '../utils/query-keys';
import type { WorkflowRequestActionPayload } from '../types/workflow.types';

export function useWorkflowActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkflowRequestActionPayload }) => workflowRequestApiService.action(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowRequestQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workflowRequestQueryKeys.all });
    },
  });
}
