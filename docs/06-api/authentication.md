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

## Token Signing
- Algorithm: `RS256` (asymmetric RSA key pair). `HS256` tokens, or any algorithm other than `RS256`, are rejected — signing and verification both pin `algorithm`/`algorithms` explicitly rather than trusting a default.
- Signing (`POST /api/auth/login`) uses `JWT_PRIVATE_KEY`; verification (`JwtAuthGuard`/`JwtStrategy`, applied to every `Auth: required` endpoint above) uses `JWT_PUBLIC_KEY`. Both are PEM values stored in `.env`/`.env.example` with literal `\n` newline escapes and unescaped at config-load time.
- Real key material must never be committed; `.env.example` holds only empty placeholders for `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`.
- Token payload (`sub`, `email`) remains readable/decodable — RS256 guarantees only that a token was signed by the holder of `JWT_PRIVATE_KEY`, not payload confidentiality.

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
- Sign a JWT access token with `JWT_PRIVATE_KEY` (`algorithm: RS256`, `expiresIn: JWT_ACCESS_EXPIRES_IN`) — see [Token Signing](#token-signing).
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

### Business Logic
- No additional service-layer lookup: `JwtAuthGuard`/`JwtStrategy.validate()` already re-fetches the user by `sub` and re-checks `isActive` on every request (see Security Rules above), so the controller returns that already-verified `{ id, email, fullName }` payload directly instead of querying the user a second time.

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
