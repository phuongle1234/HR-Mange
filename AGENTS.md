# AI Coding Rules

## Planning Rules
When a task needs a plan (architecture proposal, refactor design, trade-off analysis, or any use of a planning/plan-mode flow), presenting or "confirming" the plan is never itself authorization to write code — this holds even when a plan-mode tool reports the plan as approved. After the plan is shown, stop and wait. Only start editing files, running generators, or executing the plan once the user sends a separate, explicit follow-up message asking for it (e.g. "làm đi", "tiến hành", "code the plan", "implement this"). If a plan-approval mechanism auto-signals "you can start coding," do not treat that signal alone as sufficient — the user's own explicit request in a later message is what's required.

`docs/09-workflow/plans/` is the standing location for plan documents in this project. Whenever a plan is written (whether via a plan-mode flow or otherwise), save/move the finished plan file into that folder (one file per plan, named for its subject, e.g. `base-service-generic-refactor.md`) so it has a permanent, readable copy in the repo — not just in an ephemeral plan-mode file outside the project. Keep it up to date if the plan changes before execution.

## Debugging Rules
Do not go hunting for bugs or investigate issues beyond the scope of the current request — no proactive bug-hunting passes, no "let me also check if X is broken" side quests.

That said, if while doing the requested work you notice something that looks like a real bug — a runtime-breaking mismatch hidden behind a loose/`any` type, a shape that won't match what a real API expects, an inconsistency with a nearby correct example, or similar — always warn about it immediately. Never stay silent about a bug you've already spotted just because debugging it wasn't the ask; flag it the moment you see it, with a one- or two-line explanation of why it's wrong.

Do not silently fix a bug you noticed this way. Report it, explain the concrete failure it would cause, and suggest a fix — then wait for explicit confirmation ("hãy sửa", "fix it", a specific instruction) before touching the code. Only when the user explicitly asks to debug/investigate a specific problem should you go beyond flagging an incidental finding into an actual root-cause investigation.

## Specification First
Before coding, read the related specifications in this order:

```text
00-project
01-business
02-solution
03-technology
04-database
05-ui-ux
06-api
07-frontend
```

Backend API tasks must read `00-project`, `01-business`, `02-solution`, `03-technology`, `04-database`, and `06-api`.
Frontend tasks must read `00-project`, `01-business`, `02-solution`, `03-technology`, `05-ui-ux`, `06-api`, and `07-frontend`.

Whenever the user asks to build, implement, or scaffold the backend or the frontend, read the applicable specification set above in full before writing or generating any code. This applies even if the request looks small or the user does not mention "spec".

Do not invent business rules, APIs, fields, permissions, or architecture decisions not defined in spec. If information is missing, record ambiguity and ask for confirmation.

## Specification Sync Rules
When an implementation artifact already exists and the user asks to change it, keep the related specification aligned with the final implementation in the same task.

This rule applies to, but is not limited to:
- UI/UX preview HTML files under `docs/05-ui-ux-preview`.
- API specifications under `docs/06-api`.
- Frontend specifications under `docs/07-frontend`.
- React/TypeScript frontend source files.
- Backend API source files, DTOs, controllers, services, repositories, and tests.
- Infrastructure files under `infra`.

Required behavior:
- First read the current implementation artifact and the related spec.
- Infer what changed from the implementation when the user asks to update, fix, or adjust an existing artifact.
- Update the related spec so it describes the real final behavior, layout, route, API contract, state, validation, permission, and error handling.
- If implementation and spec conflict, prefer the user's latest requested change and make the spec match that final result.
- If the implementation reveals a missing or ambiguous business rule, record it as a pending decision instead of inventing hidden behavior.
- Do not leave specs stale after modifying HTML previews, API contracts, frontend React/TypeScript files, backend behavior, database design, tests, workflow, or infrastructure.

## Coding Rules
- Single responsibility: each function does one job; reusable logic belongs in common/shared modules.
- Prefer early return over deep nested if/else.
- Do not hard-code shared values; use constants, enums, config, or environment variables.
- Do not swallow errors. Log and transform errors at appropriate boundaries while preserving root cause.
- Do not log passwords, JWTs, refresh tokens, secrets, API keys, credentials, or unnecessary sensitive data.
- Use try/catch where it adds value: application boundary, database operation, external API, event handler, cron job, transaction, contextual logging, or recovery.

## Backend Rules
**Mandatory** NestJS flow for every module (Clean Architecture / SOLID, dependency inversion via interface tokens):

```text
Controller -> Interface / Abstraction -> Service -> BaseService -> Prisma -> PostgreSQL
```

This architecture is mandatory and has **no exceptions**. Every entity service must extend `BaseService`, and its interface must extend `IBaseService`. Do not skip a layer, do not write a service that talks to `PrismaService` directly for its own entity's row writes, and do not justify bypassing `BaseService` on the grounds that the endpoint's response shape, request shape, side effects, or event needs are unusual — those are reasons to add an entity-specific method *on top of* the inherited base methods, never to opt out of the flow.

- An entity-specific operation that genuinely isn't a base CRUD method (a partitioned/filtered bulk operation, a write with a per-row side effect, a domain state transition) is written as a **new, differently named method** on the concrete service that performs its own business logic and then calls the inherited `this.create(...)`/`this.createMany(...)`/`this.update(...)`/etc. to do the actual persistence. It must not shadow or redefine an inherited base method's signature (see `InvitationsService.createInvitations` vs. inherited `createMany` for the reference example).
- A service may inject `PrismaService` **only** to read a *different* entity that its own delegate cannot reach (`BaseService` is scoped to exactly one Prisma delegate by design). Row writes for the service's own entity always go through inherited base methods. Cross-entity reads for eligibility/validation checks are the only sanctioned direct `prisma` use.
- Event listeners and any other collaborator that needs to mutate an entity must call that entity's service interface, not `PrismaService` — the flow applies to every caller, not just controllers.
- Audit eventing is the one thing an entity may opt out of, and only through the sanctioned mechanism below (`entityType: null`) — never by bypassing `BaseService`.

- Controllers depend only on the interface (e.g. `IEmployeeService`), injected via a NestJS string token (`@Inject('IEmployeeService')`), never on the concrete service class directly.
- Controllers must not perform request validation. All request validation must live in DTO classes, class-validator/class-transformer decorators, pipes, or reusable DTO validators. Controllers may bind DTOs, read route/query/body/current-user data, normalize already-valid DTO values into service/Prisma data, and call services, but they must not reject requests by checking duplicate values, required fields, formats, ranges, mutually exclusive fields, or cross-row rules in controller methods.
- When a controller calls `BaseService.updateMany`, map the DTO to the base shape `Array<{ id, data }>` before calling the service. Preferred format for simple required-field bulk updates is:
  ```ts
  const items = dto.items.map((item) => ({ id: item.id, data: { name: item.name, description: item.description ?? null } }));
  const result = await this.someService.updateMany(items, user.id);
  ```
  For optional update fields, include a field in `data` only when it is actually present in the DTO. Do not use fake defaults such as `name: item?.name || ''`, because that converts an omitted field into real data and can overwrite existing values incorrectly.
- There is no separate Repository class in this flow. `BaseService<TDelegate, TQuery>` holds the injected Prisma model delegate (e.g. `PrismaService['employee']`) as `protected readonly entity`. `TDelegate` is the *only* Prisma-related generic — the entity type and every Prisma input/where type are derived from it via `Prisma.Args`/`Prisma.Result` (see `common/services/prisma-crud.types.ts`), never supplied separately. There is no separate `TCreateDto`/`TUpdateDto` generic either: `create`/`update`/`createMany`/`updateMany` take `CreateDataOf<TDelegate>`/`UpdateDataOf<TDelegate>` directly as their parameter type, and TypeScript checks at each call site whether the caller's DTO is assignable into it — never assume a DTO equals a Prisma input as a blanket rule; if a future entity's DTO doesn't line up, that entity writes its own method (not named `create`/`update`) to build the right shape before calling `this.create(...)`/`this.update(...)` (see `docs/09-workflow/plans/base-service-generic-refactor.md` for the full rationale and rejected alternatives).
- `BaseService` implements `create`, `createMany`, `findOne`, `findByIds`, `update`, `updateMany`, `delete`, and `deleteMany` concretely — concrete services (e.g. `EmployeeService`) do not redeclare any of them. Only `findMany` stays abstract, since search/filter shape is entity-specific with no generic equivalent.
  - **Mandatory BaseService reuse rule.** If an API needs behavior already provided by `BaseService` or exposed on `IBaseService`, it must call that inherited method directly. A concrete service must not recreate the same method, wrap it with another differently named method just to call back into base, or create a parallel CRUD variant for the same behavior. If the endpoint's DTO shape does not match the base method, adjust the endpoint contract/DTO to match the base method whenever that is the real business operation. Add a new service method only when the behavior is genuinely not covered by `BaseService` — and that new method still persists through the inherited base methods rather than reaching for Prisma itself.
  - **The caller decides the data shape completely.** `BaseService` never transforms, merges extra business fields into, or drops fields from the `data`/`dataArray` the caller passes to `create`/`createMany`/`update`/`updateMany`. The caller must include system-managed fields such as `createdByUserId`/`updatedByUserId` in the data before calling `BaseService` when those fields should be persisted. `actorUserId` is used only to tag the emitted audit event's actor; it is never written into the persisted row by `BaseService` itself.
  - **The audit event payload is exactly the caller's original `data`** (or `dataArray[i]` per row for `createMany`, or `items[i].data` for `updateMany`) — never the row Prisma returns. `delete`'s payload is always `{}` (no business data is associated with a delete).
  - `update`'s `id` param (from the route) is what selects the row via `where: { id }` — an `id` field inside the DTO/body must never be used to select or persist. If a DTO needs an `id` for something else entirely (e.g. an async class-validator uniqueness check that must exclude the current row), the controller strips it from the object before calling the service (see `AttachRouteIdInterceptor` + `EmployeeController.update`) — `BaseService` and the concrete service both receive already-clean data and neither one filters it.
  - `update`/`delete` (single and bulk) do **not** query the row before writing, not even to check existence — they catch Prisma's own not-found error (`PrismaClientKnownRequestError` with `code === 'P2025'`) from the write call itself and translate it to the domain `notFoundException`. There is no query anywhere in this class that exists purely to serve the audit event.
  - Bulk methods use `createManyAndReturn` for creates and per-row `update(id, data, actorUserId)` calls for `updateMany(items, actorUserId)` so each row can carry distinct data and audit payload. `deleteMany(ids, actorUserId)` uses Prisma `deleteMany({ where: { id: { in: ids } } })`, returns the deleted count, and emits **one single event for the whole batch** instead of one per row, using `BULK_ENTITY_ID_SENTINEL` (`'BULK'`, from `entity-crud.event.ts`) as `entityId` and `{ where }` as the payload.
  - Do not add a `persistCreate`/`persistUpdate`-style protected helper or any other per-entity override of `create`/`update`/bulk methods unless an entity has a genuine reason `BaseService` cannot handle. Prefer adjusting `BaseService` itself (if the need is generic) over overriding in one service.
  - `findMany` has no shared helper (pagination shape aside) since search/filter fields differ per entity; implement it fully in the concrete service using `this.entity`.
  - The only sanctioned type assertion in this pattern is `unsafeCoerce<T>()` in `prisma-crud.types.ts`, used solely to reclaim the precise type from a delegate call's `any` return (`CrudDelegateShape`'s methods must be typed loosely for arbitrary Prisma delegates to satisfy the bound). It is not used to "trust" input data anymore — `data` parameters are typed as the real derived Prisma input from the start. Do not add ad-hoc `as any`/`as unknown` elsewhere in `BaseService` — funnel any new unavoidable gap through that one function.
- `BaseService` emits one shared event (`EntityCrudEvent` from `common/events/entity-crud.event.ts`, topics `entity.created`/`entity.updated`/`entity.deleted`) carrying `entityType`, `entityId`, `payload` (see above — caller's input data, `{}`, or `{ where }`, never a Prisma row), and the actor. Concrete services must not emit their own duplicate CRUD events, and must not create per-entity event classes for create/update/delete.
  - **Audit opt-out (`entityType: null`).** An entity that must not participate in shared audit logging passes `null` as `BaseService`'s `entityType` constructor argument instead of an `AuditEntityType` value. This suppresses the `entity.created`/`entity.updated`/`entity.deleted` emit and nothing else — every CRUD method behaves identically, so the entity still extends `BaseService` and still follows the mandatory flow. Use it only for a real reason (the entity has its own domain events that already cover its lifecycle, or its rows carry a secret that must never reach the audit log). `InvitationsService` is the reference example: it opts out because the invitation lifecycle is tracked by its own `invitation.created` domain event plus the row's `status`/`sentAt`/`sendAttempts` columns, and its creation involves a one-time token URL that must never be audit-logged. An entity that opts out must not be added to `AuditEntityType`/`AuditAction`/`AuditLogListener`.
  - A module-specific **domain** event (not a CRUD audit event) is still allowed and is not covered by the "no per-entity event classes" rule above — e.g. `invitation.created` (`modules/invitations/events/invitation-created.event.ts`) exists to trigger email sending and carries the one-time invitation URL, which is exactly why it must be a separate class from `EntityCrudEvent` rather than reusing it.
- `AuditLogListener` (`modules/audit-log`) subscribes to those 3 shared events generically and maps `entityType` to the right `AuditAction` via a lookup table — it has no per-entity handler methods. Adding a new entity to this pattern means: add it to `AuditEntityType`, add its 3 actions to `AuditAction`, add one row to `AuditLogListener`'s lookup table. It does not mean adding a new listener or new event classes.
- `createMany`/`updateMany`/`deleteMany` are exposed on `IBaseService` and must be used by future APIs whose behavior matches those base methods. Bulk update uses explicit `items: Array<{ id, data }>`; bulk delete uses explicit `ids`.
- Do not hand-roll ad-hoc query builders in the controller; all Prisma access goes through the service's `this.entity`.

Known non-compliant module (not an exception to the rule): the `auth` module predates this convention and still uses an explicit Repository class (`UserRepository implements IUserRepository`) between `AuthService` and Prisma, with no event emission on mutations. It is **out of compliance and pending migration**, not permitted to stay that way — but do not refactor it as a side effect of unrelated work; that migration needs its own explicit task so it can be reviewed and tested on its own. New code must never copy the `auth` pattern, and no new module may claim `auth` as precedent for skipping `BaseService`.

## Database Rules
Database design must be specified before Prisma schema and migration. Do not add fields without database spec. Every database change must update database spec.

## Frontend Rules
React uses React Router, Redux Toolkit, TanStack Query, and Axios. Redux is for global client state, TanStack Query is for server state, and local React state is for UI state. API URLs must be declared centrally, not inside components.

List pages with search, page, limit, sort, or sort-order behavior must use the shared list query hook (e.g. `useListQueryState`) instead of recreating local `useState`/handler logic in the page. If a future list page needs the same behavior with a small variation, extend the shared hook generically rather than copying the hook's internals into the page.

JSX elements: write every element's attributes on one line (`<button className="..." aria-haspopup="menu" aria-expanded={isOpen} type="button" onClick={...} >`), not one attribute per line, regardless of how many props it takes. This applies to every element/component, not just `<button>` — plain HTML tags and custom components alike. Let the line wrap naturally/stay long rather than breaking each prop onto its own line.

## Testing Rules
Do not create unit test (UT) files (e.g. under `backend/test`, `frontend/src/test`) and do not run tests as part of a normal coding request, even if the task would otherwise call for it. Only write UT files and/or run tests when the user explicitly asks to write UT or run UT in that request. Do not claim tests passed unless they were executed.

If Playwright is used or a Playwright config is created/updated, the default configuration must run visibly with `use: { headless: false }` so the user can watch browser testing. Do not switch Playwright to headless mode unless the user explicitly asks for headless execution.

## Session Context Log
After finishing any task in a conversation, update `docs/09-workflow/session-context.md` with a cumulative summary of the entire conversation up to that point: what the user asked across the conversation, what was decided, what was changed (files/specs/rules), and what remains pending or unresolved. Overwrite the file each time so it always reflects the full conversation to date, not just the latest task. This file must be self-sufficient: if the conversation/channel is later deleted, reading this file alone must be enough to reconstruct what happened and why.

## Memory And History Log
After each working session/task, update `docs/09-workflow/memory.yaml` when durable project knowledge changes. Memory is for compact facts future agents need to remember, such as where rules/specs live and the current backend/frontend/coding/testing conventions. Do not copy raw session logs into memory.

After each working session/task, append meaningful events to the daily JSONL history file under `docs/09-workflow/history/YYYY-MM-DD.jsonl`. History is an append-only chronological audit trail of what happened, not default prompt context and not a replacement for memory or session context. Use one JSON object per physical line, never a JSON array or pretty-printed multi-line event.

History events should include at least `timestamp`, `event_type`, `session_id`, `task_id`, `actor`, `scope`, and `payload`. Keep payloads concise and redact secrets/passwords/tokens/API keys/private keys/authorization headers as `[REDACTED]`. Do not rewrite old history to change the past; append a correction event when needed.

Write history using `docs/09-workflow/scripts/history/append-history.ps1` (run from the repo root) rather than hand-writing lines into the `.jsonl` file — it validates `event_type` against the allowed list and redacts secrets automatically. Use `query-history.ps1` to look up past events and `validate-history.ps1` to check integrity. Full usage reference: `docs/09-workflow/memory.yaml` → `history_scripts`.

Do not introduce a new `.ai/` directory for memory/history unless the user explicitly asks. This project uses the lightweight workflow location under `docs/09-workflow/`.
