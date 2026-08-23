# EmployeeOS Frontend

React + TypeScript + Vite frontend for the Employee Management System. Implements
`WORK-003` (scaffolding), `WORK-012` (login), `WORK-013` (forgot/change password),
and `WORK-014`–`WORK-017` (employee list/detail/create/edit), per the specs under
`docs/07-frontend`, `docs/05-ui-ux`, and `docs/06-api`.

## Stack

React, TypeScript, Vite, React Router, Redux Toolkit (auth state only), TanStack
Query (server state), Axios, React Hook Form + Zod, Tailwind CSS v4, react-toastify.
Vitest + Testing Library for tests.

## Prerequisites

- Node.js 20+ (developed against Node 24 / npm 10).
- A running backend exposing the API documented in `docs/06-api` (NestJS backend
  in `../backend`), OR just the frontend alone for UI-only work — the app will
  simply show network errors on API calls until a backend is reachable.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # edit VITE_API_BASE_URL if your backend isn't on :3000
```

## Run (local, without Docker)

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:5173` (default Vite port).
To match the Docker port/host exactly:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## Run via Docker Compose

From the repo root:

```bash
docker compose -f infra/docker-compose.yml up frontend
```

This builds `infra/Dockerfile.frontend` (installs dependencies with `npm ci` against
the bind-mounted `frontend/` source) and runs `npm run dev -- --host 0.0.0.0 --port 5173`,
serving on `http://localhost:5173`. The compose file sets `VITE_API_BASE_URL` to
`http://localhost:${APP_PORT:-3000}` automatically — you do not need a `.env` file
for the Docker Compose path. To run the full stack (Postgres + backend + frontend):

```bash
docker compose -f infra/docker-compose.yml up
```

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL the Axios client prepends to every `/api/...` request | `http://localhost:3000` |

## Build

```bash
npm run build
```

Runs `tsc -b` (type-check) then `vite build`. Output goes to `dist/`.

## Lint

```bash
npm run lint
```

Runs `oxlint` over `src/`.

## Tests

```bash
npm run test        # vitest run (single run, CI mode)
npm run test:watch  # vitest (watch mode)
```

Tests use Vitest + `@testing-library/react` + `@testing-library/user-event` with a
`jsdom` environment (see `vite.config.ts`'s `test` block and `src/test/setup.ts`).
Component tests mock the feature API service modules (`employeeApiService`,
`authApiService`) rather than hitting a real backend — see
`docs/08-testing/reports/frontend/` for the full test reports and known gaps
(no test currently exercises a live backend).

## Project structure

```text
src/
├── app/App.tsx              # Provider tree: Redux -> Query -> Auth -> Router
├── routes/app.routes.tsx    # Central route table (only place routes are declared)
├── routes/guards/           # AuthGuard, PublicOnlyGuard
├── layouts/                 # AuthLayout, AppLayout, NotFoundLayout
├── providers/                # AuthProvider, useAuth
├── store/                    # Redux store + authSlice (the ONLY slice — no server
│                              data or form state lives in Redux)
├── shared/
│   ├── api/                  # Axios client, ApiEndpoints, error normalization,
│   │                          base HTTP service
│   ├── auth/token-storage.ts # The only module that touches localStorage
│   ├── components/           # Button, TextField, SelectField, ConfirmDialog, ...
│   ├── hooks/                 # useDebouncedValue
│   ├── utils/                 # cn, api-error-mapping
│   └── validation/
└── features/
    ├── auth/                 # Login, Forgot Password, Change Password
    └── employee/             # Employee List/Detail/Create/Edit
```

## Notable implementation decisions (see the final report for the full list)

- No Department field anywhere (removed per `WORK-000` decision #1).
- No permission/role model — every authenticated user sees every action
  (removed per `WORK-000` decision #2).
- Hard delete, no undo UI (`WORK-000` decision #3).
- Bearer token stored in Redux + persisted to `localStorage` via
  `src/shared/auth/token-storage.ts`; Axios attaches `Authorization: Bearer <token>`
  from the Redux store (`WORK-000` decision #4).
- Employee status badge colors (ACTIVE/INACTIVE/ON_LEAVE/TERMINATED) have no
  approved visual precedent in the UI previews — see
  `src/features/employee/components/StatusBadge.tsx` for the implementation default
  used (documented there and flagged in the final report).
