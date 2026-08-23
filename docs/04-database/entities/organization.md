---
id: DB-ORGANIZATION
type: database
module: organization
status: draft
---

# Organization Entity

## Purpose
Store the self-referencing organization hierarchy (company/branch/division/department/team) used by the Organization bulk API (`createMany`/`updateMany`/`getAll`/`deleteMany` — no single create/findOne/update/delete route in this phase).

## Dependencies
- `DB-CONVENTIONS`, `DB-USER`

## Deviation from DB-CONVENTIONS
`DB-CONVENTIONS` mandates UUID primary keys ("Auto-increment integer IDs are not used"). `Organization.id` is a deliberate, recorded exception: `Int @default(autoincrement())`, per an explicit decision for this entity (source: `docs/09-workflow/daily-tasks/2026-08-23.md`, confirmed with the user during planning). `docs/04-database/conventions.md`'s Primary Keys section cross-references this file.

Because of this, `BaseService`'s audit-event `entityId` extraction converts the row id via `String(id)` rather than assuming it is already a string (see `backend/src/common/services/base.service.ts`'s `idOf` helper) — needed so this entity's numeric ids still produce a valid `AuditLog.entityId` (a string column).

## Design

### Table
`organizations`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `int4` | PK, auto-increment | See "Deviation from DB-CONVENTIONS" above. |
| `code` | `varchar(50)` | unique, not null | |
| `name` | `varchar(255)` | not null | |
| `description` | `text` | nullable | Free text. |
| `parentId` | `int4` | nullable, FK → `organizations.id`, `ON DELETE SET NULL` | Self-referencing hierarchy. |
| `type` | `OrganizationType` enum | not null, default `DEPARTMENT` | Values: `COMPANY`, `BRANCH`, `DIVISION`, `DEPARTMENT`, `TEAM`. |
| `sortOrder` | `int4` | not null, default `0` | Display order among siblings. |
| `isActive` | `boolean` | not null, default `true` | |
| `createdByUserId` | `uuid` | nullable | No FK constraint declared (kept consistent with `Employee`'s pattern of tracking the actor without enforcing referential integrity at this layer). |
| `updatedByUserId` | `uuid` | nullable | Same as above. |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

### Relationships
- `Organization N—1 Organization` via `parentId` (`parent`/`children`, self-referencing, `ON DELETE SET NULL` — deleting a parent detaches its children rather than cascading the delete).
- `Organization 1—N AuditLog` — polymorphic via `AuditLog.entityType = 'ORGANIZATION'` and `AuditLog.entityId = organizations.id` (stringified), not a database FK, same pattern as `Employee`.

## Validation
- `code`: required, unique, trimmed, max 50 chars.
- `name`: required, trimmed, max 255 chars.
- `description`: optional, free text.
- `parentId`: optional, must reference an existing `organizations.id` (enforced by the FK; not separately validated at the DTO layer in this phase).
- `type`: must be one of `OrganizationType`; defaults to `DEPARTMENT` on create if omitted.
- `sortOrder`: optional non-negative integer, defaults to `0`.
- `isActive`: optional boolean, defaults to `true`.

## Ambiguities
None blocking. Not yet decided (out of scope for this task, flagged for a future work item if needed):
- Whether `code` uniqueness conflicts during bulk `createMany`/`updateMany` should map to a clean 409 error, or are acceptable as the raw Prisma `P2002` error for now.
- Whether deleting an organization should cascade to descendants instead of just detaching direct children (current behavior: `parentId` is set to `NULL` on the affected rows only, one level, per Prisma's `onDelete: SetNull`).
