---
id: DB-INDEXES
type: database
module: global
status: draft
---

# Indexes

## Purpose
List the indexes each entity needs, based on the query patterns in the API specs.

## Indexes
| Table | Index | Type | Reason |
| --- | --- | --- | --- |
| `users` | `email` | unique | Login lookup (`POST /api/auth/login`). |
| `employees` | `employee_code` | unique | Uniqueness check on create/update. |
| `employees` | `email` | unique | Uniqueness check on create/update. |
| `employees` | `status` | non-unique | List filter by status. |
| `employees` | `(status, created_at)` | composite | Supports the list endpoint's default filter + sort together. |
| `organization_types` | `name` | unique | Uniqueness check on create/update and prevents duplicate labels. |
| `organization_types` | `created_at` | non-unique | Supports default list sorting. |
| `organizations` | `code` | unique | New (2026-08-26) — the column was already declared unique in the Prisma schema, but had no explicit row in this table until now; recorded for completeness since this file's Purpose is "based on the query patterns in the API specs" and `docs/06-api/organization/*.md` now documents create/update conflict handling on `code`. |
| `organizations` | `organization_type_id` | non-unique | New (2026-08-26). Supports filtering the Organization list by type and the `ON DELETE RESTRICT` check when deleting an `OrganizationType`. |
| `employees` | `organization_id` | non-unique | New (2026-08-26). Supports filtering the Employee list by organization and the bulk table editor's per-organization employee counts, if needed later. |
| `employees` | `user_id` | unique | New (2026-08-26). Enforces the 1:1 Employee-User link and backs the "does this employee already have an account" check in `API-INVITATIONS-CREATE`. |
| `invitations` | `token_hash` | unique | New (2026-08-26). Accept-flow lookup (`API-AUTH-INVITATIONS-ACCEPT`). |
| `workflows` | `code` | unique | New (2026-08-28, `WORK-028`). Stable business key; backs the `WORKFLOW_CODE_EXISTS` conflict. |
| `workflows` | `status` | non-unique | New (2026-08-28). The submit picker lists only `ACTIVE` workflows. |
| `workflow_steps` | `workflow_id` | non-unique | New (2026-08-28). Loading a workflow's chain, and the replace-chain delete. |
| `workflow_steps` | `parent_id` | non-unique | New (2026-08-28). Walking the chain in both directions — child lookup on APPROVE, parent lookup on FEEDBACK. |
| `workflow_steps` | `organization_type_id` | non-unique | New (2026-08-28). Backs the `ON DELETE RESTRICT` check when deleting an organization type, and the inbox's first-stage narrowing. |
| `workflow_requests` | `employee_id` | non-unique | New (2026-08-28). `scope=mine` list. |
| `workflow_requests` | `current_step_id` | non-unique | New (2026-08-28). Inbox candidate lookup. |
| `workflow_requests` | `status` | non-unique | New (2026-08-28). Status filter, and the in-flight check that blocks replace-chain. |
| `workflow_requests` | `workflow_id` | non-unique | New (2026-08-28). `workflowId` filter and the in-flight check. |
| `workflow_histories` | `workflow_request_id` | non-unique | New (2026-08-28). Timeline read for one request. |
| `workflow_histories` | `(workflow_request_id, created_at)` | composite | New (2026-08-28). The timeline is always ordered ascending by `created_at` within one request, so the composite serves the whole query. |
| `notifications` | `recipient_employee_id` | non-unique | New (2026-08-28). A recipient's notification list. |
| `notifications` | `(recipient_employee_id, is_read)` | composite | New (2026-08-28). Unread-count query behind the header bell badge. |
| `invitations` | `employee_id` | non-unique | New (2026-08-26). List invitations per employee / re-invite eligibility checks. |
| `invitations` | `status` | non-unique | New (2026-08-26). Mail-listener and future expiry-sweep queries. |
| `audit_logs` | `(entity_type, entity_id)` | composite | Look up all audit entries for one record. |
| `audit_logs` | `performed_by_user_id` | non-unique | Look up all actions by one user. |
| `audit_logs` | `created_at` | non-unique | Chronological pagination and future retention cleanup. |

## Search
- Employee list search over name/code/email starts as `ILIKE` filtering without a dedicated index; a trigram (`pg_trgm`) index is a candidate optimization if search performance becomes a problem.
- OrganizationType list search over name/description starts as `ILIKE` filtering without a dedicated index; a trigram (`pg_trgm`) index is a candidate optimization if search performance becomes a problem.

## Pending Decisions
- Whether full-text/trigram search is needed for employee or organization type list pages.
- Retention-driven partitioning or pruning strategy for `audit_logs` at scale.
