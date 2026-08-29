---
id: API-AUTH-INVITATIONS-ACCEPT
type: api
module: invitations
status: draft
depends_on:
  - DB-INVITATION
  - DB-EMPLOYEE
  - DB-USER
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
  - API-AUTHENTICATION
---

# Accept Invitation

## API
- Method: `POST`
- URL: `/api/auth/invitations/accept`
- Status: draft

Route is under `/api/auth`, per the daily task's own explicit contract (task §28), even though the underlying `Invitation` row lives in the `invitations` module — this endpoint turns an `Employee` into a `User` (creates a login account), which is conceptually an auth-boundary operation, not a CRUD read/write on the invitation itself.

**Implemented as:** `InvitationAcceptController` (`backend/src/modules/invitations/controller/invitation-accept.controller.ts`), declared `@Controller('auth/invitations')` with `@Post('accept')`, registered in `InvitationsModule`.

It is a separate controller rather than a method on `InvitationsController` because that class applies `@UseGuards(JwtAuthGuard)` at class level, and this endpoint must stay unauthenticated. Adding it there would have required either a per-route guard override or making the whole controller public — both worse than one small dedicated controller.

## Authentication
- Required: **no** — the caller is not authenticated yet; the `token` in the request body is the credential.

## Authorization
- None. Possession of a valid, unexpired, unaccepted token is the only check.

## DTO And Field Validation
DTO name: `AcceptInvitationDto`

| Field | Required | Validation |
| --- | --- | --- |
| `token` | yes | non-empty string |
| `password` | yes | same password policy as `API-AUTH-CHANGE-PASSWORD`'s `newPassword` — min 8 chars, at least one letter and one number (`WORK-000` decision #6 default) |
| `confirmPassword` | yes | must match `password` |

## Business Logic
Follows task §28's flow exactly:

1. Validate body (including `confirmPassword === password`, same pattern as `API-AUTH-CHANGE-PASSWORD`).
2. Hash the incoming raw `token` the same way it was hashed at creation time; look up `Invitation` by `tokenHash`.
3. If no row matches → `404 INVITATION_TOKEN_INVALID`.
4. If `invitation.status === 'ACCEPTED'` → `409 INVITATION_ALREADY_ACCEPTED`.
5. If `invitation.expiresAt < now()` → `410 INVITATION_EXPIRED` (checked on-read here, since no background sweep job writes `status: EXPIRED` in this phase — see `DB-INVITATION`'s Status Lifecycle).
6. Load the `Employee` referenced by `invitation.employeeId`.
7. If `employee.userId IS NOT NULL` → `409 USER_ALREADY_EXISTS` (defensive — should already be prevented at invite-creation time, but the employee could theoretically have accepted a different invitation in between).
8. Hash `password` with the project's existing `bcryptjs` pattern (same as login/change-password).
9. Inside one transaction:
   - Create a `User` row (`email` from `invitation.email`, `passwordHash`, `fullName` from the employee's `firstName`/`lastName`, `isActive: true`).
   - Set `employee.userId = createdUser.id`.
   - Set `invitation.status = 'ACCEPTED'`, `invitation.acceptedAt = now()`.
10. Commit.
11. Return success. Do not return an access token in this response — the task's flow (§28) redirects to `/login` after success, it does not log the new user in directly.

## Database Interaction
- `prisma.invitation.findUnique({ where: { tokenHash } })`
- `prisma.employee.findUnique({ where: { id: invitation.employeeId } })`
- Transaction: `prisma.user.create(...)`, `prisma.employee.update({ where: { id }, data: { userId } })`, `prisma.invitation.update({ where: { id }, data: { status: 'ACCEPTED', acceptedAt: now() } })`.

## Event Behavior
- None required by the daily task. Optionally, a future task could add an `entity.updated` event for the `Employee`/`User` change to keep the audit trail consistent with every other mutation in this codebase — left as an explicit follow-up, not implemented here, since the task does not ask for it and audit-logging a self-service account-creation flow raises its own actor-identity question (there is no authenticated `currentUser` performing this action) that this contract does not resolve.

## Audit Log Behavior
- None in this phase, for the same reason as Event Behavior above.
- **Never** log the raw or hashed token, or the password, at any point in this flow (`API-CONVENTIONS`'s logging rules).

## Request Body
```json
{
  "token": "a1b2c3d4e5f6...",
  "password": "NewPass123",
  "confirmPassword": "NewPass123"
}
```

## Common Response
```json
{
  "success": true,
  "message": "Account created successfully. You can now log in.",
  "data": null,
  "meta": null
}
```

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Not found (invalid token): `404 Not Found`
- Conflict (already accepted / user already exists): `409 Conflict`
- Gone (expired): `410 Gone`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed, including password policy or mismatch |
| `INVITATION_TOKEN_INVALID` | 404 | Token does not match any invitation (safe generic message — do not reveal whether a token was ever valid) |
| `INVITATION_EXPIRED` | 410 | Token matched but `expiresAt` has passed |
| `INVITATION_ALREADY_ACCEPTED` | 409 | Token matched but was already used |
| `USER_ALREADY_EXISTS` | 409 | The referenced employee already has a `userId` |

## Frontend Contract Notes
- Mutation key: `['auth', 'invitations', 'accept']`.
- Consumed by `FRONTEND-INVITATION-ACCEPT` (`/invitation/accept?token=...`).
- On success, redirect to `/login` (task §28, explicit) — do not auto-login.
- `INVITATION_TOKEN_INVALID`/`INVITATION_EXPIRED`/`INVITATION_ALREADY_ACCEPTED` all render as a page-level (not field-level) safe message, since none of them are about the password fields the user just typed.
- `VALIDATION_ERROR` maps to `password`/`confirmPassword` fields.

## Implementation Notes
- **Password rules are enforced in the service, not only the DTO.** `AcceptInvitationDto` checks the minimum length; the confirm-match and the full policy (letter + number) run in `acceptInvitation` via `satisfiesPasswordPolicy`, exactly as `AuthService.changePassword` already does. A mismatch yields `VALIDATION_ERROR` with a `confirmPassword` field error; a policy failure yields `PASSWORD_POLICY_FAILED`.
- **A missing `Employee` returns `INVITATION_TOKEN_INVALID`, not a 404 about the employee.** The invitation row cannot resolve to an account either way, and naming the employee would leak that a given token maps to a real record.
- **`$transaction` is used for the three-table write** (create `User`, set `employees.user_id`, close the invitation). This spans three delegates, so no single inherited `BaseService` method can express it — the same sanctioned narrow exception the workflow action engine uses. Every other write in `InvitationsService` still goes through inherited base methods.
- This endpoint is the **only** place `employees.user_id` is ever set. Until an employee has been through it, that employee's account cannot submit workflow requests (see `API-WORKFLOW-REQUEST-SUBMIT`'s Ambiguities).

## Ambiguities
None blocking. Whether this flow should also log the new user in directly (skip the `/login` redirect) is not specified by the daily task; this contract follows task §28's explicit flow (redirect to `/login`) rather than inventing an auto-login behavior.
