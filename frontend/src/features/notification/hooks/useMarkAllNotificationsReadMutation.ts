import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApiService } from '../services/notification.api';
import { notificationQueryKeys } from '../utils/query-keys';

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApiService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
