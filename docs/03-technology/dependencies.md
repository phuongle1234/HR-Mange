---
id: TECH-DEPENDENCIES
type: technology
module: global
status: draft
---

# Dependencies

## Purpose
Track required dependency categories before implementation.

## Backend Dependencies
- NestJS core packages.
- Prisma client and CLI.
- PostgreSQL driver support through Prisma.
- Validation library for DTOs.
- Password hashing library pending approval.
- JWT/cookie/session libraries pending auth strategy approval.
- Logger library pending approval.

## Frontend Dependencies
- React.
- TypeScript.
- React Router.
- Redux Toolkit.
- TanStack Query.
- Axios.
- React Hook Form.
- Zod.
- `@hookform/resolvers`.
- `react-toastify`.
- Tailwind CSS.

## Testing Dependencies
- Unit test runner pending implementation choice.
- HTTP/API testing tool pending implementation choice.
- Frontend component testing tool pending implementation choice.

## Rules
- Do not add runtime dependencies without a spec or implementation need.
- Prefer existing project stack over introducing alternatives.
- Security-related dependencies must be maintained and reviewed.

## Pending Decisions
- Exact package versions.
- Test framework.
- Component library.
- Logger package.
