---
id: TEST-HTTP-TESTING
type: testing
module: global
status: draft
---

# Http Testing

## Purpose
Define HTTP/API testing expectations for backend endpoints.

## Required HTTP Coverage
Auth:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`

Employee:
- List.
- Detail.
- Create.
- Update.
- Delete.

## Test Cases
- Success.
- Validation error.
- Unauthorized.
- Forbidden where permission applies.
- Not found where resource applies.
- Conflict/duplicate where applicable.
- Rate limit where applicable and practical.

## Security Checks
- Responses do not include passwords, password hashes, tokens, reset tokens, or secrets.
- Login failure does not reveal whether email exists.
- Forgot password response does not reveal whether email exists.

## HTTP Files
HTTP request files should live near testing artifacts or API module tests according to implementation structure.

## Reporting
- Include request names.
- Include status result.
- Include skipped cases and reason.
