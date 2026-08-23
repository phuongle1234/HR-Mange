# Infrastructure (Local Development)

This directory implements the local development Docker environment described in
`docs/03-technology/infrastructure.md`. It is a local dev setup only —
production deployment is a separate, not-yet-approved spec.

## Prerequisites
- Docker Desktop (or an equivalent Docker Engine + Compose v2).
- A `.env` file at the repository root, copied from `.env.example`, with the
  Postgres/pgAdmin/port variables filled in.
- `backend/` and `frontend/` application directories with a `package.json` each.
  These do not exist yet in this repository (the project is still
  specification-only) — until they do, only `postgres` and `pgadmin` can build
  and run.

## What Works Today
```bash
docker compose -f infra/docker-compose.yml up -d postgres pgadmin
```
- PostgreSQL is reachable on the host at `localhost:${POSTGRES_PORT:-5432}`.
- pgAdmin is reachable at `http://localhost:${PGADMIN_PORT:-5050}`, logging in
  with `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` from `.env`.
  Add a new server in pgAdmin using host `postgres` (the Docker service name,
  not `localhost`) and the same Postgres credentials.

## Full Stack (Once backend/frontend Source Exists)
```bash
docker compose -f infra/docker-compose.yml up -d --build
```
- Backend API: `http://localhost:${APP_PORT:-3000}`
- Backend Node inspector (for VS Code attach): `localhost:${BACKEND_DEBUG_PORT:-9229}`
- Frontend dev server: `http://localhost:${FRONTEND_PORT:-5173}`

Both `backend` and `frontend` bind-mount their source directory into the
container, so editing files on the host reloads the running process inside
the container — no rebuild needed for ordinary code changes. A rebuild
(`--build`) is only needed after changing `package.json` dependencies or the
Dockerfiles themselves.

## Debugging the Backend From VS Code
1. Start the stack (`backend` service running).
2. Add this configuration to `.vscode/launch.json` in the repository:
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
3. Run "Attach to Docker Backend" from the Run and Debug panel. `restart: true`
   keeps the debugger attached across the `--watch` restarts that happen when
   backend source changes.

## Network
All services share the `employeeos-network` Docker bridge network and can
reach each other by service name (`postgres`, `pgadmin`, `backend`,
`frontend`). Only use `localhost` from the host machine, never from inside a
container.

## Stopping / Resetting
```bash
docker compose -f infra/docker-compose.yml down       # stop containers, keep volumes/data
docker compose -f infra/docker-compose.yml down -v    # stop and wipe Postgres/pgAdmin data
```
