import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApiService } from '../services/workflow.api';
import { workflowQueryKeys } from '../utils/query-keys';
import type { WorkflowStep } from '../types/workflow.types';

export function useReplaceWorkflowStepsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, steps }: { id: string; steps: WorkflowStep[] }) => workflowApiService.replaceSteps(id, steps),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
    },
  });
}
