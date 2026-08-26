---
id: API-EMPLOYEE-BY-IDS
type: api
module: employee
status: draft
depends_on:
  - DB-EMPLOYEE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Get Employees By IDs

## API
- Method: `POST`
- URL: `/api/employees/by-ids`
- Status: draft

## Purpose
Fetch checked employee rows for the bulk table editor's update mode (`FRONTEND-EMPLOYEE-EDIT`), same purpose and shape as `API-ORGANIZATION-TYPE-BY-IDS`. `POST` (not `GET ?ids[]=...`) so the frontend can pass many checked ids cleanly.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may fetch employees by ids.

## DTO And Field Validation
DTO name: `GetEmployeesByIdsDto`

| Field | Required | Validation |
| --- | --- | --- |
| `ids` | yes | array of UUID strings, min `1`, max `100`, no duplicate ids |

## Business Logic
1. Validate body.
2. Call `IEmployeeService.findByIds(ids)`.
3. Preserve the same order as the incoming `ids` array for returned rows that exist.
4. If one or more ids do not exist, return `404 EMPLOYEE_NOT_FOUND`.
5. Return safe DTO rows, including `organizationId` and `userId`.

## Database Interaction
- Inherited `BaseService.findByIds(ids)`.
- Expected Prisma operation: `findMany({ where: { id: { in: ids } } })`.

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None. Reads are not audited.

## Request Body
```json
{
  "ids": [
    "9c6b8e2a-1e3a-4f2a-9b0e-2f6a7c8d9e0f",
    "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c"
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Employees retrieved successfully.",
  "data": [
    {
      "id": "9c6b8e2a-1e3a-4f2a-9b0e-2f6a7c8d9e0f",
      "employeeCode": "EMP-1001",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "a@example.com",
      "phone": null,
      "position": "Senior Engineer",
      "status": "ACTIVE",
      "organizationId": 5,
      "userId": null,
      "createdAt": "2026-08-26T10:00:00.000Z",
      "updatedAt": "2026-08-26T10:20:00.000Z"
    }
  ]
}
```

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `EMPLOYEE_NOT_FOUND` | 404 | At least one requested id does not exist |

## Frontend Contract Notes
- TanStack query key: `['employees', 'by-ids', ids]`.
- The bulk table editor's update mode must call this endpoint once after reading checked ids from the `employee_checked` Redux slice.
- If `EMPLOYEE_NOT_FOUND` is returned, show a page-level error and offer navigation back to `/employees`.

## Ambiguities
None.
