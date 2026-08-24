---
id: WORK-019
type: workflow
module: organization-type
status: draft
depends_on:
  - DB-ORGANIZATION-TYPE
  - API-ORGANIZATION-TYPE-LIST
  - API-ORGANIZATION-TYPE-BY-IDS
  - API-ORGANIZATION-TYPE-CREATE-MANY
  - API-ORGANIZATION-TYPE-UPDATE-MANY
  - API-ORGANIZATION-TYPE-DELETE-MANY
  - FRONTEND-ORGANIZATION-TYPE-LIST
  - FRONTEND-ORGANIZATION-TYPE-CREATE
  - FRONTEND-ORGANIZATION-TYPE-UPDATE
---

# WORK-019: OrganizationType API Contract Specs

## Work Status
`IMPLEMENTED` - contract specs were created so backend and frontend agents can work independently from the same source of truth.

## Summary
Define the OrganizationType database, API, and frontend contract before backend/frontend implementation starts. This work item is the coordination point for parallel AI work: the backend agent and frontend agent both read these specs instead of depending on each other's source code.

## Scope
In scope:
- Database spec for `OrganizationType`.
- API specs for list, find-by-ids, create-many, update-many, and delete-many.
- Frontend page specs for list, create, and update pages.
- Global spec updates so routes, API client, DB indexes, DB relationships, and error mappings mention OrganizationType.

Out of scope:
- NestJS implementation.
- Prisma migration.
- React implementation.
- Runtime integration testing.

## Dependencies
- Plan: `docs/09-workflow/plans/organization-type-parallel-contract-plan.md`.
- Task source: `docs/09-workflow/daily-tasks/2026-08-24.md`.
- Specs:
  - `docs/04-database/entities/organization-type.md`
  - `docs/06-api/organization-type/*.md`
  - `docs/07-frontend/pages/organization-type-*.md`

## Implementation Notes
Resolved contract decisions:
- `OrganizationType.id` uses UUID.
- `name` is required, unique, trimmed, max 100 chars.
- `description` is optional, trimmed, max 1000 chars, empty string normalized to `null`.
- Bulk request size is 1 to 100 items or ids.
- API base path is `/api/organization-types`.
- Update handoff uses Redux key `organization_type_checked`.
- Backend must add `BaseService.findByIds(ids)`.
- Frontend can build against typed services and mocks before backend exists.

## Test Plan
- No runtime tests required for this spec-only work item.
- Review all created specs for:
  - endpoint method/path consistency
  - request/response DTO consistency
  - error code consistency
  - frontend route and query-key clarity
  - absence of blocking ambiguities

## Test Result
NOT RUN - spec-only work item; no implementation tests were requested.

## Risks / Ambiguities
- Existing unrelated worktree changes were present while this item was created and were not touched.
- Future implementation must keep specs synchronized if backend/frontend discovers a real conflict.
