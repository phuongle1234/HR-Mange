---
id: WORKFLOW-DEFINITION-OF-DONE
type: workflow
module: global
status: draft
---

# Definition Of Done

## Purpose
Define completion criteria for implementation work.

## Done Criteria
- Related specs are read and updated if required.
- Implementation matches approved/draft spec scope.
- No undocumented business rules were added.
- Unit tests are created/updated where applicable.
- HTTP/API tests are created/updated for API work.
- Frontend component/hook tests are created/updated where applicable.
- Commands are documented.
- Markdown test report is created/updated.
- Tests are executed or explicitly marked not run with reason.
- Security-sensitive data is not logged or exposed.

## Not Done
Work is not done if:
- Required specs are missing or contradicted.
- Tests are missing without explanation.
- Test results are claimed without execution.
- API URLs are hard-coded in components.
- Database fields are added without database spec.
- Permissions are invented without spec.

## Pending Decisions
- CI quality gates.
- Minimum coverage thresholds.
