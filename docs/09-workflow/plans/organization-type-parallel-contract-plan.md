# OrganizationType parallel contract-first plan

## Context

Task source: `docs/09-workflow/daily-tasks/2026-08-24.md`.

Goal: build an `OrganizationType` CRUD feature as a level-2 menu item under the level-1 Organization menu. The work must be split so multiple AI agents can work independently:

- One agent owns the API contract/spec.
- One agent owns the NestJS backend implementation.
- One agent owns the React frontend implementation.

The frontend must not need to wait for the backend source to exist. It should build against the documented API contract, central endpoint definitions, TypeScript DTO/response types, and mock/stub data that follow the same contract.

## Important Existing Context

- Existing frontend reusable list primitives: `SearchAndFilterBar`, `Pagination`, `PageStates`, `ConfirmDialog`, `Button`, shared API client, TanStack Query pattern, React Hook Form + Zod.
- Existing backend reusable CRUD primitive: `BaseService<TDelegate, TQuery>`, with concrete `create`, `createMany`, `findOne`, `update`, `updateMany`, `delete`, `deleteMany`, audit eventing, and Prisma delegate-derived types.
- Existing Organization backend exists for bulk hierarchy operations, but this task is for `OrganizationType`, a separate lookup/configuration entity.
- The task explicitly asks to add `findByIds()` to BaseService so services can inherit it.

## Parallelization Principle

Before backend/frontend coding starts, the API/spec agent must create the shared contract. After that, backend and frontend can run in parallel.

```text
API/spec contract
    |-- Backend agent implements NestJS/Prisma to match contract
    |-- Frontend agent implements React UI/API service/hooks to match contract
```

The backend agent must not change response/request shapes unless it first updates the API spec. The frontend agent must not invent endpoints or fields outside the API spec; if a field is missing, it records ambiguity and asks.

## Agent A: API / Spec Contract

### Files To Create Or Update

- `docs/04-database/entities/organization-type.md`
- `docs/06-api/organization-type/list-organization-types.md`
- `docs/06-api/organization-type/get-organization-types-by-ids.md`
- `docs/06-api/organization-type/create-organization-types.md`
- `docs/06-api/organization-type/update-organization-types.md`
- `docs/06-api/organization-type/delete-organization-types.md`
- `docs/07-frontend/pages/organization-type-list.md`
- `docs/07-frontend/pages/organization-type-create.md`
- `docs/07-frontend/pages/organization-type-update.md`
- `docs/07-frontend/architecture.md`
- `docs/07-frontend/api-client.md`

### Database Contract

Model:

```text
OrganizationType
├── id
├── name
├── description
├── createdAt
├── updatedAt
├── createdByUserId
└── updatedByUserId
```

Pending decisions the API/spec agent must resolve or explicitly mark:

- `id` type: use project default UUID unless user explicitly wants `Int`.
- `name` uniqueness: recommended unique, because type names are configuration labels.
- `description` required or optional: recommended optional.
- hard delete vs restricted delete if referenced by `Organization`: task implies delete, but referential behavior must be specified.
- whether `createdByUserId` and `updatedByUserId` are required in Prisma writes or filled by controller before calling `BaseService`.

### API Contract

Base path:

```text
/api/organization-types
```

All endpoints require Bearer JWT. No permission model in this phase.

Recommended endpoint set:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/organization-types` | List/search organization types |
| `POST` | `/api/organization-types/by-ids` | Fetch selected rows by ids for bulk update screen |
| `POST` | `/api/organization-types` | Create many organization types in one call |
| `PATCH` | `/api/organization-types` | Update many organization types in one call |
| `DELETE` | `/api/organization-types` | Delete many organization types in one call |

Use `POST /by-ids` instead of `GET ?ids[]=...` so the frontend can pass arbitrary checked ids cleanly and avoid URL length/encoding issues.

Response envelope must follow existing backend conventions:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "meta": {}
}
```

Error envelope must follow the existing normalized shape:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed.",
  "fieldErrors": [],
  "requestId": "string"
}
```

### DTO Contract

Shared DTOs:

```ts
type OrganizationTypeDto = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

type OrganizationTypeListQuery = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

type OrganizationTypeCreateItem = {
  name: string;
  description?: string | null;
};

type CreateOrganizationTypesRequest = {
  items: OrganizationTypeCreateItem[];
};

type GetOrganizationTypesByIdsRequest = {
  ids: string[];
};

type OrganizationTypeUpdateItem = {
  id: string;
  name?: string;
  description?: string | null;
};

type UpdateOrganizationTypesRequest = {
  items: OrganizationTypeUpdateItem[];
};

type DeleteOrganizationTypesRequest = {
  ids: string[];
};
```

The spec must define max bulk size. Recommended: `1..100` items/ids per request.

### Contract-First Deliverable For Frontend

The API/spec agent should produce frontend-consumable contract notes in the frontend page specs:

- endpoint method/path
- request body type
- response data type
- validation errors and field mapping
- loading/empty/error state behavior
- mutation success redirects
- query keys to use

This allows the frontend agent to build API services and hooks before the backend is complete.

## Agent B: Backend Implementation

### Required Spec Read Set

Before coding, read:

- `docs/00-project`
- `docs/01-business`
- `docs/02-solution`
- `docs/03-technology`
- `docs/04-database`
- `docs/06-api`
- this plan

### Files To Create Or Update

- `backend/prisma/schema.prisma`
- Prisma migration for `OrganizationType`
- `backend/src/common/services/base.service.ts`
- `backend/src/common/interfaces/base.interface.ts` if exposing `findByIds` on the shared interface is approved
- `backend/src/common/services/prisma-crud.types.ts`
- `backend/src/common/constants/audit-action.constant.ts`
- `backend/src/common/constants/error-code.constant.ts`
- `backend/src/common/exceptions/app.exception.ts`
- `backend/src/modules/audit-log/listener/audit-log.listener.ts`
- `backend/src/modules/organization-type/organization-type.module.ts`
- `backend/src/modules/organization-type/controller/organization-type.controller.ts`
- `backend/src/modules/organization-type/service/organization-type.service.ts`
- `backend/src/modules/organization-type/interfaces/organization-type-service.interface.ts`
- `backend/src/modules/organization-type/dto/*.ts`
- `backend/test/http/organization-type/organization-type.http`

### BaseService Change

Add inherited method:

```ts
findByIds(ids: string[]): Promise<EntityOf<TDelegate>[]>
```

Implementation principle:

- Query by `where: { id: { in: ids } }`.
- Do not emit audit events; reads do not produce CRUD audit logs.
- Return an empty array for empty input after validation, or reject empty input at DTO level. Recommended: reject empty `ids` in DTO for API calls, but keep `BaseService.findByIds([])` returning `[]` defensively.
- Preserve input order if frontend needs row order to match checked order. Recommended: BaseService should preserve order by mapping returned rows by `String(id)`.
- Convert row ids through `String()` because this codebase already supports non-string PKs for Organization.

### OrganizationType Backend Module

Controller endpoints should match the API spec exactly. The controller builds complete Prisma write data and passes it to `BaseService`.

Recommended service:

```ts
export class OrganizationTypeService
  extends BaseService<PrismaService['organizationType'], OrganizationTypeListQueryDto>
  implements IOrganizationTypeService
```

Only `findMany` is entity-specific. `createMany`, `findByIds`, `updateMany`, and `deleteMany` should be inherited unless the API contract needs behavior BaseService cannot provide.

### Backend Agent Boundary

Backend may:

- implement DTO validation
- implement Prisma model/migration
- implement service/controller
- add audit constants and not-found/conflict errors
- add `.http` manual request file

Backend must not:

- change frontend page behavior
- invent frontend Redux shape
- change API response/request shapes without updating `docs/06-api/organization-type/*.md`

## Agent C: Frontend Implementation

### Required Spec Read Set

Before coding, read:

- `docs/00-project`
- `docs/01-business`
- `docs/02-solution`
- `docs/03-technology`
- `docs/05-ui-ux`
- `docs/06-api`
- `docs/07-frontend`
- this plan

### Files To Create Or Update

- `frontend/src/shared/components/ContextMenu.tsx`
- `frontend/src/shared/hooks/useGridInputNavigation.ts`
- `frontend/src/shared/components/FullPageLoadingOverlay.tsx`
- `frontend/src/store/organization-type-selection/*` or equivalent existing store pattern
- `frontend/src/shared/api/api-endpoints.ts`
- `frontend/src/features/organization-type/types/organization-type.types.ts`
- `frontend/src/features/organization-type/services/organization-type.api.ts`
- `frontend/src/features/organization-type/utils/query-keys.ts`
- `frontend/src/features/organization-type/schemas/organization-type.schema.ts`
- `frontend/src/features/organization-type/hooks/*.ts`
- `frontend/src/features/organization-type/pages/OrganizationTypeListPage.tsx`
- `frontend/src/features/organization-type/pages/OrganizationTypeCreatePage.tsx`
- `frontend/src/features/organization-type/pages/OrganizationTypeUpdatePage.tsx`
- `frontend/src/routes/app.routes.tsx`
- `frontend/src/layouts/AppLayout.tsx`

### Frontend Contract Usage

The frontend agent should implement against `docs/06-api/organization-type/*.md`, not backend source. It can create the service immediately:

```ts
organizationTypeApiService.list(query)
organizationTypeApiService.findByIds({ ids })
organizationTypeApiService.createMany({ items })
organizationTypeApiService.updateMany({ items })
organizationTypeApiService.deleteMany({ ids })
```

If the backend is unavailable, the frontend agent can keep UI work testable with one of these non-final adapters:

- MSW/mock handler matching the documented API contract.
- A temporary `mockOrganizationTypeApiService` wired only behind an explicit dev flag.
- Static fixture data for page rendering only, with the real service already typed and ready.

No component should hard-code `/api/...`; all paths go through `ApiEndpoints`.

### Shared Frontend Components / Hooks

Create reusable primitives instead of making them OrganizationType-specific:

```text
shared/components/ContextMenu.tsx
shared/hooks/useGridInputNavigation.ts
shared/components/FullPageLoadingOverlay.tsx
```

`ContextMenu`:

- opens from `onContextMenu`
- receives items `{ key, label, disabled?, danger?, onSelect }`
- closes on outside click, Escape, and item select
- uses accessible menu roles
- does not know OrganizationType

`useGridInputNavigation`:

- listens to `keydown`
- ArrowDown/ArrowUp/ArrowLeft/ArrowRight move focus between registered input cells
- supports dynamic rows
- does not own form state

`FullPageLoadingOverlay`:

- uses the visual idea of `LoadingState`
- covers the page during create/update/delete mutation if needed
- text label is configurable

### OrganizationType List Page

Route:

```text
/organizations/types
```

Sidebar:

```text
Organization
└── Organization Types
```

Behavior:

- inherit common authenticated `AppLayout`
- render list toolbar based on existing list primitives
- table header has a checkbox for check all / remove all
- row checkboxes update local selection
- right-click opens `ContextMenu`
- context menu items:
  - `Create`: navigate to `/organizations/types/create`
  - `Update`: store checked ids in Redux global state under a dedicated key like `organization_type_checked`, then navigate to `/organizations/types/update`
  - `Delete`: open confirm popup; on confirm call delete API once with `{ ids }`
- delete success invalidates OrganizationType list query and clears selected ids

### OrganizationType Create Page

Route:

```text
/organizations/types/create
```

Behavior:

- layout follows existing app form/table layout
- right-side submit button disabled while React Hook Form/Zod is invalid
- body uses table layout with rows of inputs
- header has check all / remove all
- validation message appears below each input
- right-click opens `ContextMenu`
- context menu items:
  - `Submit`: open confirm, then call create API once with `{ items }`, show full-page loading overlay, redirect to list
  - `Create items`: append one editable row
  - `Delete`: remove checked local rows
- Arrow key input navigation uses `useGridInputNavigation`

### OrganizationType Update Page

Route:

```text
/organizations/types/update
```

Behavior:

- read checked ids from Redux key `organization_type_checked`
- if no ids exist, redirect back to list with a safe message
- call `findByIds` once with `{ ids }`
- prefill editable table rows from API response
- layout and interactions mirror Create page
- submit calls update API once with `{ items }`
- after success, clear Redux selected ids and redirect to list

### Frontend Agent Boundary

Frontend may:

- implement routes, pages, components, hooks, local schemas, query keys, services
- use documented API shape even if backend is not done
- create mock/fixture adapter only as a temporary dev aid

Frontend must not:

- inspect backend source as the source of truth
- invent fields missing from API spec
- store server list/detail data in Redux
- store form values in Redux
- call Axios directly from components

## Recommended Work Items

Create new `docs/work` items before execution:

| Work ID | Owner | Scope |
| --- | --- | --- |
| `WORK-019` | API/spec | OrganizationType database/API/frontend contract specs |
| `WORK-020` | Backend | BaseService `findByIds` + OrganizationType NestJS/Prisma module |
| `WORK-021` | Frontend shared | `ContextMenu`, `useGridInputNavigation`, `FullPageLoadingOverlay` |
| `WORK-022` | Frontend feature | OrganizationType list/create/update pages + API service/hooks |
| `WORK-023` | Integration | Verify frontend against real backend and remove/disable mocks |

Dependency graph:

```text
WORK-019
  |-- WORK-020
  |-- WORK-021
        \-- WORK-022
WORK-020 + WORK-022 -> WORK-023
```

`WORK-021` can start after the task file is understood because the shared components are UI-generic, but `WORK-022` should wait for `WORK-019` so its API service and types do not drift.

## Acceptance Criteria

- API spec fully describes every endpoint, request, response, validation error, and redirect-relevant behavior.
- Backend implements the API spec exactly.
- Frontend compiles and can render/work with a mock or documented service shape before backend is complete.
- Frontend switches to real backend by changing only API availability/configuration, not page logic.
- Shared context menu and keyboard navigation hook are reusable by future table-form modules.
- Delete and update bulk actions call the backend once per user action, passing arrays of ids/items.
- `docs/09-workflow/session-context.md` is updated after the task.

## Stop Point

This is a plan only. Per project Planning Rules, do not edit implementation/spec files or generate work items until the user sends a separate explicit implementation request.
