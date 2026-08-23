---
id: API-AUTHENTICATION
type: api
module: global
status: draft
---

# Authentication

## Purpose
Define authentication endpoints for login, session validation, logout, password change, and forgot password flow.

## Security Rules
- Do not log passwords, JWTs, refresh tokens, reset tokens, secrets, API keys, credentials, or unnecessary sensitive data.
- Password values are write-only request fields and must never be returned.
- Invalid login must not reveal whether email or password was incorrect.
- Forgot password must not reveal whether an email exists.

## Token Transport (Resolved — `WORK-000` decision #4)
- Access token is returned in the `POST /api/auth/login` JSON response body (not a cookie).
- The frontend sends it on every subsequent request via `Authorization: Bearer <token>`.
- There is no refresh token / refresh endpoint in this phase — when the access token expires, the frontend redirects to `/login`.

## Endpoint Summary
| ID | Method | URL | Auth | Purpose |
| --- | --- | --- | --- | --- |
| `API-AUTH-LOGIN` | `POST` | `/api/auth/login` | public | Authenticate user, return access token. |
| `API-AUTH-ME` | `GET` | `/api/auth/me` | required | Return current user. |
| `API-AUTH-LOGOUT` | `POST` | `/api/auth/logout` | required | End current session (client-side token discard; no server-side session to invalidate since tokens are stateless JWTs). |
| `API-AUTH-CHANGE-PASSWORD` | `POST` | `/api/auth/change-password` | required | Change current user's password. |
| `API-AUTH-FORGOT-PASSWORD` | `POST` | `/api/auth/forgot-password` | public | Request password reset instructions. |

No permission is required for any of these beyond authentication (per `WORK-000` decision #2).

## API-AUTH-LOGIN
### Request
```text
POST /api/auth/login
Content-Type: application/json
```

DTO:
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `email` | string | yes | Valid email format, trimmed, lowercased. |
| `password` | string | yes | Non-empty string. |

### Business Logic
- Validate request DTO.
- Find user by email.
- Verify password with `bcrypt.compare`.
- Reject if `isActive` is `false`.
- Sign a JWT access token (`JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN` from `.env.example`).
- Update `lastLoginAt`.
- Return the token and safe user fields in the response body.

### Response
Success status: `200 OK`.
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "string",
    "user": {
      "id": "string",
      "email": "string",
      "fullName": "string"
    }
  },
  "meta": null
}
```

### Errors
| Code | Status | Message behavior |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | Field validation failed. |
| `INVALID_CREDENTIALS` | `401` | Safe generic login failure (wrong email or wrong password map to the same code/message). |
| `USER_DISABLED` | `403` | Safe account-unavailable message when `isActive` is `false`. |

## API-AUTH-ME
### Request
```text
GET /api/auth/me
```
Auth: required.

### Response
Success status: `200 OK`.
```json
{
  "success": true,
  "message": "Current user retrieved successfully.",
  "data": {
    "id": "string",
    "email": "string",
    "fullName": "string"
  },
  "meta": null
}
```

### Errors
| Code | Status | Message behavior |
| --- | --- | --- |
| `UNAUTHORIZED` | `401` | Token missing, invalid, or expired. |

## API-AUTH-LOGOUT
### Request
```text
POST /api/auth/logout
```
Auth: required.

### Business Logic
- No server-side session/token store exists (stateless JWT), so this endpoint has no state to invalidate. It exists so the frontend has one call to make on logout and so future server-side invalidation can be added without a contract change.

### Response
Success status: `200 OK`.
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null,
  "meta": null
}
```

### Errors
| Code | Status | Message behavior |
| --- | --- | --- |
| `UNAUTHORIZED` | `401` | Token missing, invalid, or expired. |

## API-AUTH-CHANGE-PASSWORD
### Request
```text
POST /api/auth/change-password
Content-Type: application/json
```
Auth: required.

DTO:
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `currentPassword` | string | yes | Non-empty. |
| `newPassword` | string | yes | Min 8 chars, at least one letter and one number (`WORK-000` decision #6 default). |
| `confirmNewPassword` | string | yes | Must match `newPassword`. |

### Business Logic
- Validate request DTO.
- Verify `currentPassword` against the stored hash.
- Validate `newPassword` against the policy.
- Hash and store new password.
- Emit no event / no audit in this phase (auth events are deferred per `WORK-000` decision #9) — password change is not written to `audit_logs`.
- Do not invalidate other sessions (stateless JWT; no session store to invalidate).

### Response
Success status: `200 OK`.
```json
{ "success": true, "message": "Password changed successfully.", "data": null, "meta": null }
```

### Errors
| Code | Status | Message behavior |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | Field validation failed. |
| `CURRENT_PASSWORD_INVALID` | `400` | Safe current-password error. |
| `PASSWORD_POLICY_FAILED` | `400` | Safe policy message. |
| `UNAUTHORIZED` | `401` | Token missing, invalid, or expired. |

## API-AUTH-FORGOT-PASSWORD
### Request
```text
POST /api/auth/forgot-password
Content-Type: application/json
```
Auth: public.

DTO:
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `email` | string | yes | Valid email format, trimmed, lowercased. |

### Business Logic
- Validate request DTO.
- Always return the same safe response whether the email exists or not.
- No reset-token issuance or delivery channel is implemented in this phase (no email/SMS provider is in scope) — this is a documented gap, not a silent omission. The endpoint exists and responds safely; it does not yet send anything.

### Response
Success status: `200 OK`.
```json
{ "success": true, "message": "If the email is registered, password reset instructions will be sent.", "data": null, "meta": null }
```

### Errors
| Code | Status | Message behavior |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | Email format validation failed. |

## Pending Decisions
None blocking. Rate limiting on auth endpoints is not implemented in this phase (no spec defined thresholds); this is a known gap for a future security-hardening pass, not a silent omission.
