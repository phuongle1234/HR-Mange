# Project Context

## 1) Tóm tắt dự án

Dự án đang xây dựng theo kiến trúc backend/frontend theo spec có sẵn trong `docs/` và `AGENTS.md`.

- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- Frontend: React + Vite + Redux Toolkit + TanStack Query + Axios
- Database: PostgreSQL
- Containerization: Docker Compose
- Architecture pattern: Controller -> Interface -> Service -> BaseService -> Prisma -> PostgreSQL

## 2) Các rule quan trọng của dự án

### Specification First
Trước khi code backend/frontend, phải đọc spec tương ứng trước:
- `docs/00-project`
- `docs/01-business`
- `docs/02-solution`
- `docs/03-technology`
- `docs/04-database`
- `docs/05-ui-ux`
- `docs/06-api`
- `docs/07-frontend`

Không được invent business rules, API, field, permission nếu spec không có.

### Coding Rules
- Mỗi function chỉ làm 1 việc
- Ưu tiên early return
- Không hardcode shared values
- Không swallow error
- Không log password / JWT / secret
- Dùng try/catch ở nơi hợp lý

### Backend Rules
- Controller phụ thuộc interface, không phụ thuộc concrete service
- `BaseService` chứa CRUD chung
- `findMany` do service riêng implement
- BaseService không tự ý transform / merge / bỏ trường data
- Event CRUD dùng shared event chung, không per-entity event class
- AuditLogListener là generic

### Frontend Rules
- React Router, Redux Toolkit, TanStack Query, Axios
- Redux cho global state
- TanStack Query cho server state
- React local state cho UI state
- API URL phải tập trung vào file config/client, không đặt trong component
- Mọi JSX attribute phải viết trên 1 dòng

### Testing Rules
- Không tạo unit test file nếu không được yêu cầu
- Không chạy test như task thường lệ
- Chỉ write/run test nếu user yêu cầu rõ

### Session Context Rule
Sau mỗi task phải cập nhật:
- `docs/09-workflow/session-context.md`

## 3) Docker hiện trạng / cách start

### Docker stack có sẵn trong `infra/docker-compose.yml`
Services:
- `postgres`
- `pgadmin`
- `backend`
- `frontend`

### Chạy full stack
Từ root project:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

Truy cập:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Postgres: localhost:5432
- pgAdmin: http://localhost:5050

### Chỉ chạy Postgres + pgAdmin
```bash
docker compose -f infra/docker-compose.yml up -d postgres pgadmin
```

### Chỉ chạy backend + postgres
```bash
docker compose -f infra/docker-compose.yml up -d postgres backend
```

### Chỉ chạy frontend + backend
```bash
docker compose -f infra/docker-compose.yml up -d backend frontend
```

### Local backend
```bash
cd backend
npm install
npm run start:dev
```

### Local frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## 4) Lưu ý quan trọng về Docker

- Không dùng `--project-directory .` khi đang ở thư mục repo root nếu không cần thiết, vì đã gây lỗi với path resolution trong project này.
- `backend` và `frontend` dùng bind mount source vào container nên code đổi ở host sẽ tự reload khi chạy trong Docker.
- `pgAdmin` nên kết nối tới Postgres bằng hostname `postgres`, không phải `localhost`, khi ở cùng network Docker.

## 5) Tình trạng project hiện tại (theo session context)

Dự án đã đi rất xa hơn chỉ là spec:
- Backend đã được implement: auth, employee CRUD, audit log
- Frontend đã được scaffold và implement: login, password flows, employee pages
- Docker infra đã được cấu hình
- Organization module/frontend cũng đã có thêm
- Repo đã được init git và push lên GitHub

Tuy nhiên, vẫn còn các phần cần kiểm tra cuối cùng:
- live integration frontend-backend chưa được chạy full end-to-end
- Docker verification chưa hoàn toàn final
- một số behavior frontend đã được user chấp thuận khác với brief gốc
- các bulk endpoints / unknown edge cases vẫn cần kiểm tra thêm

## 6) File quan trọng để đọc lại

- `AGENTS.md`
- `docs/09-workflow/session-context.md`
- `infra/docker-compose.yml`
- `infra/README.md`
- `backend/README.md`
- `frontend/README.md`

## 7) Mục tiêu hiện tại (nếu muốn tiếp tục làm)

- Chạy full stack bằng Docker hoặc local dev
- Kiểm tra integration backend/frontend thực tế
- Fix bug còn tồn tại
- Hoàn thiện phần chưa được xác minh

---

Created automatically for project context retention.
