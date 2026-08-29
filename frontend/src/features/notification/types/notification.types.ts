export interface NotificationItem {
  id: string;
  recipientEmployeeId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
}
