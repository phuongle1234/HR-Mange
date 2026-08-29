---
id: FRONTEND-NOTIFICATION-WORKFLOW
type: frontend
module: notification
status: draft
depends_on:
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
---

# Workflow Notifications

## Purpose
Define the notification bell and workflow socket invalidation behavior.

## Data Source
Notifications are read from the database through the real API — `notificationApiService` calls `GET /api/notifications` via `baseApiService`/`ApiEndpoints`, with no mock path. The backend persists each notification row inside the workflow action transaction, so a notification cannot exist without the action that caused it, and vice versa.

## Header Bell
- `NotificationBell` renders beside the existing account menu in `AppLayout`. The account menu, Change Password, and Logout are unchanged.
- The unread badge uses **`meta.unreadCount` from the response**, never a count of the returned rows. The list is paged (default 10), so counting unread items in the current page would under-report the badge as soon as a user has more unread notifications than one page holds. The backend counts across all of the actor's rows (`API-NOTIFICATION-LIST`).
- The badge renders only when `unreadCount > 0`.
- Clicking a notification marks it read, closes the dropdown, and navigates to `/workflow-requests/:referenceId` when `referenceId` exists. A notification with a null `referenceId` is still marked read and closes the dropdown, but does not navigate.
- Mark-all-read calls `PATCH /api/notifications/read-all`.

## Socket Behavior
- The workflow socket client connects to `/ws` using the authenticated token from the handshake.
- Socket handlers **invalidate TanStack Query caches only**; they never merge socket payloads into cached data. Payloads carry ids and status only, so treating them as a data source would turn a dropped or out-of-order event into wrong data on screen rather than merely stale data.
- Workflow request events invalidate the workflow and workflow-request keys; `notification.created` invalidates the notification keys.
- `connect` and `reconnect` invalidate both, because a reconnecting client may have missed events entirely while disconnected.

### Event names are frozen and must match the backend exactly
The client subscribes to the eight names in the workflow contract (§9.2):

```text
workflow.request.created      workflow.request.rejected
workflow.request.approved     workflow.request.cancelled
workflow.request.feedback     workflow.request.resubmitted
workflow.request.completed    notification.created
```

These are declared once as constants in `useWorkflowSocket.ts` rather than typed inline at each `socket.on` call. A name mismatch does not throw or warn — the handler simply never fires — so the failure presents as a caching bug rather than a wiring bug and can go unnoticed for a long time. Any change here must be made on both sides at once.

## State Ownership
| State | Owner |
| --- | --- |
| Notification list and unread count | TanStack Query |
| Dropdown open state | Local React state |
| Socket invalidation | Workflow socket provider |

