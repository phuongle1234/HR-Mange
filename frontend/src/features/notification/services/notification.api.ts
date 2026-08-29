import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type { NotificationItem, NotificationListResponse } from '../types/notification.types';

/**
 * Notifications come from the database through GET /api/notifications.
 *
 * `unreadCount` is read from the response `meta`, not recomputed from the
 * returned rows: the list is paged (default 10), so counting unread items in
 * the current page would under-report the badge as soon as a user has more
 * unread notifications than one page holds. The backend counts across all of
 * the actor's rows (contract 5.3).
 */
interface NotificationListMeta {
  page?: number;
  limit?: number;
  total?: number;
  unreadCount?: number;
}

export const notificationApiService = {
  async list(): Promise<NotificationListResponse> {
    const response = await baseApiService.getWithEnvelope<NotificationItem[]>(ApiEndpoints.notifications.list());
    const meta = (response.meta ?? {}) as NotificationListMeta;

    return {
      items: response.data,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? response.data.length,
        total: meta.total ?? response.data.length,
        unreadCount: meta.unreadCount ?? response.data.filter((item) => !item.isRead).length,
      },
    };
  },

  async markRead(id: string): Promise<NotificationItem> {
    return baseApiService.patch<NotificationItem>(ApiEndpoints.notifications.read(id));
  },

  async markAllRead(): Promise<void> {
    await baseApiService.patch<void>(ApiEndpoints.notifications.readAll());
  },
};
