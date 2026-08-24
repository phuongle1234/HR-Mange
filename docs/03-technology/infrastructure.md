---
id: TECH-INFRASTRUCTURE
type: technology
module: global
status: draft
---

# Infrastructure

## Purpose
Define the local development Docker environment: containerized backend and frontend with debugging and hot reload, plus PostgreSQL and pgAdmin sharing one network. This spec covers local development only; production deployment stays out of scope (see `PROJECT-SCOPE`).

## Target Components
- Backend API container (NestJS), debuggable from VS Code, source hot-reloaded from the host.
- Frontend container (React/Vite), source hot-reloaded from the host.
- PostgreSQL container.
- pgAdmin container, sharing a Docker network with PostgreSQL so it can connect by service name.
- Optional reverse proxy if approved (not part of this draft).

## Docker Compose Layout
```text
infra/
  docker-compose.yml
  Dockerfile.backend
  Dockerfile.frontend
  README.md
```

Build context: `docker-compose.yml` builds `backend` from `../backend` and `frontend` from `../frontend` (sibling directories at the repository root). Until those application directories exist, only the `postgres` and `pgadmin` services can actually run; `backend`/`frontend` are ready to build the moment application source with a `package.json` is added at those paths.

## Network
- All four services join a single bridge network, `employeeos-network`.
- Containers reach each other by service name (`postgres`, `pgadmin`, `backend`, `frontend`), not `localhost`.
- The host reaches every service through published ports (see below).

## Services

### postgres
- Image: `postgres:16-alpine`.
- Named volume `postgres-data` for data persistence across restarts.
- Published port: `POSTGRES_PORT` (default `5432`).
- Healthcheck via `pg_isready` gates `pgadmin` and `backend` startup.

### pgadmin
- Image: `dpage/pgadmin4`.
- Published port: `PGADMIN_PORT` (default `5050`) → container port `80`.
- Connects to PostgreSQL using host `postgres` (the service name) on the shared network, not `localhost`.
- Named volume `pgadmin-data` persists saved server connections across restarts.

### backend
- Built from `Dockerfile.backend` (dev-only image: installs dependencies, does not bundle for production).
- Bind-mounts the host `backend/` source into the container so edits on the host take effect without rebuilding the image.
- An anonymous volume covers `/app/node_modules` inside the container so the host bind mount does not overwrite container-installed dependencies (needed because some native modules differ between host OS and the Linux container).
- Runs with the Nest CLI watch flag and remote debugging bound to all interfaces: `nest start --debug=0.0.0.0:9229 --watch`, so the process both hot-reloads on file change and exposes a Node inspector.
- Published ports: `APP_PORT` (default `3000`, HTTP API) and `BACKEND_DEBUG_PORT` (default `9229`, Node inspector).
- `DATABASE_URL` is set inside the compose file to point at the `postgres` service by name, independent of the host-facing `DATABASE_URL` in `.env.example` (which uses `localhost`, for running the backend directly on the host without Docker).

### frontend
- Built from `Dockerfile.frontend` (dev-only image).
- Bind-mounts the host `frontend/` source, with the same node_modules-volume pattern as `backend`.
- Runs the dev server bound to all interfaces so the host browser can reach it: `npm run dev -- --host 0.0.0.0 --port 5173`.
- Published port: `FRONTEND_PORT` (default `5173`).

### Local CORS
- `FRONTEND_URL` is the canonical configured frontend origin.
- In `NODE_ENV=development`, the backend also allows browser origins running the Vite dev server on port `5173` (for example `http://localhost:5173`, `http://127.0.0.1:5173`, or a LAN IP shown by Vite) so local testing through Vite's network URLs does not fail CORS preflight.
- Non-development environments must use the configured `FRONTEND_URL` only unless a later deployment spec defines an explicit allowlist.

## Debugging From VS Code
Once `backend` is running, attach VS Code to the exposed inspector port instead of launching the process from VS Code directly. Example `launch.json` entry (documented here, not created automatically in the user's VS Code settings):
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Docker Backend",
  "address": "localhost",
  "port": 9229,
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app",
  "restart": true
}
```
`restart: true` lets VS Code re-attach automatically after `--watch` restarts the process on a file change.

## Hot Reload Notes
- Both `backend` and `frontend` set `CHOKIDAR_USEPOLLING=true` in the compose file. Bind-mounted file change events do not always propagate reliably from a Windows host into a Linux container; polling is the fallback that keeps hot reload working in that case, at the cost of slightly higher CPU use.

## Environment
Variables consumed by `infra/docker-compose.yml`, sourced from `.env` (see `.env.example`):
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`.
- `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`, `PGADMIN_PORT`.
- `APP_PORT`, `BACKEND_DEBUG_PORT`, `FRONTEND_PORT`.
- `FRONTEND_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` (passed through to the `backend` container; already declared in `.env.example`).

Rules (unchanged from the prior draft):
- Secrets must not be committed; only `.env.example` is committed, with placeholder values.
- Production deployment requires separate approval/spec and is not covered by this compose file.

## Pending Decisions
- Production-grade Dockerfiles (multi-stage, optimized, non-root user) — this spec only covers the local dev images.
- Deployment target.
- Secret management for non-local environments.
- Database backup/restore strategy.
- HTTPS/TLS termination and reverse proxy.
