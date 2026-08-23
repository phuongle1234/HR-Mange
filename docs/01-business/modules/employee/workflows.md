---
id: BUSINESS-EMPLOYEE-WORKFLOWS
type: business
module: employee
status: draft
---

# Employee Workflows

## List Workflow
```text
User opens /employees
    ↓
Authenticate and authorize employee.read
    ↓
Validate query params
    ↓
Fetch paginated employee data
    ↓
Return list response
```

## Detail Workflow
```text
User opens /employees/:id
    ↓
Authenticate and authorize employee.read
    ↓
Validate id
    ↓
Fetch employee
    ↓
Return detail or not found
```

## Create Workflow
```text
User submits create form
    ↓
Frontend validates and opens confirm popup
    ↓
User confirms
    ↓
Authenticate and authorize employee.create
    ↓
Validate create DTO and uniqueness
    ↓
Persist employee
    ↓
Audit/event if approved
    ↓
Return created employee response
```

## Update Workflow
```text
User edits employee
    ↓
Frontend validates and opens changed-fields confirm popup
    ↓
User confirms
    ↓
Authenticate and authorize employee.update
    ↓
Validate update DTO and uniqueness excluding current employee
    ↓
Persist changed fields
    ↓
Audit/event if approved
    ↓
Return updated employee response
```

## Delete Workflow
```text
User clicks delete
    ↓
Frontend opens destructive confirm popup
    ↓
User confirms
    ↓
Authenticate and authorize employee.delete
    ↓
Apply approved delete strategy
    ↓
Audit/event if approved
    ↓
Return delete success
```

## Required Per-Workflow Details Before Implementation
- Actor.
- Permission.
- Validation.
- Database impact.
- Event behavior.
- Audit log behavior.
- Success response.
- Failure response.
