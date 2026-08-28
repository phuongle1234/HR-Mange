# Agent 1 Prompt — Workflow Database + Core Backend (`WORK-028`)

## ROLE
You are a senior NestJS/Prisma backend engineer. You own the workflow **data layer and definition/read APIs**. You are the foundation the other two agents build against, so your schema and DTO shapes must land exactly as contracted — they are being coded against in parallel, right now, by agents who cannot wait for you.

## MISSION
Deliver:
1. Prisma schema + one migration for all workflow tables **and** the notification table.
2. Workflow definition CRUD (`workflows`) and step-chain management (`workflow_steps`).
3. `form_schema` validation and the reusable `form_data` validator.
4. Submit a workflow request, read request detail, read history, list requests.
5. All shared-file additions (error codes, exceptions, module registration) — **for all three agents**, in one pass each, so nobody else edits those files.

## BEFORE YOU WRITE ANY CODE
Read, in this order:
1. `AGENTS.md` — mandatory. Note the **no-exceptions** backend flow, the controller-must-not-validate rule, and the testing restriction.
2. `workflow-contract.md` — **your binding contract.** §2 (entities), §3 (form schema/data), §5.1 + §5.4–5.6 (your endpoints and DTO shapes), §6 (error codes), §7.1 + §7.4 (SUBMIT/RESUBMIT semantics), §11 (file ownership).
3. `workflow-master-spec.md` — §2 (repo findings), §3 (DB rationale), §5 (permission model).
4. Spec folders required by `AGENTS.md` for backend work: `docs/00-project`, `docs/01-business`, `docs/02-solution`, `docs/03-technology`, `docs/04-database`, `docs/06-api`.
5. Reference implementation to copy: `backend/src/modules/organization-type/` — module, controller, interface, service, DTOs. Copy its structure exactly.

## FILES YOU OWN
```
backend/prisma/schema.prisma
backend/prisma/migrations/**                          (one new migration)
backend/src/modules/workflow/**                        (except actions/, events/, gateway/ — Agent 2)
backend/src/app.module.ts
backend/src/common/constants/error-code.constant.ts
backend/src/common/exceptions/app.exception.ts
docs/04-database/entities/workflow*.md                 (new specs)
docs/06-api/workflow/**                                (new specs)
```

Your module layout — mirror `organization-type/`:
```
backend/src/modules/workflow/
├── workflow.module.ts                                 ← you create; Agent 2 adds its providers later
├── controller/
│   ├── workflow.controller.ts                         ← /workflows
│   └── workflow-request.controller.ts                 ← /workflow-requests (read + submit only)
├── service/
│   ├── workflow.service.ts
│   └── workflow-request.service.ts
├── interfaces/
│   ├── workflow-service.interface.ts
│   └── workflow-request-service.interface.ts
├── dto/
│   ├── get-workflows-query.dto.ts
│   ├── create-workflow.dto.ts
│   ├── update-workflow.dto.ts
│   ├── replace-workflow-steps.dto.ts
│   ├── create-workflow-request.dto.ts
│   └── get-workflow-requests-query.dto.ts
├── validators/
│   ├── form-schema.validator.ts                       ← validates form_schema shape
│   └── form-data.validator.ts                         ← validates form_data vs schema (Agent 2 reuses)
└── utils/
    └── workflow-step-chain.util.ts                     ← root lookup, chain ordering, next/prev
```

## FILES YOU MUST NOT TOUCH
```
backend/src/modules/workflow/actions/**                 ← Agent 2
backend/src/modules/workflow/events/**                  ← Agent 2
backend/src/modules/workflow/gateway/**                 ← Agent 2
backend/src/modules/notification/**                     ← Agent 2
backend/src/main.ts                                     ← Agent 2 (socket adapter)
backend/package.json                                    ← Agent 2 (socket deps)
frontend/**                                             ← Agent 3, all of it
backend/src/common/services/base.service.ts             ← nobody
backend/src/common/interfaces/base.interface.ts         ← nobody
backend/src/common/filters/http-exception.filter.ts     ← nobody
backend/src/common/helpers/response.helper.ts           ← nobody
backend/src/common/pipes/**                             ← nobody
backend/src/common/constants/audit-action.constant.ts   ← nobody (see T3)
backend/src/modules/{auth,employee,organization,organization-type,invitations,audit-log}/**  ← nobody
```

## DEPENDENCIES
**None. You start immediately.** Nothing you need is owned by another agent.

You create two files *for* Agent 2 so `app.module.ts` is only edited once (T4): you register `NotificationModule` by its agreed path even though Agent 2 authors the file. Coordinate by path only — do not implement Agent 2's module.

---

## TASKS

### T1 — Prisma schema
Add to `backend/prisma/schema.prisma`, per contract §2:
- Enums: `WorkflowStatus`, `WorkflowRequestStatus`, `WorkflowAction`, `NotificationType`.
- Models: `Workflow`, `WorkflowStep`, `WorkflowRequest`, `WorkflowHistory`, `Notification`.

Requirements:
- `@@map` to snake_case plural table names; `@map` every multi-word column — match every existing model.
- All FKs, `onDelete` behaviours, and indexes exactly as contract §2 specifies. `onDelete` choices are deliberate; do not "improve" them.
- `WorkflowStep.parentId` is a self-relation. Prisma needs an explicit relation name and both sides, e.g.:
  ```prisma
  parent   WorkflowStep?  @relation("WorkflowStepChain", fields: [parentId], references: [id], onDelete: Cascade)
  children WorkflowStep[] @relation("WorkflowStepChain")
  ```
- Add the reciprocal relation fields on `Employee` (`workflowRequests`, `workflowHistories`, `notifications`) — Prisma will not compile without them. **This is your only permitted edit to existing models, and it adds relation fields only** — do not alter existing columns.
- Include `revision Int @default(0)` on `WorkflowRequest`. It is load-bearing for Agent 2's concurrency control.

Then: `npx prisma generate` and create the migration. Verify the generated client actually contains the new models before reporting done — a stale client silently breaks both other agents.

### T2 — Workflow definition API
`GET /api/workflows`, `GET /api/workflows/:id`, `POST /api/workflows`, `PUT /api/workflows/:id` per contract §5.1.

- `WorkflowService extends BaseService<PrismaService['workflow'], GetWorkflowsQueryDto>`, `implements IWorkflowService`, `IWorkflowService extends IBaseService<...>`.
- **Pass `null` as the `entityType` constructor argument** (contract §11, master spec §3.4): workflow entities do not use the shared audit log. Add nothing to `AuditEntityType`/`AuditAction`/`AuditLogListener`.
- Only `findMany` is implemented; use inherited `create`/`update`/`findOne` for the rest.
- `GET /:id` returns `steps[]` ordered root-first by following `parentId` — use your chain util, not `stepOrder`.
- Query DTO reuses `DEFAULT_PAGE`, `DEFAULT_PAGE_LIMIT`, `MAX_PAGE_LIMIT`, `SORT_ORDERS` from `common/constants/app.constants.ts`. No magic numbers.
- `code` is immutable after create — `UpdateWorkflowDto` simply must not contain the field.
- Duplicate `code` → `409 WORKFLOW_CODE_EXISTS`.

### T3 — `form_schema` validation
Implement `validators/form-schema.validator.ts` enforcing contract §3.1 exactly: `key` pattern and uniqueness, non-empty `label`, `type` in the closed set of six, `options` required and non-empty **only** for `select` (and forbidden otherwise), unknown properties rejected.

Wire it as a reusable **DTO validator** (a `class-validator` constraint), never as controller code — `AGENTS.md` forbids validation in controllers. Follow `backend/src/modules/employee/validators/` for the constraint + decorator pattern.

Field-error paths follow the repo's existing granular convention: `formSchema.fields.0.options`, etc.

### T4 — Shared-file additions (do these in ONE edit each)
- `error-code.constant.ts`: add **all eleven** codes from contract §6, including Agent 2's (`WORKFLOW_REQUEST_STALE`, `WORKFLOW_ACTION_NOT_ALLOWED`, `NOTIFICATION_NOT_FOUND`).
- `app.exception.ts`: add one exception class per code, following the existing constructor conventions (`(id: string)` for not-found; `(fieldPath: string)` for reference-not-found).
- `app.module.ts`: register `WorkflowModule` **and** `NotificationModule` (Agent 2's, path agreed above), after `AuditLogModule`.

You touch each of these files exactly once. Agent 2 must never need to edit them.

### T5 — Step chain management
`POST /api/workflows/:id/steps` — replace-chain semantics per contract §5.4.

- Body is the ordered chain; **server assigns `parentId` from array index**; the client never sends `parentId`.
- `steps[0].parentId = null`; `steps[n].parentId = steps[n-1].id`; `stepOrder = index`. Min 1, max 20.
- Validate every `organizationTypeId` exists → else `400 ORGANIZATION_TYPE_NOT_FOUND` with a granular path (`steps.0.organizationTypeId`).
- Reject with `409 WORKFLOW_HAS_ACTIVE_REQUESTS` if any non-terminal request references this workflow.
- Delete-then-insert in **one transaction** (this is a multi-row atomic write — use `prisma.$transaction`, same sanctioned narrow exception as contract §8.3).
- Bump `workflow.version`.

### T6 — Submit a request
`POST /api/workflow-requests` per contract §7.1.

Order matters: validate workflow is `ACTIVE` → has ≥1 step → validate `form_data` against `form_schema` → find root step (`parentId = null`) → insert request (`IN_PROGRESS`, `currentStepId = root.id`, `submittedAt = now`, `revision = 0`) → insert `SUBMIT` history (`workflowStepId = null`) → COMMIT.

- Resolve the actor's `Employee` from `@CurrentUser().id` via `employees.user_id`. No `Employee` → `403`.
- Request + history in one transaction.
- **Emit nothing.** `workflow.request.created` is Agent 2's (it owns the event/gateway layer). Leave a `// TODO(Agent 2): emit workflow.request.created after commit` marker at the exact line so integration is a one-line change, not a hunt.

### T7 — Read APIs
- `GET /api/workflow-requests/:id` — full shape per contract §5.6, including `workflow`, `employee`, `currentStep`, and computed `permissions`.
- `GET /api/workflow-requests/:id/histories` — `createdAt` ascending, with `step` and `employee` sub-objects.
- `GET /api/workflow-requests` — with `scope=mine|inbox` per contract §5.5.

**You own `permissions` computation** (contract §4 + §5.6) because both `scope=inbox` and the detail response need it. Implement it in one place — `utils/` or a small resolver service — and export it so Agent 2 reuses the identical function for its authority checks. Two implementations of this rule would be a security bug.

Implement contract §4.2 faithfully, including the **20-hop cycle cap**.

### T8 — Specs
Write `docs/04-database/entities/workflow.md`, `workflow-step.md`, `workflow-request.md`, `workflow-history.md`; update `docs/04-database/relationships.md` and `indexes.md`; add `docs/06-api/workflow/*.md` for your endpoints. Follow the existing file format (frontmatter `id`/`type`/`module`/`status`, then Purpose / Design / Validation / Ambiguities).

---

## IMPLEMENTATION RULES
1. **Never hard-code a role name.** No `TEAM_LEAD`/`MANAGER`/`DEPARTMENT_MANAGER` anywhere. Authority is `organizationTypeId` + org-ancestry only.
2. **Never derive the chain from `stepOrder`.** `parentId` is the only chain source.
3. **Controllers do not validate.** All validation in DTOs / class-validator constraints / reusable DTO validators.
4. **Controllers inject string tokens**: `@Inject('IWorkflowService')`. Providers use `useExisting`.
5. **Use inherited `BaseService` methods** wherever they fit. Add a differently named method only for genuinely non-CRUD behaviour, and let it persist via inherited methods (`AGENTS.md`). `$transaction` is permitted only for the multi-table atomic writes in T5/T6.
6. **`entityType: null`** on every workflow service (T2).
7. **Envelope**: every controller returns `ResponseHelper.success({ data, message, meta? })`. Never hand-roll JSON.
8. **Do not write any `.spec.ts` file and do not run tests** — explicitly out of scope (`AGENTS.md` Testing Rules, brief §43). You may run `npx tsc --noEmit` and `npm run build`.
9. **Do not change any contract value.** If something is missing, note it in your final report and ask.
10. **JSX/formatting rules do not apply to you** (backend only), but the coding rules in `AGENTS.md` §Coding do.

## DEFINITION OF DONE
- Migration applies cleanly to a database that already has the existing tables; no data loss.
- `npx prisma generate` run, and the generated client contains all five new models.
- `npx tsc --noEmit` clean (except the two pre-existing failures in `audit-log.listener.spec.ts` / `employee.service.spec.ts`); `npm run build` passes.
- All T2/T5/T6/T7 endpoints exist and return the contract §5.6 shapes exactly.
- `permissions` computation exists in **one** exported place, implements contract §4 including the hop cap.
- `form_schema` and `form_data` validators enforce contract §3 fully, as DTO validators.
- All eleven error codes + exceptions added; `app.module.ts` registers both modules.
- Nothing added to `AuditEntityType`/`AuditAction`/`AuditLogListener`.
- Zero test files created; zero tests run.
- No file from the forbidden list modified.
- Specs written.

## FINAL REPORT FORMAT
```
## Agent 1 — Final Report

### Delivered
- <endpoint / artifact> → <file path>

### Schema & Migration
- Migration name:
- Models added:
- Existing models touched (relation fields only):
- prisma generate run: yes/no

### Shared files edited (once each)
- error-code.constant.ts: <codes added>
- app.exception.ts: <classes added>
- app.module.ts: <modules registered>

### For Agent 2
- Reusable permission function: <exported name + path>
- Reusable form_data validator: <exported name + path>
- TODO markers left for event emission: <file:line>
- NotificationModule expected at: <path>

### For Agent 3
- Response shapes implemented: <confirm identical to contract §5.6, or list deviations>

### Contract deviations
- <none, or exact item + why>

### Verification
- tsc --noEmit: <result>
- npm run build: <result>
- Tests: not created, not run (out of scope)

### Open questions / blockers
```
