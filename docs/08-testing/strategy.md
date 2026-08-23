---
id: TEST-STRATEGY
type: testing
module: global
status: draft
---

# Strategy

## Purpose
Define the testing strategy for implementation tasks.

## Testing Principles
- Tests are required for implementation tasks.
- Do not claim tests passed unless executed.
- Keep test scope proportional to risk and blast radius.
- API and frontend behavior must be tested at their boundaries.

## Required Test Artifacts
- Unit test files.
- HTTP/API test files for backend endpoints.
- Integration tests for cross-layer flows when applicable.
- Frontend component/hook tests when frontend is implemented.
- Command documentation.
- Markdown test report.

## Coverage Areas
| Area | Required Focus |
| --- | --- |
| Auth | Login, logout, Get Me, change password, forgot password. |
| Employee | List, detail, create, update, delete. |
| Permissions | Allowed/denied route and action states. |
| Error handling | Validation, unauthorized, forbidden, not found, conflict. |
| UI confirmations | Create/update/delete confirm popup behavior. |

## Reporting
- Record commands run.
- Record pass/fail result.
- Record skipped tests and reason.
- Record known risks.
