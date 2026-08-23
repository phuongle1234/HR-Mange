---
id: TEST-UNIT-TEST
type: testing
module: global
status: draft
---

# Unit Test

## Purpose
Define unit testing expectations.

## Backend Unit Tests
Test:
- DTO validation helpers.
- Services with mocked repositories.
- Controllers with mocked services.
- Error mapping helpers.
- Auth password/change/forgot flows without real secrets.

## Frontend Unit Tests
Test:
- Zod schemas.
- Payload builders.
- API error mappers.
- Redux slices/selectors.
- Permission helper functions.
- Confirm popup state helpers when extracted.

## Rules
- Mock external systems.
- Do not use real credentials.
- Test success and failure paths.
- Do not assert implementation details that make refactoring painful unless behavior requires it.

## Required Reporting
- Test file paths.
- Commands run.
- Result summary.
- Uncovered risks.
