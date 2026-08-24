---
id: WORK-020
type: workflow
module: organization-type
status: draft
depends_on:
  - WORK-019
---

# WORK-020: OrganizationType Backend

## Work Status
`APPROVED` - ready for a backend AI agent to implement after reading the required specs.

## Summary
Implement the NestJS/Prisma backend for OrganizationType according to the completed API contract. This work can run in parallel with `WORK-021` because both depend only on `WORK-019`.

## Scope
In scope:
- Add Prisma `OrganizationType` model and migration.
- Add inherited `BaseService.findByIds(ids)`.
- Add OrganizationType error codes and exceptions.
- Add audit entity/action constants and listener mapping for OrganizationType.
- Add `organization-type` NestJS module, controller, service, interface, and DTOs.
- Add manual `.http` request file for all OrganizationType endpoints.

Out of scope:
- React/frontend implementation.
- Changing Organization chart behavior.
- Changing existing Employee behavior unless a direct compile/runtime conflict requires it and specs are updated.

## Dependencies
Required specs to read before coding:
- `docs/00-project/*`
- `docs/01-business/*`
- `docs/02-solution/*`
- `docs/03-technology/*`
- `docs/04-database/*`
- `docs/06-api/*`
- `docs/09-workflow/plans/organization-type-parallel-contract-plan.md`
- `docs/work/WORK-019-organization-type-api-contract.md`

Primary contract specs:
- `docs/04-database/entities/organization-type.md`
- `docs/06-api/organization-type/list-organization-types.md`
- `docs/06-api/organization-type/get-organization-types-by-ids.md`
- `docs/06-api/organization-type/create-organization-types.md`
- `docs/06-api/organization-type/update-organization-types.md`
- `docs/06-api/organization-type/delete-organization-types.md`

## Implementation Notes
- Controller routes must exactly match:
  - `GET /api/organization-types`
  - `POST /api/organization-types/by-ids`
  - `POST /api/organization-types`
  - `PATCH /api/organization-types`
  - `DELETE /api/organization-types`
- All routes require `JwtAuthGuard`.
- No permission checks.
- `BaseService.findByIds(ids)` must preserve incoming id order for existing rows.
- `updateMany` endpoint uses inherited `BaseService.updateMany(items, actorUserId)` with per-row `{ id, data }` items.
- `deleteMany` endpoint should validate ids in DTO, confirm existence with `findByIds(ids)`, then call inherited `BaseService.deleteMany(ids, actorUserId)`.
- Translate duplicate `name` conflicts to `ORGANIZATION_TYPE_NAME_EXISTS`.
- Request validation must live in DTO classes or reusable DTO validators. Do not validate duplicate `items[].name`, duplicate ids, or missing mutable update fields in `OrganizationTypeController`.

## Test Plan
- Do not create or run unit tests unless the user explicitly asks for UT in the implementation request.
- Recommended manual verification when implementation is requested:
  - run TypeScript build
  - run Prisma migration/apply command appropriate for current DB state
  - exercise all endpoints with the `.http` file
  - verify audit log rows for create/update/delete

## Test Result
NOT RUN - backend implementation not started.

## Risks / Ambiguities
- Existing database drift should be handled carefully; do not use destructive reset unless user explicitly approves.
- If implementation discovers that `BaseService.findByIds` cannot be fully generic for all delegates, document the limitation and update the spec before changing contract behavior.
