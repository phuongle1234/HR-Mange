---
id: DB-INVITATION
type: database
module: invitations
status: draft
---

# Invitation Entity

Source: `docs/09-workflow/daily-tasks/2026-08-26.md` §§12-22. Entirely new entity — no prior spec or code references invitations anywhere in this project.

## Purpose
Store one row per employee invited to create a login account, backing the bulk "Invite User" flow from the Employee list and the token-based accept flow that turns an `Employee` into a `User`.

## Dependencies
- `DB-EMPLOYEE`, `DB-USER`, `DB-CONVENTIONS`
- `API-INVITATIONS-CREATE`, `API-AUTH-INVITATIONS-ACCEPT`

## Requirements
- Each `Invitation` belongs to exactly one `Employee` (`employeeId`, required).
- Raw invitation tokens are never persisted — only `tokenHash` (per task §13: "Database chỉ lưu `tokenHash`"). The raw token exists only transiently, to build the invitation URL and the email.
- Tokens are generated with Node's `crypto.randomBytes` (cryptographically secure), never `Math.random()` (task §13, explicit).
- An `Employee` that already has `userId` set (already has a login account) must not receive a new invitation — enforced at the API layer (`API-INVITATIONS-CREATE`), not by a database constraint, since a past `ACCEPTED`/`EXPIRED` invitation row must still be retained for history.
- Invitation creation and email sending are two different states (task §21: "Invitation đã create và Mail gửi thất bại là hai trạng thái khác nhau") — the row's existence must never depend on whether the email actually sent.
- Delete strategy: no delete endpoint is in scope for this phase. Invitation rows are retained indefinitely (audit/history trail for who was invited, when, and by whom the underlying employee record was last touched). This is a recorded decision, not a silent omission — revisit if retention/privacy requirements are added later.

## Design

### Table
`invitations`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default generated | Follows `DB-CONVENTIONS`. |
| `employeeId` | `uuid` | not null, FK → `employees.id`, `ON DELETE CASCADE` | Hard-deleting an `Employee` (per `WORK-000` decision #3) removes its invitation history too — there is nothing meaningful left to retain once the employee row itself is gone. |
| `email` | `varchar(255)` | not null | Snapshot of `Employee.email` at invitation time (not a live FK to it) — if the employee's email changes later, the already-sent invitation must keep pointing at the address the mail actually went to. |
| `tokenHash` | `varchar(255)` | unique, not null | SHA-256 (or equivalent) hash of the raw token. The raw token is never stored. |
| `expiresAt` | `timestamptz` | not null | Set at creation time; see `API-INVITATIONS-CREATE` for the TTL value. |
| `acceptedAt` | `timestamptz` | nullable | Set when the invitation is accepted. |
| `status` | `InvitationStatus` enum | not null, default `PENDING` | Values: `PENDING`, `SENT`, `ACCEPTED`, `EXPIRED`, `SEND_FAILED` (task §22). |
| `sentAt` | `timestamptz` | nullable | Set by the mail listener after a successful send attempt. |
| `sendAttempts` | `int4` | not null, default `0` | Incremented on every send attempt (success or failure). |
| `lastSendError` | `text` | nullable | Safe, non-sensitive error summary from the last failed send attempt. Never contains the raw token or full SMTP response (see `API-CONVENTIONS`'s logging rules). |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

There is no `createdByUserId`/`updatedByUserId` pair on this entity — invitations are actor-tracked implicitly through the `invitation.created` audit event (see `API-INVITATIONS-CREATE`), and there is no "update an invitation" API in this phase.

### Relationships
- `Invitation N—1 Employee` via `employeeId` (not null, `ON DELETE CASCADE`).
- `Invitation 1—N AuditLog` — polymorphic via `AuditLog.entityType = 'INVITATION'` and `AuditLog.entityId = invitations.id`, not a database FK, same pattern as the other entities.

## Status Lifecycle
```text
PENDING (row created, before the mail listener runs)
   |
   +-- send succeeds --> SENT --> (accept flow) --> ACCEPTED
   |
   +-- send fails --> SEND_FAILED
   |
   +-- expiresAt passes without acceptance --> EXPIRED
```
- `PENDING -> SENT`: set by `InvitationMailListener` after `MailService.sendInvitation()` resolves successfully; also sets `sentAt`, increments `sendAttempts`.
- `PENDING -> SEND_FAILED`: set by `InvitationMailListener` after a send failure; sets `lastSendError`, increments `sendAttempts`. Retry behavior (automatic retry vs. manual re-trigger) is out of scope for this phase — see Ambiguities.
- `SENT -> ACCEPTED`: set by `API-AUTH-INVITATIONS-ACCEPT` on successful accept; sets `acceptedAt`.
- `-> EXPIRED`: not an active transition performed by a background job in this phase. `expiresAt < now()` is checked on-read by the accept endpoint (an expired-but-still-`PENDING`/`SENT` row is treated as expired at accept time); a value of `EXPIRED` written to the `status` column itself is reserved for a future scheduled sweep job, out of scope here.

## Validation
- `employeeId`: required, must reference an existing `employees.id` whose `userId IS NULL` at invitation-creation time (enforced in the service, not the DB).
- `email`: required, valid email format (copied from the referenced `Employee.email`, not independently user-supplied).
- `tokenHash`: required, unique, generated server-side — never accepted as API input.
- `expiresAt`: required, must be in the future at creation time.
- `status`: must be one of `InvitationStatus`; defaults to `PENDING`.

## Indexes
See `DB-INDEXES` for the full table — summarized here: unique index on `tokenHash` (accept-flow lookup), non-unique index on `employeeId` (list invitations per employee / re-invite checks), non-unique index on `status` (mail-listener and future expiry-sweep queries).

## Test Notes
- Migration creates `invitations` with UUID PK, `InvitationStatus` enum, and the FK/cascade behavior above.
- Creating an invitation for an employee that already has `userId` set must be rejected before any row is written.
- Accepting with an expired `expiresAt` must fail even if `status` is still `PENDING`/`SENT` (no sweep job has run).
- Accepting the same token twice must fail the second time (`status = ACCEPTED` already).
- Deleting an `Employee` removes its `Invitation` rows (cascade) — verify no orphaned rows remain.

## Ambiguities
None blocking implementation of this phase's explicit scope. Flagged, not silently decided:
- No automatic retry or scheduled expiry-sweep job is specified (task §23 explicitly says a queue/outbox pattern is not required now). `SEND_FAILED` and expired-but-still-`PENDING` rows require a manual re-invite (a new `Invitation` row via `POST /api/invitations` again) rather than an in-place retry — there is no "resend" endpoint in this phase.
- Invitation TTL (`expiresAt` duration) is not specified by the daily task. `API-INVITATIONS-CREATE` records a default; treat it as a default, not a user-confirmed value, same convention as the employee status enum in `DB-EMPLOYEE`.
