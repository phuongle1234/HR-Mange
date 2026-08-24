---
id: FRONTEND-API-CLIENT
type: frontend
module: global
status: draft
depends_on:
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
  - FRONTEND-AUTHENTICATION
---

# Api Client

## Purpose
Define the shared frontend API client pattern for React features. The API client owns Axios setup, centralized endpoint references, request/response mapping, common error normalization, and integration points for authentication.

This spec prevents page components from hard-coding URLs, duplicating Axios setup, or rendering raw backend errors.

## Proposed Files
```text
src/shared/api/api-client.ts
src/shared/api/api-endpoints.ts
src/shared/api/api-error.ts
src/shared/api/api-response.ts
src/shared/api/http-status.ts
src/shared/api/base-api.service.ts
src/features/employee/services/employee.api.ts
src/features/organization-type/services/organization-type.api.ts
```

## Responsibilities
- Create and export a configured Axios instance.
- Store all API paths in centralized endpoint config.
- Attach authentication credentials according to approved auth design.
- Normalize backend errors into safe frontend error objects.
- Provide base service helpers for shared HTTP behavior.
- Keep feature API services small and endpoint-focused.

The API client must not:
- Own business rules.
- Own React component state.
- Store raw tokens in Redux or page state.
- Log secrets, JWTs, refresh tokens, API keys, credentials, or raw sensitive payloads.

## Endpoint Configuration
All endpoint paths must be declared centrally.

```text
ApiEndpoints
├── auth
│   ├── login
│   ├── me
│   ├── logout
│   ├── changePassword
│   └── forgotPassword
└── employees
    ├── list
    ├── detail(id)
    ├── create
    ├── update(id)
    └── delete(id)
└── organizationTypes
    ├── list
    ├── byIds
    ├── createMany
    ├── updateMany
    └── deleteMany
```

Rules:
- Components must never hard-code `/api/...`.
- Feature services import endpoint builders from `api-endpoints`.
- Dynamic path params must be encoded safely.
- Endpoints not defined in API specs must remain pending and must not be used as final behavior.

## Axios Instance
Configuration:
- `baseURL`: read from `VITE_API_BASE_URL`.
- `timeout`: `10000` ms default.
- `withCredentials`: `false` — no auth cookie is used (`WORK-000` decision #4).
- `headers`: default `Content-Type: application/json` for JSON requests.

Environment variable:
```text
VITE_API_BASE_URL
```

## Request Interceptor
Responsibilities:
- Read the access token from the Redux auth store and attach `Authorization: Bearer <token>` when present.
- Avoid mutating request data in feature-specific ways.

Forbidden:
- Do not read the token in page components.
- Do not log the `Authorization` header.
- Do not attach unapproved headers.

## Response Interceptor
Responsibilities:
- Return response data consistently (unwrap the `{success, message, data, meta}` envelope).
- Normalize API errors to `FrontendApiError`.
- Preserve enough safe context for UI mapping, such as code, message, status, and field errors.

Unauthorized behavior:
- `401` clears the stored token (dispatch `clearAuth()`/`setUnauthenticated()`) and redirects to `/login`. There is no refresh token in this phase — do not retry.

## Error Model
Frontend error shape:

```text
FrontendApiError
├── status
├── code
├── message
├── fieldErrors
├── requestId
└── originalError
```

Rendering rules:
- UI may render safe `message` only after mapping.
- UI must not render `originalError`.
- Field errors map to React Hook Form `setError` when the page uses forms.
- Unknown errors use a safe generic message.

Known employee error mapping examples:
- `EMPLOYEE_CODE_EXISTS` -> `employeeCode`
- `EMPLOYEE_EMAIL_EXISTS` -> `email`
- `EMPLOYEE_NOT_FOUND` -> page-level not found state
- `VALIDATION_ERROR` -> field-level errors when returned
- `UNAUTHORIZED` -> clear token, redirect to `/login`

There is no `DEPARTMENT_NOT_DEFINED` or `FORBIDDEN` mapping — Department and the permission model were both removed (`WORK-000` decisions #1/#2).

Known organization type error mapping examples:
- `ORGANIZATION_TYPE_NAME_EXISTS` -> `items[n].name` when the API returns a field path; otherwise form-level conflict.
- `ORGANIZATION_TYPE_NOT_FOUND` -> page-level error with navigation back to `/organizations/types`.
- `VALIDATION_ERROR` -> field-level errors when returned.
- `UNAUTHORIZED` -> clear token, redirect to `/login`.

## Base API Service
Purpose:
- Wrap shared `get`, `post`, `put`, `patch`, and `delete` calls.
- Apply consistent response unwrapping.
- Throw normalized frontend errors.

Rules:
- Feature services extend or compose base service behavior.
- Base service must not know employee-specific fields.
- Base service must not own TanStack Query keys.

## Feature API Services
Employee service example:

```text
EmployeeApiService
├── list(query)
├── detail(id)
├── create(payload)
├── update(id, payload)
└── delete(id)
```

Auth service example:

```text
AuthApiService
├── login(payload)
├── getMe()
├── logout()
├── changePassword(payload)
└── forgotPassword(payload)
```

Organization type service example:

```text
OrganizationTypeApiService
├── list(query)
├── findByIds(payload)
├── createMany(payload)
├── updateMany(payload)
└── deleteMany(payload)
```

Rules:
- Services receive already-normalized payloads from page/hook helpers.
- Services do not read component state directly.
- Services return typed response data according to API specs.

## TanStack Query Integration
Query hooks call API services and own query keys.

```text
useEmployeesQuery(queryState)
useEmployeeDetailQuery(id)
useCreateEmployeeMutation()
useUpdateEmployeeMutation()
useDeleteEmployeeMutation()
useOrganizationTypesQuery(queryState)
useOrganizationTypesByIdsQuery(ids)
useCreateOrganizationTypesMutation()
useUpdateOrganizationTypesMutation()
useDeleteOrganizationTypesMutation()
useLoginMutation()
useForgotPasswordMutation()
useChangePasswordMutation()
```

Rules:
- Query keys must be stable and serializable.
- Mutations invalidate affected query keys on success.
- API services must be reusable outside React; hooks wrap them for React lifecycle.

## Security
- Do not store passwords, JWTs, refresh tokens, secrets, API keys, credentials, or unnecessary sensitive data in local state, Redux, logs, or error messages.
- Do not expose stack traces or raw backend error objects.
- Backend authorization remains final boundary.
- Frontend permission checks are for user experience only.

## Test Notes
- Unit test endpoint builders and error normalization.
- Mock Axios for service success/error cases.
- Test interceptor behavior without logging or exposing secrets.
- Document commands and write a Markdown test report when implemented.

## Pending Decisions
None blocking — token transport, base URL variable, and error shape are resolved above.
