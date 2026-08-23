---
id: API-AUTHORIZATION
type: api
module: global
status: draft
---

# Authorization

## Purpose
Define authorization expectations for protected API operations.

## Resolved Model (`WORK-000` decision #2)
There is no role or permission model. Every protected endpoint requires only a valid access token (authentication). Any authenticated user can perform any operation the API exposes — employee list/detail/create/update/delete, change password, logout, get current user.

## Authentication vs Authorization
- Authentication verifies the user/session (the access token is valid and belongs to an active user).
- There is no further authorization check beyond that in this phase.
- Backend authentication is the final security boundary; the frontend never enforces access on its own.

## Current Rules
| Operation | Auth Required |
| --- | --- |
| Employee list/detail/create/update/delete | yes |
| Change password / logout / get current user | yes |
| Login / forgot password | no (public) |

## Rules
- Public auth endpoints (`login`, `forgot-password`) must not require authentication.
- Every other endpoint must reject requests without a valid `Authorization: Bearer` token with `UNAUTHORIZED` (401).
- If a role/permission model is added later, it is a new, separate work item — not an implicit assumption anywhere in this codebase.

## Ambiguities
None. This spec intentionally has no pending decisions — `WORK-000` closed them by removing the permission model.
