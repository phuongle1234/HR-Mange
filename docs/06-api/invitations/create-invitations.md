---
id: API-INVITATIONS-CREATE
type: api
module: invitations
status: draft
depends_on:
  - DB-INVITATION
  - DB-EMPLOYEE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Create Invitations

## API
- Method: `POST`
- URL: `/api/invitations`
- Status: draft

Not `POST /api/employees/invitations` — the daily task explicitly calls out this endpoint belongs to its own `invitations` module/route namespace (task §8), separate from the `employees` namespace.

## Purpose
Register invitations for many employees at once, triggered from the Employee List's multi-select "Invite User" context menu action (`FRONTEND-EMPLOYEE-LIST`).

## Controller
- Controller: `InvitationsController` (new module, `backend/src/modules/invitations`)
- Function: `createMany(dto, currentUser)`

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may invite employees.

## DTO And Field Validation
DTO name: `CreateInvitationsDto`

| Field | Required | Validation |
| --- | --- | --- |
| `employeeIds` | yes | array of UUID strings, min `1`, max `100`, no duplicate ids |

## Business Logic
Follows the flow in task §9/§11/§12/§14/§15/§17 exactly:

1. Validate body.
2. Load employees: `WHERE id IN (employeeIds)`.
3. Partition into valid vs. skipped:
   - **Valid**: `userId IS NULL` (task §11: employees who already have `userId` must not receive a new invitation) **and** `email` is a non-empty, valid-format string.
   - **Skipped**, with a reason each:
     - `id` in `employeeIds` but no matching row → `EMPLOYEE_NOT_FOUND` (row-level skip reason, not a request-wide 404 — an invite action over a large selection should not fail entirely because one row vanished).
     - `userId IS NOT NULL` → `USER_ALREADY_EXISTS`.
     - missing/invalid `email` → `EMPLOYEE_MISSING_EMAIL`.
4. For each valid employee, inside one database transaction (task §14):
   - Generate a raw token via `crypto.randomBytes(32)` (task §13 — never `Math.random()`).
   - Hash the raw token (e.g. SHA-256) → `tokenHash`.
   - Create an `Invitation` row: `employeeId`, `email` (snapshot), `tokenHash`, `expiresAt` (see TTL below), `status: PENDING`.
   - Build the invitation URL: `{{FRONTEND_URL}}/invitation/accept?token={{rawToken}}` (raw token only in the URL, never persisted — `DB-INVITATION`).
5. Commit the transaction.
6. **After** commit, publish one `invitation.created` event per created invitation (task §20 — per-invitation events, not one bulk event, so "one mail fail doesn't affect another" and each is independently retryable/trackable). Do not send mail inside the transaction and do not send mail synchronously in the request (task §9/§14/§17 — explicit).
7. Return the `created`/`skipped` summary. Do not include `mailSent` in the response — mail is asynchronous and its outcome is not known yet at response time (task §25, explicit).

### Invitation TTL
Not specified by the daily task. Default: **72 hours** from creation. This is a documented default, not a user-confirmed value (same convention as `DB-EMPLOYEE`'s status enum defaults) — adjustable later without a structural change.

## Database Interaction
- `prisma.employee.findMany({ where: { id: { in: employeeIds } } })` to load and validate.
- One transaction: `prisma.invitation.createMany(...)` or per-row `create(...)` if per-row generated tokens make `createManyAndReturn` awkward — implementation detail left to the backend agent, as long as it is one transaction covering all valid rows.
- This endpoint does **not** go through `BaseService.createMany` the way other bulk-create endpoints do, because it needs the token-generation side effect per row and a partition (created/skipped) response shape that `BaseService`'s uniform "return the created rows" contract doesn't fit. Per `AGENTS.md`'s Mandatory BaseService Reuse Rule, this is recorded as a genuine case where the base method's shape does not match the real business operation — not creating a parallel CRUD variant for something `BaseService` already does, since `BaseService` doesn't do partitioned bulk-with-side-effects at all.

## Event Behavior
- Emits one `invitation.created` event **per created invitation**, after the transaction commits.
- Event class: `InvitationCreatedEvent` (`invitationId`, `employeeId`, `email`, `employeeName`, `invitationUrl`) — per task §16. Not the shared `EntityCrudEvent` used by the `BaseService` CRUD pattern, because this event also carries the one-time invitation URL that must never be logged or persisted (task §16: "Không log raw token hoặc invitation URL có token").
- `InvitationMailListener` (`@OnEvent('invitation.created', { async: true })`, task §18) is the sole consumer; it calls `MailService.sendInvitation(...)` and updates the invitation's `status`/`sentAt`/`sendAttempts`/`lastSendError` accordingly (`DB-INVITATION`'s Status Lifecycle).

## Audit Log Behavior
- A separate `AuditLog` entry (via the existing generic `entity.created` event path, `entityType: INVITATION`) is written for the invitation row's creation itself — distinct from the `invitation.created` mail-trigger event above, which is not an audit event and is not consumed by `AuditLogListener`.
- Never audit-log the raw token or invitation URL — only `employeeId`, `email`, and `expiresAt` belong in the audit payload.

## Request Body
```json
{
  "employeeIds": ["emp-1", "emp-2", "emp-3"]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Invitations registered successfully.",
  "data": {
    "created": [
      { "employeeId": "emp-1", "invitationId": "inv-001" },
      { "employeeId": "emp-2", "invitationId": "inv-002" }
    ],
    "skipped": [
      { "employeeId": "emp-3", "reason": "USER_ALREADY_EXISTS" }
    ]
  }
}
```
(Matches task §25's example exactly — no `mailSent` field, per that section's explicit instruction.)

## HTTP Status
- Success: `201 Created`
- Validation error: `400 Bad Request`
- Unauthorized: `401 Unauthorized`

This endpoint never returns a request-wide `404`/`409` for individual bad rows — those become `skipped` entries in a `201` response, so one bad id in a large batch doesn't fail the whole invite action. It returns `400 VALIDATION_ERROR` only for DTO-shape failures (e.g. empty `employeeIds`).

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed (e.g. empty/oversized `employeeIds`) |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |

`skipped[].reason` values (not top-level error codes — they appear inside a `201` success response): `EMPLOYEE_NOT_FOUND`, `USER_ALREADY_EXISTS`, `EMPLOYEE_MISSING_EMAIL`.

## Frontend Contract Notes
- Mutation key: `['invitations', 'create-many']`.
- Called from Employee List's `ContextMenu` "Invite User" item, with the currently checked employee ids (`FRONTEND-EMPLOYEE-LIST`).
- On success, show a toast summarizing `created.length` invited / `skipped.length` skipped (do not silently drop the skipped list — surface reasons, e.g. via a follow-up detail toast or inline list).
- Does not invalidate `['employees']` — inviting does not change any Employee list-visible field until the invitation is accepted (`employee.userId` changes only then).
- The "Invite User" context-menu item must be disabled when no employee is checked (task §7, explicit).

## Ambiguities
None blocking. Invitation TTL is a documented default (see Business Logic), not user-confirmed.
