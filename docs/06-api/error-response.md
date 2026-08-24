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
| `ORGANIZATION_TYPE_NOT_FOUND` | `404` | Show page-level not-found/error state and offer navigation back to `/organizations/types`. |
| `ORGANIZATION_TYPE_NAME_EXISTS` | `409` | Map to `name` field when a specific row path is available; otherwise show a safe form-level conflict message. |

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
