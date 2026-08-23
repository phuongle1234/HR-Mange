---
id: TECH-BACKEND
type: technology
module: global
status: draft
---

# Backend

## Purpose
Define backend technology choices.

## Stack
- Runtime: Node.js.
- Language: TypeScript.
- Framework: NestJS.
- ORM: Prisma.
- Database: PostgreSQL.
- Auth: JWT/cookie strategy pending approval.

## Architecture Rules
- Controller -> Service -> Repository -> Prisma -> PostgreSQL.
- DTO validation is required at API boundaries.
- Services own business logic.
- Repositories own database access.
- Shared base classes/interfaces must remain generic.

## Security
- Do not log passwords, JWTs, refresh tokens, reset tokens, secrets, API keys, or credentials.
- Hash passwords with approved secure hashing library.
- Validate and sanitize external input.

## Testing
- Unit tests for controllers/services/repositories.
- HTTP tests for endpoints.
- Integration tests for database flows when implementation exists.

## Pending Decisions
- Exact Node/NestJS versions.
- Password hashing library.
- JWT/cookie strategy.
- Logger library.
