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
| `audit_logs` | `(entity_type, entity_id)` | composite | Look up all audit entries for one record. |
| `audit_logs` | `performed_by_user_id` | non-unique | Look up all actions by one user. |
| `audit_logs` | `created_at` | non-unique | Chronological pagination and future retention cleanup. |

## Search
- Employee list search (free-text over name/code/email) starts as `ILIKE` filtering without a dedicated index; a trigram (`pg_trgm`) index is a candidate optimization if search performance becomes a problem, not part of the initial implementation.

## Pending Decisions
- Whether full-text/trigram search is needed for the employee list.
- Retention-driven partitioning or pruning strategy for `audit_logs` at scale.
