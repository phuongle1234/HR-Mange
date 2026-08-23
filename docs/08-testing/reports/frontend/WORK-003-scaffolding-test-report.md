# WORK-003 — Frontend Project Scaffolding: Test Report

## Scope Covered
`frontend/` Vite + React + TypeScript project skeleton: build tooling, Tailwind v4
("Green Momentum" theme tokens), the provider tree (`ReduxProvider -> QueryProvider
-> AuthProvider -> RouterProvider`, no `PermissionProvider` per `WORK-000` decision
#2), the centralized Axios client + `ApiEndpoints` builder + error normalization,
the empty/central route table, and the folder structure from `FRONTEND-ARCHITECTURE`.

## Environment
- Node v24.15.0, npm 10.8.1, Windows 10.
- Real backend was **not** running during this work; all API-touching tests use
  mocked service modules (see below). No live-backend integration test exists yet
  for this or any other frontend work item — that is a known gap, not a claim of
  something that wasn't actually run.

## Commands Run And Real Results
```text
npm create vite@latest frontend -- --template react-ts     # scaffold, succeeded
npm install                                                  # succeeded, 0 vulnerabilities
npm install react-router-dom @reduxjs/toolkit react-redux \
  @tanstack/react-query axios react-hook-form zod \
  @hookform/resolvers react-toastify tailwindcss @tailwindcss/vite
                                                               # succeeded, 0 vulnerabilities
npm install -D vitest @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event jsdom @types/node
                                                               # succeeded, 0 vulnerabilities
npx tsc -b                                                    # no output = success (0 errors)
npm run build                                                 # succeeded: "vite v8.2.2 ... ✓ built in ~1s"
npm run lint                                                  # oxlint, exit code 0, no findings
npm run dev -- --host 0.0.0.0 --port 5173                    # started, "ready in 723 ms";
                                                               # curl http://localhost:5173/ -> HTTP 200
                                                               # process stopped after the smoke check
npx vitest run                                                # 18 test files, 94 tests, ALL PASSED
```

## Unit Tests (this item's slice)
- `src/shared/api/api-error.test.ts` — 5 tests: Axios-error-with-envelope mapping,
  network error (no response) -> `NETWORK_ERROR`, missing backend message ->
  generic fallback, unknown thrown value -> `UNKNOWN_ERROR`, already-normalized
  error passed through unchanged.
- `src/shared/api/api-endpoints.test.ts` — 2 tests: every auth/employee path
  builder, including URL-encoding of a dynamic id.
- `src/store/auth/auth.slice.test.ts` — 7 tests: initial empty shape and every
  action transition (`setAuthChecking`, `setAuthenticated`, `setUnauthenticated`,
  `setAuthError`, `clearAuth`).

All 14 of the above passed. Full suite result: **94/94 passed** (includes tests
written for WORK-012 through WORK-017, run together since they share the same
`npm run test` command — see those items' own reports for their slice).

## What Was Not Tested
- No test exercises the real backend over HTTP; `docs/06-api` was used as the
  contract and all service-layer calls are mocked in tests.
- No end-to-end/browser automation test (e.g. Playwright) — out of scope per the
  Test Plan, which calls only for unit/component tests.

## Work Status
`IMPLEMENTED`.

## Result
Scaffolding builds, type-checks, lints clean, and boots via both `npm run dev`
and (by construction, matching `infra/Dockerfile.frontend`'s exact command) the
Docker Compose path. No blocking issues found.
