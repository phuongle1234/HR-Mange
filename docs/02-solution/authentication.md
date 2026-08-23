---
id: SOLUTION-AUTHENTICATION
type: solution
module: global
status: draft
---

# Authentication

## Purpose
Define the solution-level authentication approach.

## Supported Auth Workflows
- Login.
- Get current user/session.
- Logout.
- Change password.
- Forgot password.
- Refresh session if approved.

## Session Strategy
Pending approval:
- HttpOnly cookie.
- Encrypted readable cookie.
- Authorization bearer token.

Rules:
- Page components must never access raw tokens.
- Passwords and tokens must never be logged.
- Invalid login response must not reveal whether email exists.
- Forgot password response must not reveal whether email exists.

## Backend Responsibilities
- Validate auth DTOs.
- Verify passwords using approved hashing.
- Issue/invalidate session according to approved strategy.
- Protect authenticated endpoints.
- Audit password change if approved.

## Frontend Responsibilities
- Use AuthProvider for session initialization.
- Use AuthGuard for protected routes.
- Use centralized AuthApiService.
- Store only safe user data in Redux.

## Pending Decisions
- Password policy.
- Token transport.
- Refresh token behavior.
- Reset password token lifetime and delivery channel.
