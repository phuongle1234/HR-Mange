---
id: DB-ORGANIZATION-TYPE
type: database
module: organization-type
status: draft
---

# OrganizationType Entity

## Purpose
Store configurable organization type records used by Organization screens and future organization hierarchy workflows.

## Dependencies
- `DB-CONVENTIONS`
- `DB-USER`
- `API-ORGANIZATION-TYPE-LIST`
- `API-ORGANIZATION-TYPE-BY-IDS`
- `API-ORGANIZATION-TYPE-CREATE-MANY`
- `API-ORGANIZATION-TYPE-UPDATE-MANY`
- `API-ORGANIZATION-TYPE-DELETE-MANY`

## Requirements
- `name` must be unique so organization type labels cannot be duplicated.
- `description` is optional.
- The record must track who created and last updated it.
- Delete is hard delete for this phase.
- If a future `Organization` foreign key references `OrganizationType`, the relationship must use restrict-on-delete unless a later spec explicitly approves cascading or nulling behavior.

## Design

### Table
`organization_types`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default generated | Follows `DB-CONVENTIONS`; unlike `Organization`, this entity does not use an integer PK exception. |
| `name` | `varchar(100)` | unique, not null | Trimmed before persistence. |
| `description` | `text` | nullable | Empty string from API should be normalized to `null`. |
| `createdByUserId` | `uuid` | nullable, FK -> `users.id` | Set by controller from current user when available. |
| `updatedByUserId` | `uuid` | nullable, FK -> `users.id` | Set by controller from current user when available. |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

### Relationships
- `OrganizationType N-1 User` via `createdByUserId` (nullable).
- `OrganizationType N-1 User` via `updatedByUserId` (nullable).
- `OrganizationType 1-N AuditLog` is polymorphic via `AuditLog.entityType = 'ORGANIZATION_TYPE'` and `AuditLog.entityId = organization_types.id`, not a database FK.
- No current database FK from `organizations` to `organization_types` exists in this phase.

## Indexes
- Unique index on `name`.
- Default primary-key index on `id`.
- Optional non-unique index on `createdAt` if list sorting by creation date becomes slow.

## Validation
- `name`: required, trimmed, max 100 chars, unique.
- `description`: optional, trimmed, max 1000 chars at API level, stored as nullable text.
- Bulk create/update/delete API calls accept 1 to 100 items or ids.

## Test Notes
- Migration should create `organization_types` with UUID PK and unique `name`.
- Duplicate `name` should be translated to a safe `ORGANIZATION_TYPE_NAME_EXISTS` error.
- Delete should remove the row physically.

## Ambiguities
None blocking. This spec intentionally resolves the plan's open decisions: UUID id, unique name, optional description, max bulk size 100, and hard delete for the current phase.
