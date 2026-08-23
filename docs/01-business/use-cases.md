---
id: BUSINESS-USE-CASES
type: business
module: global
status: draft
---

# Use Cases

## Auth Use Cases
| Use Case | Actor | Goal |
| --- | --- | --- |
| Login | User | Authenticate and access protected pages. |
| Logout | Authenticated user | End current session. |
| Forgot Password | User | Request reset instructions safely. |
| Change Password | Authenticated user | Change own password. |
| Get Current User | Authenticated user/system | Validate session and load user context. |

## Employee Use Cases
| Use Case | Actor | Goal |
| --- | --- | --- |
| Employee List | User with `employee.read` | Search, filter, and page through employees. |
| Employee Detail | User with `employee.read` | View one employee's information. |
| Employee Create | User with `employee.create` | Add a new employee after validation and confirmation. |
| Employee Update | User with `employee.update` | Change employee information after validation and confirmation. |
| Employee Delete | User with `employee.delete` | Delete an employee after confirmation. |

## Cross-Cutting Use Cases
- Permission-aware navigation.
- Safe error handling.
- Audit logging for important changes.
- Query/cache refresh after mutations.
