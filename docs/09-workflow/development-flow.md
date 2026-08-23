---
id: WORKFLOW-DEVELOPMENT-FLOW
type: workflow
module: global
status: draft
---

# Development Flow

## Purpose
Define human/developer implementation flow after specs exist.

## Flow
```text
Select work item
    ↓
Read dependency specs
    ↓
Confirm unresolved decisions
    ↓
Design implementation plan
    ↓
Implement scoped changes
    ↓
Run tests
    ↓
Update docs/test report
    ↓
Review
```

## Branch/Commit Rules
- Branching strategy is pending approval.
- Commit only when requested or workflow requires it.
- Do not include secrets in commits.

## Implementation Rules
- Backend follows Controller -> Service -> Repository -> Prisma -> PostgreSQL.
- Frontend follows provider/router/service/query patterns.
- Shared values belong in constants/config.
- Errors must be logged/mapped safely at boundaries.

## Pending Decisions
- Branch naming.
- Review requirements.
- Release process.
