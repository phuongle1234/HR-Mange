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
| `OrganizationType` | `User` | N-1 | `createdByUserId` | Nullable; who created the record. |
| `OrganizationType` | `User` | N-1 | `updatedByUserId` | Nullable; who last updated the record. |
| `AuditLog` | `User` | N-1 | `performedByUserId` | Nullable; system-triggered actions may have no actor. |
| `AuditLog` | polymorphic entity | N-1 | `entityType` + `entityId` | Not a database foreign key. `entityType` identifies the source entity (`EMPLOYEE`, `ORGANIZATION`, `ORGANIZATION_TYPE`); `entityId` is that entity's id. No referential integrity constraint is enforced across entity types. |

## Diagram (Text)
```text
User (1) --< createdByUserId -- (N) Employee
User (1) --< updatedByUserId -- (N) Employee
User (1) --< createdByUserId -- (N) OrganizationType
User (1) --< updatedByUserId -- (N) OrganizationType
User (1) --< performedByUserId -- (N) AuditLog
AuditLog.entityType + AuditLog.entityId --> polymorphic reference, no FK constraint
```

## Ambiguities
None blocking. If `AuditLog` ever needs entity-specific FK columns beyond the polymorphic pair, that is a future, separate change.
