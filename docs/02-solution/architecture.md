---
id: SOLUTION-ARCHITECTURE
type: solution
module: global
status: draft
---

# Architecture

## Purpose
Define the high-level solution architecture for the Employee Management System.

## System Shape
```text
Browser React App
    ↓ HTTPS / API
NestJS Backend API
    ↓ Prisma
PostgreSQL
```

Supporting concerns:
- Authentication.
- Authorization.
- Audit logging.
- Event emission if approved.
- Daily application logs.
- Testing and workflow documentation.

## Architectural Principles
- Specification first.
- Modular feature boundaries.
- Backend controllers handle HTTP only.
- Backend services own application/business logic.
- Backend repositories own database access.
- Frontend pages orchestrate hooks and UI, not raw HTTP.
- API contracts must be documented before implementation.

## Modules
| Module | Responsibility |
| --- | --- |
| Auth | Login, session validation, logout, forgot password, change password. |
| Employee | Employee list, detail, create, update, delete. |
| Permission | Route/action authorization. |
| Audit Log | Important change recording. |
| Shared | Logging, error handling, API conventions, utilities. |

## Data Flow
```text
Frontend route/page
    ↓
Frontend API service
    ↓
Backend controller
    ↓
Backend service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

## Pending Decisions
- Exact auth token/cookie strategy.
- Department model.
- Delete strategy.
- Event bus implementation.
- Deployment/infrastructure implementation.
