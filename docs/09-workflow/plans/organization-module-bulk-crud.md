# Organization module: createMany / updateMany / getAll / deleteMany

## Context
Task from `docs/09-workflow/daily-tasks/2026-08-23.md`: build a new `Organization` module (self-referencing hierarchy: company/branch/division/department/team) exposing exactly 4 endpoints — `createMany`, `updateMany`, `getAll`, `deleteMany` (no single create/findOne/update/delete route) — plus a `.http` file summarizing all the built APIs. The Prisma model was given directly by the user, including `id Int @id @default(autoincrement())`.

Decisions already confirmed with the user this session:
1. **Keep `Int @default(autoincrement())` as written** (not UUID) — even though `docs/04-database/conventions.md` says every table uses UUID. This is a deliberate, recorded exception for this entity.
2. **Do not touch `docs/work/WORK-000-resolve-pending-decisions.md`** — Organization is treated as unrelated to the old "Department" descope decision, no cross-reference added there.
3. **Minimal spec**: write only `docs/04-database/entities/organization.md` before coding (required by AGENTS.md Database Rules — "Database design must be specified before Prisma schema and migration"). Skip a `business-rules.md` and per-endpoint `docs/06-api/organization/*.md` — this task's source is the task file itself, not a full spec-first flow like Employee's.

## Required shared-file change: `entityId` must survive non-string PKs
`base.service.ts`'s `emit()` extracts `entityId` via `unsafeCoerce<{ id: string }>(entity).id` at 4 call sites (`create`, `createMany`, `update` via its own emit call, `updateMany`). This is a blind type cast, not a real conversion — for Organization's `Int` id, TypeScript would keep believing it's a `string` while the runtime value is a `number`, which is wrong to hand to `EntityCrudEvent`/`AuditLog.entityId` (a real string column).
- Fix: change those 4 extraction sites to `String(unsafeCoerce<{ id: unknown }>(entity).id)`. This is a no-op for Employee (UUID strings stringify to themselves) and correctly converts Organization's numbers. `delete`/`deleteMany` already take/produce string ids (`id: string` param, `BULK_ENTITY_ID_SENTINEL`) — untouched.
- This is the *only* change to already-existing shared files besides the two enum constants below — no other Employee-facing behavior changes.

## New files

### 1. Prisma schema (`backend/prisma/schema.prisma`)
Add `OrganizationType` enum and `Organization` model, using the fields the user gave, with `@db.VarChar` lengths added for consistency with `Employee`/`User` (`code` 50, `name` 255; `description` left as unconstrained `Text`-equivalent `String?`). Then run `npx prisma migrate dev --name add_organization` (requires the Postgres container running — verify with the user/`docker ps` at execution time; note in the report if the DB isn't reachable so migration has to be applied later).

### 2. Audit wiring (small additions, no new files)
- `common/constants/audit-action.constant.ts`: add `ORGANIZATION` to `AuditEntityType`; add `ORGANIZATION_CREATED`/`ORGANIZATION_UPDATED`/`ORGANIZATION_DELETED` to `AuditAction`.
- `modules/audit-log/listener/audit-log.listener.ts`: add one row to the existing `AUDIT_ACTION_BY_ENTITY` lookup table (`[AuditEntityType.ORGANIZATION]: { created, updated, deleted }`) — no new handler methods, the 3 generic `@OnEvent` handlers already cover it.

### 3. Exceptions (`common/exceptions/app.exception.ts`, `common/constants/error-code.constant.ts`)
Add `OrganizationNotFoundException` + `ErrorCode.ORGANIZATION_NOT_FOUND`, mirroring `EmployeeNotFoundException`. Required because `BaseService`'s constructor always takes a not-found-exception factory (used internally by `findOne`, and by `update`/`delete` on Prisma `P2025`) even though this module's controller won't expose the single-record routes that would normally trigger it.

### 4. `backend/src/modules/organization/` (new module, mirrors `employee/` structure minus repository/validators/events — none needed here)
```
organization/
├── organization.module.ts
├── controller/organization.controller.ts
├── service/organization.service.ts
├── interfaces/organization-service.interface.ts
└── dto/
    ├── create-organization.dto.ts
    ├── create-organizations.dto.ts     (wraps { items: CreateOrganizationDto[] } for POST body)
    ├── update-organization.dto.ts
    ├── update-organizations.dto.ts     (wraps { where: OrganizationFilterDto; data: UpdateOrganizationDto } for PATCH body)
    ├── delete-organizations.dto.ts     (wraps { where: OrganizationFilterDto } for DELETE body)
    └── organization-filter.dto.ts      (parentId?/type?/isActive? — reused for GET query AND as the `where` shape in the two DTOs above)
```

**Routes** (all under `JwtAuthGuard`, same as Employee):
| Method | Path | Body/Query | Service call |
| --- | --- | --- | --- |
| `GET /organizations` | query: `OrganizationFilterDto` | — | `findMany` (override, no pagination — returns the full filtered list, since org-chart data is normally fetched whole to build a tree client-side, not paged) |
| `POST /organizations` | body: `{ items: CreateOrganizationDto[] }` | — | `createMany` (inherited from `BaseService`, not redeclared) |
| `PATCH /organizations` | body: `{ where, data }` | — | `updateMany` (inherited, not redeclared) |
| `DELETE /organizations` | body: `{ where }` | — | `deleteMany` (inherited, not redeclared) |

**Service**: `OrganizationService extends BaseService<PrismaService['organization'], OrganizationFilterDto> implements IOrganizationService`. Only overrides `findMany`. Constructor: `super(prisma.organization, eventEmitter, AuditEntityType.ORGANIZATION, (id) => new OrganizationNotFoundException(id))`.

**Interface**: `IOrganizationService extends IBaseService<Organization, CreateOrganizationDto, UpdateOrganizationDto, OrganizationFilterDto>`, plus explicit `createMany`/`updateMany`/`deleteMany` signatures (these aren't on `IBaseService` yet — same reason Employee doesn't expose them either, per AGENTS.md: extend additively per-feature rather than growing the shared interface speculatively).

**Controller pattern** (matches the just-established Employee convention — controller builds the complete data object, `BaseService` never merges anything):
```ts
@Post()
async createMany(@Body() dto: CreateOrganizationsDto, @CurrentUser() user: CurrentUserPayload) {
  const items = dto.items.map((item) => ({ ...item, createdByUserId: user.id, updatedByUserId: user.id }));
  const organizations = await this.organizationService.createMany(items, user.id);
  ...
}
```
`updateMany` similarly merges `updatedByUserId: user.id` into `data` before calling the service.

### 5. `.http` file
`backend/test/http/organization/organization.http` — one combined file (per the task's explicit "tổng hợp" ask, unlike Employee's one-file-per-endpoint convention). Covers: createMany success, createMany validation error, getAll (no filter + with `type`/`isActive`/`parentId` filters), updateMany, deleteMany, missing-token 401.

### 6. `docs/04-database/entities/organization.md`
Mirrors `docs/04-database/entities/employee.md`'s structure (Purpose/Dependencies/Requirements/Design/Fields/Relationships/Validation/Ambiguities). Explicitly documents the `Int` PK as a recorded deviation from `DB-CONVENTIONS`, not a silent inconsistency. Also add a one-line "Exceptions" note to `docs/04-database/conventions.md`'s Primary Keys section pointing at this entity, so the global convention doc doesn't read as unconditionally true anymore.

## Known gap I'm flagging, not solving (per Debugging Rules — surfacing, not fixing unannounced)
`createMany`/`updateMany` have no try/catch in `BaseService` (unlike single `update`/`delete`, which already catch Prisma `P2025`). A duplicate `code` during bulk create/update would throw Prisma's raw `P2002` unhandled, producing a generic 500 instead of a clean 4xx error. I'm not adding conflict handling for this now (out of the task's stated scope) — flagging it here so it's a visible, deliberate gap rather than a silent one. Say the word if you want it handled now or later.

## Also noticed, not touched (existing drift, unrelated to this task)
`backend/test/http/employee/create-employee.http` still references `EMPLOYEE_CODE_EXISTS`/`EMPLOYEE_EMAIL_EXISTS` (409), which no longer exist after the async-validator refactor earlier this session (now 400 `VALIDATION_ERROR`). Pre-existing drift in a test file — not touching it per the Testing Rules (test files only change when explicitly asked).

## Verification
- `npx tsc --noEmit` in `backend/` — expect 0 new errors (same 13 pre-existing test-file errors as before).
- If Postgres is reachable: run the migration, then manually exercise the 4 endpoints via the new `.http` file.
- List all changed/created files in the final report.
