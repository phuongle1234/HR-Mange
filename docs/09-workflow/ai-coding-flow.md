---
id: WORKFLOW-AI-CODING-FLOW
type: workflow
module: global
status: draft
---

# Ai Coding Flow

## Purpose
Define how AI-assisted coding work should proceed.

## Required Flow
```text
Read related specs
    ↓
Identify ambiguities
    ↓
Update specs if requested
    ↓
Implement only approved/defined behavior
    ↓
Run relevant tests
    ↓
Create/update test report
    ↓
Summarize changes and risks
```

## Rules
- Preserve user-edited specs.
- Do not revert unrelated changes.
- Do not invent business rules, APIs, fields, permissions, or architecture decisions.
- Ask or mark pending when information is missing.
- Keep implementation scoped to the work item.

## Reporting
- Mention changed files.
- Mention tests run or not run.
- Mention blockers and pending decisions.
