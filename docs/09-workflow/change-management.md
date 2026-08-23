---
id: WORKFLOW-CHANGE-MANAGEMENT
type: workflow
module: global
status: draft
---

# Change Management

## Purpose
Define how changes to specs and implementation should be controlled.

## Change Types
- Spec clarification.
- New feature spec.
- API contract change.
- Database design change.
- UI/UX behavior change.
- Implementation change.
- Test update.

## Rules
- Update specs before implementation when behavior changes.
- Database changes require database spec update before schema/migration.
- API changes require API spec update before backend/frontend implementation.
- UI behavior changes require UI/UX and frontend spec alignment.
- Testing expectations must be updated when workflows change.

## Approval
- Draft specs remain draft.
- Do not mark approved without explicit user confirmation.
- Record pending decisions instead of silently assuming.

## Risk Management
- Identify affected modules.
- Identify required tests.
- Preserve backward compatibility where specs require it.
