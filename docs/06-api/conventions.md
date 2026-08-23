---
id: API-CONVENTIONS
type: api
module: global
status: draft
---

# Conventions

## Purpose
Define API documentation conventions used by endpoint specs.

## Endpoint Spec Requirements
Each endpoint must define:
- Method and URL.
- Auth requirement.
- Permission requirement, if any.
- DTO fields and validation.
- Business logic.
- Database interaction.
- Transaction behavior when needed.
- Event/audit behavior when needed.
- Response shape.
- Status codes.
- Error codes.

## URL Conventions
- API paths use `/api`.
- Auth endpoints use `/api/auth`.
- Employee endpoints use `/api/employees`.
- Dynamic IDs use `:id` in specs.

## Response Conventions
- Successful responses should return safe DTOs only.
- Passwords, hashes, tokens, reset tokens, secrets, credentials, and unnecessary sensitive data must never be returned.
- If HttpOnly cookie auth is approved, auth tokens must not be included in JSON response bodies.

## Error Conventions
- Errors should include safe code, message, status, and optional field errors.
- Do not expose stack traces or raw internal errors.
- Auth errors must avoid user enumeration.
- Forgot password response must not reveal whether the email exists.

## Audit And Logging
- Important employee changes require audit log according to business rules.
- Password changes should be audited without password values.
- Do not log passwords, JWTs, refresh tokens, reset tokens, secrets, API keys, credentials, or unnecessary sensitive data.

## Pending Decisions
- Exact envelope shape for success responses.
- Exact error response envelope.
- Request ID/correlation ID convention.
- Pagination metadata envelope.
