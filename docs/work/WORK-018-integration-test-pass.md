---
id: WORK-018
type: workflow
module: global
status: draft
depends_on:
  - 08-TESTING-STRATEGY
  - 08-TESTING-INTEGRATION-TEST
---

# WORK-018: End-to-End Integration & Test Pass

## Work Status
`DRAFT` — sequenced last; effectively blocked until every other item is `DONE`.

## Summary
Wire the finished frontend to the finished backend (both running through `infra/docker-compose.yml`), replace the static `docs/05-ui-ux-preview` HTML as the visual source of truth with the real running app, and run the full test suite end-to-end per `08-testing/strategy.md` and `08-testing/integration-test.md`.

## Scope
In scope:
- Manual + automated walk of every golden path: login → employee list → create → detail → edit → delete → logout, plus forgot/change password.
- Cross-check the running app against every `docs/05-ui-ux-preview/pages/*.html` file; any real deviation gets synced back into the spec per `AGENTS.md`'s Specification Sync Rules, not silently left stale.
- Full integration test run (`08-testing/integration-test.md` scope: DB/auth/mutation flows across layers).
- Consolidated test report referencing every prior item's individual report.

Out of scope:
- New features not already covered by `WORK-005`–`WORK-017`.

## Dependencies
- Specs: `docs/08-testing/strategy.md`, `docs/08-testing/integration-test.md`, `docs/09-workflow/definition-of-done.md`.
- Work items: all of `WORK-001` through `WORK-017`.

## Test Plan
- Integration tests: full auth + employee CRUD flow against the real Dockerized stack.
- Regression check: re-run each individual item's test suite together, not just in isolation.
- Commands: consolidated in `docs/08-testing/commands.md`.
- Report: `docs/08-testing/reports/integration/WORK-018-integration-test-report.md`, plus an update to `docs/09-workflow/session-context.md` per the Session Context Log rule.

## Test Result
NOT RUN — sequenced last.

## Risks / Ambiguities
- Any spec/implementation mismatch discovered here must be resolved per `AGENTS.md`'s Specification Sync Rules (prefer the latest requested behavior, update the spec, don't silently patch around it).
- This item is the natural point to re-open any `WORK-000` decision that turned out wrong once seen running end-to-end — record that as a new work item rather than quietly patching it here.
