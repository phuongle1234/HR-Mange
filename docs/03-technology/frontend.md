---
id: TECH-FRONTEND
type: technology
module: global
status: draft
---

# Frontend

## Purpose
Define frontend technology choices.

## Stack
- React.
- TypeScript.
- React Router.
- Redux Toolkit.
- TanStack Query.
- Axios.
- React Hook Form.
- Zod.
- Tailwind CSS.
- `react-toastify`.

## Rules
- Redux is for global client state.
- TanStack Query is for server state.
- React Hook Form is for form state.
- Local React state is for UI-only state.
- API URLs must be centralized.
- Components must not call Axios directly.

## UI Theme
- Use Green Momentum theme from UI/UX design system.
- Auth forms are centered.
- Admin pages are work-focused.

## Testing
- Component tests for pages and guards.
- Unit tests for helpers, schemas, reducers.
- API service tests with mocked Axios.

## Pending Decisions
- Component library.
- Build tool configuration.
- Exact Tailwind setup.
- URL search param sync behavior.
