---
id: PROJECT-GLOSSARY
type: project
module: global
status: draft
---

# Glossary

- Employee: person managed by the system.
- User: account that can authenticate.
- Authenticated User: user with a valid session/token.
- Permission: authorization capability checked by backend and reflected in frontend UI.
- Role: collection of permissions if the role model is approved.
- Audit Log: record of important actions.
- Event: domain or integration notification emitted after important changes if approved.
- DTO: data transfer object used for API request or response validation.
- API Service: frontend service wrapper around a backend API endpoint.
- Repository: backend database access layer.
- Service: backend application/business logic layer.
- Controller: backend HTTP layer.
- Mutation: frontend server-changing operation through TanStack Query.
- Query: frontend server-read operation through TanStack Query.
- Confirm Popup: modal dialog that asks the user to confirm create, update, or delete before the mutation runs.
- Forbidden State: UI shown when frontend detects missing permission.
- Not Found State: UI shown when a requested resource does not exist or cannot be shown.
- Pending Decision: known unresolved design or business decision.
- Blocked: work cannot safely continue until a decision or dependency is resolved.

## Security Terms
- JWT: JSON Web Token, if token-based auth is approved.
- Refresh Token: token used to refresh sessions if approved.
- HttpOnly Cookie: browser cookie inaccessible to frontend JavaScript.
- Secret: any credential, token, key, password, or sensitive value that must not be logged or exposed.
