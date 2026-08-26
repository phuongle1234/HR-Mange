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
- `DB-CONVENTIONS`, `DB-USER`, `DB-ORGANIZATION-TYPE`

## Organization Type FK (Resolved — 2026-08-26 daily task)
`Organization` gets a new `organizationTypeId` FK to `OrganizationType`, closing the gap `DB-ORGANIZATION-TYPE` pre-flagged ("No current database FK from `organizations` to `organization_types` exists in this phase").

- **Additive, not a replacement.** The existing `type` enum column (`OrganizationChartType`: `COMPANY`/`BRANCH`/`DIVISION`/`DEPARTMENT`/`TEAM`) is kept as-is. The daily task asks for an `organizationTypeId` link but does not say to remove the enum, and removing it would be a breaking change to the existing bulk create/update DTOs and the org-chart frontend's local `OrganizationType` union — out of scope here. Recorded as an explicit decision, not a silent gap: a future task may deprecate `type` once `OrganizationType` adoption is complete; until then both fields coexist and are independent (no sync/derivation between them).
- `organizationTypeId` is **nullable**, for the same reason `Employee.organizationId` is nullable: existing organizations have no `OrganizationType` row to reference yet, and the migration rule ("must not lose data") rules out forcing a backfill guess.
- `ON DELETE RESTRICT` — per `DB-ORGANIZATION-TYPE`'s own pre-recorded requirement ("must use restrict-on-delete unless a later spec explicitly approves cascading or nulling"). Deleting an `OrganizationType` that is still referenced by any `Organization` row must fail at the database level; the API layer should translate that into a clean `409`/`400` rather than a raw Prisma error (see `API-ORGANIZATION-TYPE-DELETE-MANY` — updating that spec's conflict handling is in scope for the backend agent, not this contract).

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
| `type` | `OrganizationChartType` enum | not null, default `DEPARTMENT` | Values: `COMPANY`, `BRANCH`, `DIVISION`, `DEPARTMENT`, `TEAM`. Kept alongside `organizationTypeId` — see "Organization Type FK" above. |
| `organizationTypeId` | `uuid` | nullable, FK → `organization_types.id`, `ON DELETE RESTRICT` | New (2026-08-26). |
| `sortOrder` | `int4` | not null, default `0` | Display order among siblings. |
| `isActive` | `boolean` | not null, default `true` | |
| `createdByUserId` | `uuid` | nullable | No FK constraint declared (kept consistent with `Employee`'s pattern of tracking the actor without enforcing referential integrity at this layer). |
| `updatedByUserId` | `uuid` | nullable | Same as above. |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

### Relationships
- `Organization N—1 Organization` via `parentId` (`parent`/`children`, self-referencing, `ON DELETE SET NULL` — deleting a parent detaches its children rather than cascading the delete).
- `Organization N—1 OrganizationType` via `organizationTypeId` (nullable, `ON DELETE RESTRICT`). New (2026-08-26).
- `Organization 1—N Employee` via `Employee.organizationId` (nullable, `ON DELETE SET NULL` on the `Employee` side). New (2026-08-26).
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
