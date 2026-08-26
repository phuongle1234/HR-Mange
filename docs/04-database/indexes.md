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
