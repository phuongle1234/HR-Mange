---
id: PROJECT-CONVENTIONS
type: project
module: global
status: draft
---

# Conventions

## Purpose
Define the documentation and specification rules for this project.

## YAML Metadata
Every spec must start with YAML front matter:

```text
---
id: SPEC-ID
type: project | business | solution | technology | database | ui | api | frontend | testing | workflow | template
module: global | employee | auth | module-name
status: draft
depends_on:
  - RELATED-SPEC-ID
---
```

Rules:
- `status` starts as `draft`.
- Do not change `status` to `approved` without explicit user confirmation.
- `id` must be stable and unique.
- Use uppercase IDs with domain prefix, for example `API-AUTH-LOGIN`, `UI-EMPLOYEE-CREATE`, `WORK-001`.
- Keep dependencies explicit when a spec depends on another spec.

## Specification Order
Read related specs in this order before implementation:

```text
00-project
01-business
02-solution
03-technology
04-database
05-ui-ux
06-api
07-frontend
08-testing
09-workflow
```

Backend API tasks must read project, business, solution, technology, database, and API specs.
Frontend tasks must read project, business, solution, technology, UI/UX, API, and frontend specs.

## Writing Rules
- Do not invent business rules, fields, permissions, APIs, or architecture decisions.
- Record missing information in `Pending Decisions` or `Ambiguities`.
- Use concise tables for fields, endpoints, permissions, and states.
- Use text diagrams for flow and layout where helpful.
- Keep security-sensitive behavior explicit.

## Implementation Boundary
- Specs describe intended behavior.
- Source code must not be implemented until the related specs are sufficiently defined for the task.
- Database changes require database spec updates before schema or migration work.

## Testing Rule
Every implementation task must include:
- Unit test files where applicable.
- HTTP/API test files for APIs.
- Command documentation.
- Markdown test report.
- Honest result reporting; do not claim tests passed unless executed.
