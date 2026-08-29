import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApiService } from '../services/notification.api';
import { notificationQueryKeys } from '../utils/query-keys';

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApiService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
