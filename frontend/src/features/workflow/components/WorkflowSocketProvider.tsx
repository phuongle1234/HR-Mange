import { useWorkflowSocket } from '../hooks/useWorkflowSocket';

export function WorkflowSocketProvider() {
  useWorkflowSocket();
  return null;
}
