---
id: BUSINESS-WORKFLOWS
type: business
module: global
status: draft
---

# Workflows

## Standard Protected Workflow
```text
Request
    ↓
Authenticate
    ↓
Authorize if permission is required
    ↓
Validate DTO and business rules
    ↓
Persist if approved by specs
    ↓
Audit/event if required
    ↓
Return safe response
```

## Public Auth Workflow
```text
Request
    ↓
Validate DTO
    ↓
Apply rate limiting
    ↓
Execute auth use case
    ↓
Return safe response
```

Examples:
- Login.
- Forgot password.

## Employee Mutation Workflow
```text
User submits form
    ↓
Frontend validates
    ↓
Confirm popup appears
    ↓
User confirms
    ↓
Backend authenticates and authorizes
    ↓
Backend validates and persists
    ↓
Audit/event if required
    ↓
Frontend invalidates queries and shows success state
```

## Error Workflow
- Validation errors map to fields where possible.
- Permission errors show forbidden state.
- Auth errors trigger session flow.
- Unexpected errors use safe generic messages.
- Raw backend errors and stack traces must not be exposed.
