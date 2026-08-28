---
id: SOLUTION-ERROR-HANDLING
type: solution
module: global
status: draft
---

# Error Handling

## Purpose
Define safe error handling across backend, API, and frontend.

## Error Principles
- Preserve root cause internally.
- Return safe error codes/messages externally.
- Do not expose stack traces or raw backend errors.
- Do not log secrets or credentials.
- Centralize response construction: controllers use `ResponseHelper.success(...)`, and `GlobalHttpExceptionFilter` uses `ResponseHelper.error(...)`.

## API Error Categories
- Validation error.
- Unauthorized.
- Forbidden.
- Not found.
- Conflict/duplicate.
- Rate limited.
- Unexpected server error.

## Frontend Mapping
- Field errors map near fields.
- Form-level errors map near actions or confirm popup.
- Page-level errors show retry where applicable.
- Auth errors flow through AuthProvider/interceptor.

## Security
- Invalid login uses generic failure.
- Forgot password uses generic accepted success.
- Password and token errors must not expose sensitive details.

## Pending Decisions
- Exact API error envelope.
- Localization strategy.
- Request ID/correlation ID.
