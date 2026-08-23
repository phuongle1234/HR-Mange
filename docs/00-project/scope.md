---
id: PROJECT-SCOPE
type: project
module: global
status: draft
---

# Scope

## In Scope
- Specification-first Employee Management System.
- Authentication and authorization specs.
- Employee list, detail, create, update, and delete workflows.
- Login, forgot password, change password, logout, and current-user auth flows.
- Backend API design with NestJS-style layering.
- Frontend design with React, React Router, Redux Toolkit, TanStack Query, Axios, React Hook Form, and Zod.
- PostgreSQL and Prisma database specifications when database work is requested.
- UI/UX specs including layout, green theme, responsive behavior, and page states.
- Testing specs, workflow specs, and work item templates.
- Docker/infrastructure specifications when infrastructure files/specs are created.

## Out Of Scope For Specification Initialization
- Application source code implementation.
- Prisma schema and migration implementation.
- Docker implementation files unless explicitly requested.
- Production deployment configuration.
- Final approval of draft business rules.

## Local Development Docker Environment
The user explicitly requested a local development Docker environment: a debuggable backend container (VS Code attach), a frontend container, both hot-reloading from host source changes, and a PostgreSQL + pgAdmin pair sharing a Docker network. This satisfies the "unless explicitly requested" carve-out above, so `infra/docker-compose.yml`, `infra/Dockerfile.backend`, and `infra/Dockerfile.frontend` are implemented (see `TECH-INFRASTRUCTURE`). The `backend`/`frontend` services only build once application source exists at `backend/` and `frontend/`; `postgres`/`pgadmin` are usable today. Production deployment remains out of scope and unapproved.

## Current Modules
| Module | Scope |
| --- | --- |
| Auth | Login, session validation, logout, forgot password, change password. |
| Employee | List, detail, create, update, delete. |
| Permission | Route and action authorization. |
| Audit Log | Required for important employee changes, payload pending approval. |
| Infrastructure | Local Docker dev environment (backend, frontend, PostgreSQL, pgAdmin) per `TECH-INFRASTRUCTURE`. |

## Blocked Or Pending Areas
All previously blocking decisions were resolved in `WORK-000` (see `docs/09-workflow/session-context.md`): Department was removed from scope, no permission/role model, hard delete, Bearer token auth. Employee field max lengths, the status enum, password policy, and the audit payload shape were assigned documented defaults (not separately user-confirmed) rather than left blocking.
