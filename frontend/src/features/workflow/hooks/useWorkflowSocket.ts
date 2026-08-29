import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { readStoredToken } from '../../../shared/auth/token-storage';
import { notificationQueryKeys, workflowQueryKeys, workflowRequestQueryKeys } from '../utils/query-keys';

/**
 * Socket event names are FROZEN by the workflow contract (section 9.2) and must
 * match what the backend gateway emits character-for-character. A mismatch does
 * not throw or warn - the handler simply never fires, which looks like a
 * caching bug rather than a wiring bug, so these live in one named constant
 * instead of being typed inline at each `socket.on` call.
 */
const WORKFLOW_REQUEST_EVENTS = [
  'workflow.request.created',
  'workflow.request.approved',
  'workflow.request.feedback',
  'workflow.request.rejected',
  'workflow.request.cancelled',
  'workflow.request.resubmitted',
  'workflow.request.completed',
] as const;

const NOTIFICATION_CREATED_EVENT = 'notification.created';

let socket: Socket | null = null;

/**
 * The socket is a hint, never a data source (contract 9.4): every handler only
 * invalidates query caches so the REST endpoints stay the single source of
 * truth. Reading values off the payload would turn a dropped or out-of-order
 * event into wrong data on screen instead of merely stale data.
 */
export function useWorkflowSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      return;
    }

    socket = io(`${import.meta.env.VITE_API_BASE_URL ?? ''}/ws`, {
      auth: { token },
      transports: ['websocket'],
    });

    const invalidateWorkflowRequests = () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowRequestQueryKeys.all });
    };

    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    };

    // Reconnecting may have missed events entirely, so refresh both caches.
    const invalidateAll = () => {
      invalidateWorkflowRequests();
      invalidateNotifications();
    };

    for (const event of WORKFLOW_REQUEST_EVENTS) {
      socket.on(event, invalidateWorkflowRequests);
    }
    socket.on(NOTIFICATION_CREATED_EVENT, invalidateNotifications);
    socket.on('connect', invalidateAll);
    socket.io.on('reconnect', invalidateAll);

    return () => {
      for (const event of WORKFLOW_REQUEST_EVENTS) {
        socket?.off(event, invalidateWorkflowRequests);
      }
      socket?.off(NOTIFICATION_CREATED_EVENT, invalidateNotifications);
      socket?.off('connect', invalidateAll);
      socket?.io.off('reconnect', invalidateAll);
      socket?.disconnect();
      socket = null;
    };
  }, [queryClient]);
}
