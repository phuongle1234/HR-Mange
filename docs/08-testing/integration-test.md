---
id: TEST-INTEGRATION-TEST
type: testing
module: global
status: draft
---

# Integration Test

## Purpose
Define integration testing expectations for cross-layer behavior.

## Backend Integration Scope
- Controller/service/repository/database flow.
- Auth session validation.
- Employee mutation persistence.
- Audit log creation when audit implementation exists.

## Frontend Integration Scope
- Route guard behavior.
- Query/mutation hooks with mocked API.
- Form validation to mutation flow.
- Confirm popup to mutation flow.

## Rules
- Use isolated test database when database tests exist.
- Seed only required data.
- Clean up test data.
- Do not use production secrets or data.

## Pending Decisions
- Test database strategy.
- E2E browser testing tool.
- CI execution environment.
