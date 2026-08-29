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
| `Workflow` | `User` | N-1 | `createdByUserId` | Nullable; who created the definition. New (2026-08-28, `WORK-028`). `ON DELETE SET NULL`. |
| `WorkflowStep` | `Workflow` | N-1 | `workflowId` | Not null. New (2026-08-28). `ON DELETE CASCADE` — deleting a definition removes its chain. |
| `WorkflowStep` | `WorkflowStep` | N-1 | `parentId` | Nullable, self-referencing. New (2026-08-28). `ON DELETE CASCADE`. **The only chain source** — `null` marks the root (first approver); `stepOrder` is display ordering and is never used to compute the next step. The chain is a linked list (one child per step), which is what makes "FEEDBACK descends exactly one level" unambiguous. |
| `WorkflowStep` | `OrganizationType` | N-1 | `organizationTypeId` | Not null. New (2026-08-28). `ON DELETE RESTRICT` — a type in use by a chain cannot be deleted. This FK **is** the authority model: `WorkflowStep.name` is a display label and is never read by engine logic. |
| `WorkflowRequest` | `Workflow` | N-1 | `workflowId` | Not null. New (2026-08-28). `ON DELETE RESTRICT`. |
| `WorkflowRequest` | `Employee` | N-1 | `employeeId` | Not null; the requester. New (2026-08-28). `ON DELETE RESTRICT`. |
| `WorkflowRequest` | `WorkflowStep` | N-1 | `currentStepId` | Nullable. New (2026-08-28). `ON DELETE RESTRICT`. `null` **only** when the request is terminal (`APPROVED`/`REJECTED`/`CANCELLED`). |
| `WorkflowHistory` | `WorkflowRequest` | N-1 | `workflowRequestId` | Not null. New (2026-08-28). `ON DELETE CASCADE`. |
| `WorkflowHistory` | `WorkflowStep` | N-1 | `workflowStepId` | Nullable. New (2026-08-28). `ON DELETE RESTRICT`. `null` for `SUBMIT`/`RESUBMIT`/`CANCEL`, which the requester performs at no step. |
| `WorkflowHistory` | `Employee` | N-1 | `employeeId` | Not null; the actor. New (2026-08-28). `ON DELETE RESTRICT`. |
| `Notification` | `Employee` | N-1 | `recipientEmployeeId` | Not null. New (2026-08-28). `ON DELETE CASCADE`. `referenceId` is deliberately a plain string, **not** an FK, so notifications stay usable by future non-workflow sources. |
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

Workflow (1) --< workflowId -- (N) WorkflowStep
WorkflowStep (1) --< parentId (self, nullable) -- (N) WorkflowStep     [linked list: at most one child]
OrganizationType (1) --< organizationTypeId -- (N) WorkflowStep        [the authority model]
Workflow (1) --< workflowId -- (N) WorkflowRequest
Employee (1) --< employeeId -- (N) WorkflowRequest                     [the requester]
WorkflowStep (1) --< currentStepId (nullable) -- (N) WorkflowRequest   [null only when terminal]
WorkflowRequest (1) --< workflowRequestId -- (N) WorkflowHistory       [immutable, insert-only]
WorkflowStep (1) --< workflowStepId (nullable) -- (N) WorkflowHistory  [null for SUBMIT/RESUBMIT/CANCEL]
Employee (1) --< employeeId -- (N) WorkflowHistory                     [the actor]
Employee (1) --< recipientEmployeeId -- (N) Notification
Notification.referenceId --> workflow request id, deliberately no FK constraint
```

Workflow entities are **excluded from the shared `AuditLog`** by design: `WorkflowHistory` is a richer, domain-specific, immutable trail, and duplicating it into `audit_logs` would create two half-authoritative histories. Workflow services pass `entityType: null` to `BaseService`, and nothing is added to `AuditEntityType`/`AuditAction`/`AuditLogListener`.

## Ambiguities
None blocking. If `AuditLog` ever needs entity-specific FK columns beyond the polymorphic pair, that is a future, separate change.
