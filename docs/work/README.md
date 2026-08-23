---
id: WORK-README
type: workflow
module: global
status: draft
---

# Work Management

## Purpose
Define work item tracking for specification-first development.

## Work Item ID
Use IDs such as:

```text
WORK-001
WORK-002
```

## Statuses
| Status | Meaning |
| --- | --- |
| `DRAFT` | Work idea exists but is not designed. |
| `DESIGN` | Specs are being written or updated. |
| `REVIEW` | Ready for user/spec review. |
| `APPROVED` | Approved to implement. |
| `IMPLEMENTING` | Code work is in progress. |
| `IMPLEMENTED` | Code is complete but tests/review may remain. |
| `TESTING` | Tests are being run/fixed. |
| `DONE` | Meets Definition of Done. |
| `BLOCKED` | Cannot proceed without decision/dependency. |

## Required Work Item Sections
- Summary.
- Scope.
- Dependencies.
- Implementation notes.
- Test plan.
- Test result.
- Risks/ambiguities.

## Rules
- Link work items to spec IDs.
- Keep blocked decisions visible.
- Do not mark DONE without test/report status.
