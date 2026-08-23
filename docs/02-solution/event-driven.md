---
id: SOLUTION-EVENT-DRIVEN
type: solution
module: global
status: draft
---

# Event Driven

## Purpose
Define draft event-driven behavior for important system changes.

## Candidate Events
- Employee created.
- Employee updated.
- Employee deleted.
- Password changed.
- Password reset requested.

## Event Rules
- Events must not contain passwords, tokens, reset tokens, secrets, or unnecessary sensitive data.
- Events should include safe identifiers and timestamps if approved.
- Event publishing should happen after successful persistence.
- Retry/dead-letter behavior is pending approval.

## Audit Relationship
- Audit logs record important actions.
- Events notify other parts of the system if event-driven behavior is approved.
- Audit logs and events may share safe metadata but have different purposes.

## Pending Decisions
- Whether events are required in this phase.
- Event transport.
- Event payload shape.
- Retry and failure behavior.
