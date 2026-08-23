---
id: BUSINESS-RULES
type: business
module: global
status: draft
---

# Business Rules

## Global Rules
- Do not create undocumented employee rules.
- Authentication is required for protected operations.
- Authorization is required for employee operations.
- Audit log is required for important employee changes.
- Backend authorization remains the final security boundary.
- Frontend permission checks are for user experience and must not be treated as security enforcement.

## Authentication Rules
- Login must use a safe generic error when credentials fail.
- Forgot password must not reveal whether an email exists.
- Change password applies only to the current authenticated user.
- Passwords, tokens, reset tokens, secrets, and credentials must never be logged or returned.

## Employee Rules
- Employee code uniqueness is expected but final field constraints are pending approval.
- Employee email uniqueness is expected but final field constraints are pending approval.
- Department relationship is blocked until Department spec is approved.
- Status enum is pending approval.
- Delete strategy is pending approval.

## Audit Rules
- Create employee should create audit log if audit payload is approved.
- Update employee should create audit log if audit payload is approved.
- Delete employee should create audit log if audit payload is approved.
- Password change should be audited without password values if auth audit is approved.

## Ambiguities
- Employee fields are not fully approved.
- Department relationship is blocked pending decision.
- Exact password policy is not approved.
- Audit log payload shape is not approved.
