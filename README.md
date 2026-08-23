# Employee Management System

This repository starts as a specification-first project for an Employee Management System. The current phase creates documentation, rules, templates, and work structure only. It does not implement NestJS, React, Prisma, Docker, authentication, APIs, or UI code.

## Technology Stack
- Backend: NestJS, TypeScript, PostgreSQL, Prisma ORM, JWT authentication.
- Frontend: ReactJS, TypeScript, React Router, Redux Toolkit, TanStack Query, Axios.
- Infrastructure: Docker, Docker Compose, PostgreSQL, optional Nginx.

## Specification Structure
- `docs/00-project`: vision, scope, glossary, conventions.
- `docs/01-business`: business overview, rules, use cases, workflows, module rules.
- `docs/02-solution`: architecture, auth, authorization, events, errors, logging.
- `docs/03-technology`: backend, frontend, database, infrastructure, dependencies.
- `docs/04-database`: database architecture, conventions, relationships, indexes, migrations, entities.
- `docs/05-ui-ux`: design system, layout, navigation, responsive behavior, page specs.
- `docs/06-api`: API conventions and one file per API endpoint.
- `docs/07-frontend`: frontend architecture and page lifecycle specs.
- `docs/08-testing`: test strategy, commands, and reports.
- `docs/09-workflow`: development flow, AI flow, Definition of Done, change management.
- `docs/work`: work items and copyable templates.

## Specification Dependency
```text
Business
    ↓
UI/UX
    ↓
Solution
    ↓
Database
    ↓
API
    ↓
Backend
    ↓
HTTP Test
    ↓
Frontend
    ↓
Integration
```

Core implementation flow:

```text
Business
    ↓
Solution
    ↓
Database
    ↓
API
    ↓
Frontend
```

## Development Workflow
1. Review and approve relevant specification files.
2. Create a work item in `docs/work`.
3. Implement only what approved specs define.
4. Create UT files, HTTP files for APIs, command documentation, and test report.
5. Update specs when requirements change.

## AI Coding Workflow
AI must read relevant specs before coding, preserve user-edited specification content, avoid undocumented assumptions, and record ambiguities instead of deciding for the user.

## Testing Workflow
Testing specs live in `docs/08-testing`. Each implementation report must state whether tests were run. If tests were not run, it must say `NOT RUN` and provide the reason.

## Docker/Infra Overview
Infrastructure is planned under `infra/` and `docs/03-technology/infrastructure.md`. This phase only documents infrastructure expectations; Docker implementation is intentionally not created yet.
