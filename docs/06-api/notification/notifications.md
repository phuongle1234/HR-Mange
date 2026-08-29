---
id: API-NOTIFICATIONS
type: api
module: notification
status: draft
depends_on:
  - WORK-029
---

# Notifications

All notification endpoints require `JwtAuthGuard`.

## List

```text
GET /api/notifications?limit=10&isRead=false
```

Rules:
- Returns only the current actor employee's notifications.
- Sorts by `createdAt` descending.
- `limit` defaults to `10` and maxes at `50`.
- `isRead` is optional.
- Response `meta.unreadCount` is required.

## Mark One Read

```text
PATCH /api/notifications/:id/read
```

Marks one notification read only when it belongs to the current actor employee. Unknown or another employee's notification returns `404 NOTIFICATION_NOT_FOUND`.

## Mark All Read

```text
PATCH /api/notifications/read-all
```

Marks all unread notifications for the current actor employee and returns:

```json
{ "updatedCount": 3 }
```
