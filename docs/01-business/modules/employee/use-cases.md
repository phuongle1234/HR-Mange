---
id: BUSINESS-EMPLOYEE-USE-CASES
type: business
module: employee
status: draft
---

# Employee Use Cases

## Employee List
- Actor: user with `employee.read`.
- Goal: view searchable, filterable, paginated employees.
- Success: list data and pagination metadata are shown.
- Failure: validation, forbidden, unauthorized, or safe error state.

## Employee Detail
- Actor: user with `employee.read`.
- Goal: view one employee.
- Success: grouped employee information is shown.
- Failure: not found, forbidden, unauthorized, or safe error state.

## Employee Create
- Actor: user with `employee.create`.
- Goal: create an employee.
- Frontend: validate form, show confirm popup, submit after confirmation.
- Backend: validate DTO/business rules, persist, audit if approved.
- Success: success message and query invalidation.

## Employee Update
- Actor: user with `employee.update`.
- Goal: update changed employee fields.
- Frontend: validate changed fields, show changed-fields confirm popup, submit after confirmation.
- Backend: validate DTO/business rules, persist, audit if approved.
- Success: success message and list/detail invalidation.

## Employee Delete
- Actor: user with `employee.delete`.
- Goal: delete an employee.
- Frontend: show destructive delete confirm popup.
- Backend: apply approved delete strategy, audit if approved.
- Success: success message and list/detail invalidation.
