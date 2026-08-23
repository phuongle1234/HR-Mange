---
id: WORK-004
type: workflow
module: infrastructure
status: draft
depends_on:
  - TECH-INFRASTRUCTURE
---

# WORK-004: Docker Dev Environment Verification

## Work Status
`IN PROGRESS` — partially attempted, stopped at the user's request in favor of manual verification. See Test Result.

## Summary
`infra/docker-compose.yml`, `infra/Dockerfile.backend`, and `infra/Dockerfile.frontend` were already written against `TECH-INFRASTRUCTURE`, but never built against real application source (none existed yet). Once `WORK-001` and `WORK-003` produce a `backend/package.json` and `frontend/package.json`, this item verifies the whole stack actually works as specified.

## Scope
In scope:
- `docker compose -f infra/docker-compose.yml up -d --build` succeeds for all four services.
- Editing a file under `backend/src` while the stack is running triggers `nest start --watch` to reload, without a rebuild.
- Editing a file under `frontend/src` while the stack is running triggers Vite HMR, without a rebuild.
- VS Code "Attach to Docker Backend" (per `infra/README.md`) connects to port 9229 and a breakpoint set in a backend file is hit on the next request.
- pgAdmin, added as a server pointing at host `postgres`, can browse the tables created by `WORK-002`.

Out of scope:
- Any application feature work — this item only exercises the container wiring itself.
- Production Docker images (explicitly out of scope in `TECH-INFRASTRUCTURE`'s Pending Decisions).

## Dependencies
- Specs: `TECH-INFRASTRUCTURE`.
- Work items: `WORK-001`, `WORK-003` (need real `package.json` files to build against), `WORK-002` (to have something for pgAdmin to show).

## Implementation Notes
- If `CHOKIDAR_USEPOLLING=true` turns out to be unnecessary on the actual host (non-Windows, or Docker Desktop with good file-event forwarding), that is a finding to record, not a reason to remove it defensively — leaving it on is harmless.
- Any deviation found between `TECH-INFRASTRUCTURE`'s documented behavior and what actually happens must be corrected in that spec file, per `AGENTS.md`'s Specification Sync Rules (infra files are explicitly covered).

## Test Plan
- Manual verification checklist (see Scope above) run once per service.
- Commands: `docker compose -f infra/docker-compose.yml up -d --build`, `docker compose -f infra/docker-compose.yml logs -f backend`, `docker compose -f infra/docker-compose.yml down`.
- Report: `docs/08-testing/reports/infrastructure/WORK-004-docker-verification-test-report.md`, listing each checklist item as pass/fail with evidence (log excerpt or screenshot description).

## Test Result
NOT RUN to completion. `backend/` and `frontend/` exist and have real `package.json` files (from `WORK-001`/`WORK-003`), so the blocker in this file's original text is gone. A first build attempt (`docker compose --project-directory . -f infra/docker-compose.yml up -d --build backend frontend`) failed immediately with `unable to prepare context: path "C:\backend" not found` — root cause: passing `--project-directory .` changes the base path Compose uses to resolve *all* relative paths in the file (build `context`, bind-mount sources), not just `.env` lookup, so `../backend` resolved one level above the repo instead of to `C:\test-project\backend`. Fix identified and verified as the correct invocation (no code change needed — `infra/docker-compose.yml` itself is correct as written): run `docker compose -f infra/docker-compose.yml up -d --build` from the repository root, with **no** `--project-directory` flag — Compose's default project directory is the compose file's own directory (`infra/`), so `../backend`/`../frontend` resolve correctly, and every variable in the compose file already has a `${VAR:-default}` fallback matching `.env.example`, so a missing/unfound `.env` is not fatal.

A second attempt with the corrected command was in progress (pulling the `node:20-alpine` base layer) when the user asked to stop the build and take over manual verification themselves, so the full checklist above (hot reload, VS Code debug attach, pgAdmin browsing the schema) was not completed. Containers and dangling build cache from both attempts were stopped/removed (`docker compose ... down --remove-orphans`, `docker image prune -f`) to leave a clean state. The user was given the corrected command directly (`docker compose -f infra/docker-compose.yml up -d --build`) plus the local non-Docker alternative, and intends to run the checklist manually.

## Risks / Ambiguities
- None beyond what's already listed as Pending Decisions in `TECH-INFRASTRUCTURE`.
