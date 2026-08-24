---
id: SOLUTION-BACKEND-ARCHITECTURE
type: solution
module: global
status: draft
---

# Backend Architecture

## Purpose
Define backend layering and module design.

## Required Flow
Default flow for new/refactored modules, using the shared generic `BaseService` (no Repository layer):
```text
Controller -> Interface / Abstraction -> Service -> BaseService -> Prisma -> PostgreSQL
```

Legacy flow, kept only where already in use (see "Exception: `auth` module" under BaseService Contract below):
```text
Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

## Layer Responsibilities
| Layer | Responsibility |
| --- | --- |
| Controller | HTTP routing, DTO binding, auth metadata, service calls, response mapping. |
| Interface / Abstraction | Controller-facing contract (e.g. `IEmployeeService`); controllers depend on this, never on the concrete service class, injected via a NestJS string token. |
| Service | Application logic, business rule orchestration, transactions, audit/event calls. |
| BaseService | Shared generic CRUD + audit-eventing for entities that use it (see "BaseService Contract" below). Replaces Repository for these modules. |
| Repository | Database access only. Legacy layer — only the `auth` module still has one; new modules use `BaseService` instead. |
| Prisma | ORM client and typed database operations. |
| PostgreSQL | Persistent storage. |

## Module Pattern
```text
module
├── controller
├── service
├── dto
├── interfaces
├── events        (only if the module defines its own domain events)
├── validators     (only if the module defines custom async DTO validators)
└── tests
```
A `repository/` folder is only present for modules still on the legacy flow (currently just `auth`) — modules built on `BaseService` do not have one.

Rules:
- Controllers must not contain business logic.
- Repositories (where present) must not contain HTTP concerns.
- Services must not hard-code secrets.
- Shared behavior belongs in common/shared modules.

## Error Boundaries
- Controllers map service errors to API responses.
- Services preserve root cause while returning safe domain/application errors.
- Repositories do not swallow database errors.

## BaseService Contract

Source: `backend/src/common/services/base.service.ts`. Generic signature:
```ts
abstract class BaseService<TDelegate extends CrudDelegateShape, TQuery = unknown>
  implements IBaseService<EntityOf<TDelegate>, CreateDataOf<TDelegate>, UpdateDataOf<TDelegate>, TQuery>
```

- `TDelegate` is the *only* Prisma-related generic — the injected Prisma model delegate (e.g. `PrismaService['employee']`). Entity type and every create/update/where input type are derived from `TDelegate` via Prisma's own `Prisma.Args`/`Prisma.Result` utilities (`backend/src/common/services/prisma-crud.types.ts`) — never supplied as separate generics, never hand-maintained in a registry.
- There is no `TCreateDto`/`TUpdateDto` generic. `create`/`update`/`createMany`/`updateMany` take the Prisma input type derived from `TDelegate` directly as their parameter type — TypeScript checks at each call site whether the caller's data is assignable into it. Public `updateMany` accepts per-row items shaped as `{ id, data }[]`.
- Entity ids may be `string` or `number`; `BaseService` converts them to string only when emitting audit events or building not-found exceptions.
- `IBaseService<TEntity, TCreateDto, TUpdateDto, TQuery>` (`backend/src/common/interfaces/base.interface.ts`) is the Controller-facing contract (e.g. `IEmployeeService extends IBaseService<Employee, CreateEmployeeDto, UpdateEmployeeDto, GetEmployeesQueryDto>`) and is independent of `TDelegate` — it stays DTO-typed. A concrete service's `implements IBaseService<...>` only succeeds if its inherited data type is structurally assignable to/from the DTO; if a future entity's DTO doesn't line up with its Prisma input, that entity needs its own method (not named `create`/`update`) to build the right shape before delegating.

### Method ownership
| Method | Owner | Notes |
| --- | --- | --- |
| `create`, `createMany`, `findOne`, `findByIds`, `update`, `updateMany`, `delete`, `deleteMany` | `BaseService` (concrete) | Concrete services (e.g. `EmployeeService`) do not redeclare these. |
| `findMany` | Concrete service (abstract on `BaseService`) | Search/filter shape is entity-specific; no generic equivalent. |

### Data ownership rule
The caller (Controller, or a concrete service's own business method) decides the complete data shape passed to `create`/`update`/`createMany`/`updateMany`, including any system-managed field (e.g. `createdByUserId`/`updatedByUserId`). `BaseService` does not transform, merge, add, or drop any field — `data` is forwarded to the Prisma delegate unchanged. `actorUserId` (a separate parameter) is used only to tag the emitted audit event's actor; it is never written into the persisted row by `BaseService` itself.

### Not-found detection
`update`/`delete` (single and bulk) do not query the row before writing — not even to check existence. They catch Prisma's own not-found error (`Prisma.PrismaClientKnownRequestError` with `code === 'P2025'`) from the write call itself and translate it to the domain not-found exception supplied by the concrete service's constructor.

### Audit eventing
After every create/update/delete (single or bulk), `BaseService` emits `EntityCrudEvent` (`backend/src/common/events/entity-crud.event.ts`, topics `entity.created`/`entity.updated`/`entity.deleted`) carrying `entityType`, `entityId`, `payload`, and the actor. `payload` is exactly the caller's original data — never the row Prisma returns:
- `create`/`update`: the caller's `data` object, as-is.
- `createMany`/`updateMany`: the corresponding input item per row. Public `updateMany` calls single-row `update(id, data, actorUserId)` for each item so every row can carry different update data.
- `delete`: `{}` — no business data is associated with a delete, and no pre-delete snapshot query is made.
- `deleteMany`: accepts explicit ids, deletes with `where: { id: { in: ids } }`, returns the deleted count, and emits **one event for the whole batch**, not one per row — `entityId` is `BULK_ENTITY_ID_SENTINEL` (`'BULK'`), `payload` is `{ where }`.

`AuditLogListener` (`backend/src/modules/audit-log`) subscribes to these 3 events generically, mapping `entityType` to the right `AuditAction` via a lookup table — it has no per-entity handler methods.

### Exception: `auth` module
`auth` predates this pattern and still uses an explicit `UserRepository implements IUserRepository` between `AuthService` and Prisma, with no `BaseService` and no event emission on mutations. The two patterns are allowed to coexist until an explicit migration task covers `auth`.

Full design rationale (generic-collapse trade-offs, rejected alternatives) is in `docs/09-workflow/plans/base-service-generic-refactor.md`.

## Pending Decisions
- Exact NestJS module folder structure.
- Transaction helper abstraction.
