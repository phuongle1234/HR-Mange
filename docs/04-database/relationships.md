---
id: DB-RELATIONSHIPS
type: database
module: global
status: draft
---

# Relationships

No Department relationship exists (per `WORK-000` decision #1: Department was removed from scope).

## Purpose
Describe how the draft entities relate to each other.

## Relationship Map
| From | To | Cardinality | FK Column | Notes |
| --- | --- | --- | --- | --- |
| `Employee` | `User` | N-1 | `createdByUserId` | Nullable; who created the record. |
| `Employee` | `User` | N-1 | `updatedByUserId` | Nullable; who last updated the record. |
| `Employee` | `User` | 1-1 | `userId` | Nullable, unique. New (2026-08-26). The employee's own login account (set by invitation-accept), distinct from the audit `createdByUserId`/`updatedByUserId`. `ON DELETE SET NULL`. |
| `Employee` | `Organization` | N-1 | `organizationId` | Nullable. New (2026-08-26). `ON DELETE SET NULL`. |
| `Invitation` | `Employee` | N-1 | `employeeId` | Not null. New (2026-08-26). `ON DELETE CASCADE`. |
| `Organization` | `Organization` | N-1 | `parentId` | Nullable; self-referencing hierarchy. `ON DELETE SET NULL`. |
| `Organization` | `OrganizationType` | N-1 | `organizationTypeId` | Nullable. New (2026-08-26). `ON DELETE RESTRICT`. |
| `OrganizationType` | `User` | N-1 | `createdByUserId` | Nullable; who created the record. |
| `OrganizationType` | `User` | N-1 | `updatedByUserId` | Nullable; who last updated the record. |
| `AuditLog` | `User` | N-1 | `performedByUserId` | Nullable; system-triggered actions may have no actor. |
| `AuditLog` | polymorphic entity | N-1 | `entityType` + `entityId` | Not a database foreign key. `entityType` identifies the source entity (`EMPLOYEE`, `ORGANIZATION`, `ORGANIZATION_TYPE`, `INVITATION`); `entityId` is that entity's id. No referential integrity constraint is enforced across entity types. |

## Diagram (Text)
```text
User (1) --< createdByUserId -- (N) Employee
User (1) --< updatedByUserId -- (N) Employee
User (1) --< userId (1:1, nullable) -- Employee
Organization (1) --< organizationId (nullable) -- (N) Employee
Employee (1) --< employeeId -- (N) Invitation
Organization (1) --< parentId (self, nullable) -- (N) Organization
OrganizationType (1) --< organizationTypeId (nullable) -- (N) Organization
User (1) --< createdByUserId -- (N) OrganizationType
User (1) --< updatedByUserId -- (N) OrganizationType
User (1) --< performedByUserId -- (N) AuditLog
AuditLog.entityType + AuditLog.entityId --> polymorphic reference, no FK constraint
```

## Ambiguities
None blocking. If `AuditLog` ever needs entity-specific FK columns beyond the polymorphic pair, that is a future, separate change.
