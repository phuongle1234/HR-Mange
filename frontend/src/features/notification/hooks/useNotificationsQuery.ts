import { useQuery } from '@tanstack/react-query';
import { notificationApiService } from '../services/notification.api';
import { notificationQueryKeys } from '../utils/query-keys';

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: () => notificationApiService.list(),
  });
}
