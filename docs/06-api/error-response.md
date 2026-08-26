---
id: API-ERROR-RESPONSE
type: api
module: global
status: draft
---

# Error Response

## Purpose
Define draft API error response behavior for frontend mapping.

## Error Shape
Draft shape:

```text
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed.",
  "fieldErrors": {
    "email": ["Email is invalid."]
  },
  "requestId": "string"
}
```

Rules:
- `message` must be safe to display only after frontend mapping.
- `fieldErrors` is optional.
- `requestId` is optional until correlation ID convention is approved.
- Do not include stack traces in client responses.

## Common Error Codes
| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | DTO or input validation failed. |
| `UNAUTHORIZED` | `401` | Session/token missing or invalid. |
| `FORBIDDEN` | `403` | Authenticated user lacks permission. |
| `NOT_FOUND` | `404` | Resource does not exist or is not visible. |
| `TOO_MANY_REQUESTS` | `429` | Rate limit exceeded. |
| `INTERNAL_ERROR` | `500` | Unexpected server error. |

## Organization Type Error Codes
| Code | Status | Frontend behavior |
| --- | --- | --- |
| `ORGANIZATION_TYPE_NOT_FOUND` | `404` (`/organization-types` bulk endpoints) or `400` (as a field-level FK-reference error on `/organizations` and `/employees` bulk endpoints, see below) | `404` case: show page-level not-found/error state and offer navigation back to `/organizations/types`. `400` case: map to the offending row's `organizationTypeId` field. |
| `ORGANIZATION_TYPE_NAME_EXISTS` | `409` | Map to `name` field when a specific row path is available; otherwise show a safe form-level conflict message. |

## Organization Error Codes (2026-08-26)
| Code | Status | Frontend behavior |
| --- | --- | --- |
| `ORGANIZATION_NOT_FOUND` | `404` (`docs/06-api/organization/update-organizations.md`) or `400` (as a field-level FK-reference error on `/employees` bulk endpoints, see below) | `404` case: page-level not-found/error state. `400` case: map to the offending row's `organizationId` field. |

## Employee Bulk Error Codes (2026-08-26)
| Code | Status | Frontend behavior |
| --- | --- | --- |
| `EMPLOYEE_CODE_EXISTS` | `409` on `/employees/bulk` (vs. `400 VALIDATION_ERROR` on the existing single-record `POST /api/employees` — see `API-EMPLOYEE-BULK-CREATE`'s Business Logic for why the two paths differ) | Map to the offending row's `employeeCode` field. |
| `EMPLOYEE_EMAIL_EXISTS` | `409` on `/employees/bulk` (vs. `400` on single-record create) | Map to the offending row's `email` field. |
| `EMPLOYEE_NOT_FOUND` | `404` | Bulk update/delete/by-ids: page-level error listing which ids were not found. |

## Invitation Error Codes (2026-08-26)
| Code | Status | Frontend behavior |
| --- | --- | --- |
| `INVITATION_TOKEN_INVALID` | `404` | Page-level safe message on the accept-invitation page; do not reveal whether the token ever existed. |
| `INVITATION_EXPIRED` | `410` | Page-level message offering to request a new invitation from an admin. |
| `INVITATION_ALREADY_ACCEPTED` | `409` | Page-level message suggesting the user log in instead. |
| `USER_ALREADY_EXISTS` | `409` | On invite-create: appears only inside a `201` response's `skipped[].reason`, not as a top-level error (see `API-INVITATIONS-CREATE`). On accept: page-level safe message. |
| `EMPLOYEE_MISSING_EMAIL` | n/a | Invite-create only: appears only inside a `201` response's `skipped[].reason`, never a top-level error. |
| `EMPLOYEE_NOT_FOUND` (as a `skipped[].reason`) | n/a | Invite-create only: one of the selected employee ids no longer exists; appears only inside `skipped[].reason`, distinct from the top-level `404 EMPLOYEE_NOT_FOUND` used by bulk update/delete/by-ids above. |

## Authentication Error Codes
| Code | Status | Frontend behavior |
| --- | --- | --- |
| `INVALID_CREDENTIALS` | `401` | Show generic login failure. |
| `USER_DISABLED` | `403` | Show safe account unavailable message if approved. |
| `CURRENT_PASSWORD_INVALID` | `400` | Map to current password field or form-level error. |
| `PASSWORD_POLICY_FAILED` | `400` | Map to new password field or policy message. |
| `RESET_REQUEST_ACCEPTED` | `200` | Use success response, not an error. |

## Security
- Do not reveal whether an email exists during login or forgot password.
- Do not return password values, password hashes, tokens, reset tokens, or secrets.
- Do not expose raw backend error objects.

## Pending Decisions
- Localization strategy for messages.
