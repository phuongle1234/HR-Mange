---
id: WORKFLOW-AI-AGENT-ONBOARDING
type: workflow
module: global
status: draft
---

# AI Agent Onboarding

This file is the first human-readable map for an AI agent entering this repository. It explains what to read, why to read it, and how the project memory/session/history files fit together.

## Quick Mental Model

```text
AGENTS.md
= rules the AI must obey

docs/00-project..07-frontend
= product/system specifications

docs/09-workflow/memory.yaml
= compact durable knowledge future agents should remember

docs/09-workflow/session-context.md
= current handoff state for this conversation/workstream

docs/09-workflow/history/YYYY-MM-DD.jsonl
= append-only chronological log of what happened
```

Do not treat history as the source of truth for current behavior. Current user instruction, current specs, current source code, and `AGENTS.md` outrank old history.

## First Files To Read

Read in this order when entering the project:

1. `AGENTS.md`

   Understand mandatory project rules: planning, debugging boundaries, spec-first implementation, spec sync, backend architecture, frontend architecture, testing restrictions, and end-of-session logging.

2. `docs/09-workflow/memory.yaml`

   Get the compact durable facts the previous agent wanted future agents to remember: where specs live, backend/frontend rules, BaseService expectations, testing rules, and memory/history/session responsibilities.

3. `docs/09-workflow/session-context.md`

   Learn the current handoff state: what the user asked recently, what changed, what remains partial, and what not to accidentally assume is complete.

4. Relevant work item under `docs/work/`

   If the user names a work item such as `WORK-024`, read that file before touching code. It defines task scope, dependencies, acceptance criteria, and out-of-scope boundaries.

5. Relevant specs

   Read the spec folders required by `AGENTS.md` for the task type.

## Spec Reading Flow

Backend/API tasks must read:

```text
docs/00-project
docs/01-business
docs/02-solution
docs/03-technology
docs/04-database
docs/06-api
```

Frontend tasks must read:

```text
docs/00-project
docs/01-business
docs/02-solution
docs/03-technology
docs/05-ui-ux
docs/06-api
docs/07-frontend
```

Do not invent missing fields, routes, permissions, workflows, or business rules. If a spec is missing or contradictory, record the ambiguity and ask for confirmation.

## Backend Rules To Carry Forward

- Default flow: `Controller -> Interface / Abstraction -> Service -> BaseService -> Prisma -> PostgreSQL`.
- Controllers inject interface tokens such as `@Inject('IEmployeeService')`.
- Controllers do not validate request data. Validation belongs in DTOs, class-validator/class-transformer decorators, pipes, or reusable DTO validators.
- Use inherited `BaseService` CRUD/bulk methods directly when they fit the API behavior.
- `BaseService.updateMany` callers map DTO rows to `Array<{ id, data }>`.
- Optional update fields are included only when present. Do not use fake defaults that overwrite existing data.
- Caller decides persisted data shape, including `createdByUserId` and `updatedByUserId`.
- `actorUserId` is only for audit actor metadata.
- `auth` is an explicit older exception that still uses `UserRepository`; do not refactor it unless asked.

## Frontend Rules To Carry Forward

- React Router handles routes.
- Redux Toolkit stores global client state only.
- TanStack Query owns server state.
- Local React state is for UI-only state.
- Axios calls go through shared API services.
- API endpoint paths live in `frontend/src/shared/api/api-endpoints.ts`.
- List pages with search/page/limit/sort/sort-order use shared list-query state such as `useListQueryState`.
- JSX attributes stay on one line per element/component.
- Organization Create/Edit modals currently expose Organization Type (`organizationTypeId`) but not the old enum **Type** field.

## Testing Rules To Carry Forward

- Do not create unit test files or run tests unless the user explicitly asks.
- If Playwright is used or a Playwright config is created/updated, default to visible browser execution with `use: { headless: false }`.
- Do not switch Playwright to headless mode unless the user explicitly asks.

## Current Important Project Context

- The project is an EmployeeOS / Employee Management System.
- Backend is NestJS + Prisma + PostgreSQL.
- Frontend is React + TypeScript + TanStack Query + Redux Toolkit.
- `WORK-025` Organization Real API Wiring was implemented and built.
- `WORK-024` backend work was started but remains incomplete/partial in the worktree. Do not assume it is finished.

## History Usage

Daily JSONL history lives at:

```text
docs/09-workflow/history/YYYY-MM-DD.jsonl
```

**Always write history through the helper script — never hand-write a line into a `.jsonl` file.** Hand-writing skips the automatic secret redaction and `event_type` validation the scripts provide. **Run all three from the repo root (`c:\test-project`)**; they resolve paths against the current directory and will silently create a stray `history/` folder elsewhere if run from another location.

```powershell
# Write one event (required: -EventType, -SessionId, -Scope; optional: -TaskId, -Actor, -Summary)
.\docs\09-workflow\scripts\history\append-history.ps1 -EventType task_completed -SessionId "2026-08-28-a" -TaskId "WORK-024" -Scope "backend/invitations" -Summary "InvitationsService now extends BaseService"

# Look up what happened (filter by -SessionId / -TaskId / -EventType / -Scope)
.\docs\09-workflow\scripts\history\query-history.ps1 -TaskId "WORK-024" | Format-Table

# Integrity check: exits 1 on bad JSON, missing fields, bad event_type, or an unredacted secret
.\docs\09-workflow\scripts\history\validate-history.ps1
```

`-EventType` must be one of the allow-listed values (the script throws otherwise): `session_started`, `session_completed`, `task_started`, `task_resumed`, `task_paused`, `task_completed`, `task_failed`, `user_instruction`, `decision`, `finding`, `finding_updated`, `blocker_found`, `blocker_resolved`, `source_inspected`, `file_modified`, `command_executed`, `test_started`, `test_result`, `build_result`, `validation_result`, `artifact_created`, `artifact_updated`, `memory_candidate_created`, `memory_promoted`, `memory_superseded`, `conflict_detected`, `error`, `checkpoint`. One call writes one event, so several notable events means several calls. History is append-only: never edit past lines — append a correction event instead.

Use `query-history.ps1` rather than reading whole JSONL files, and only when previous execution evidence is needed (what happened in a task, why a decision was made, what verification was performed). Do not load every JSONL file by default.

See `docs/09-workflow/memory.yaml` → `history_scripts` for the full reference.

## End Of Every Task

Before finishing a task:

1. Update related specs if implementation behavior changed.
2. Update `docs/09-workflow/memory.yaml` if durable knowledge changed.
3. Append meaningful events to the daily history via `append-history.ps1` (see "History Usage" above) — not by editing the `.jsonl` file directly.
4. Update `docs/09-workflow/session-context.md` with the latest handoff.
5. Report what changed and what was verified.

Keep memory compact, history chronological, and session context useful for the next handoff.
