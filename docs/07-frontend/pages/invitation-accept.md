---
id: FRONTEND-INVITATION-ACCEPT
type: frontend
module: invitations
status: draft
depends_on:
  - API-AUTH-INVITATIONS-ACCEPT
  - FRONTEND-REACT-ROUTE
  - FRONTEND-API-CLIENT
---

# Invitation Accept

## Purpose
Define the React page-level behavior for the invitation-accept screen, where an invited employee sets a password and creates their login account (task §27-§28).

## Route Reference
```text
/invitation/accept?token=... -> InvitationAcceptPage
```

Route-level decisions:
- Layout: `AuthLayout` (task §27: "Layout tương tự Login" — same centered, no-sidebar shell as `/login`).
- Auth guard: **none** — this route must work for an unauthenticated visitor holding only a token, the same reasoning `API-AUTH-INVITATIONS-ACCEPT` records for why it isn't behind `AuthGuard`. It is also not behind `PublicOnlyGuard`: an already-authenticated user opening an invitation link (e.g. an admin testing the flow) should still be able to complete it — `PublicOnlyGuard`'s "authenticated → redirect away" behavior does not fit this route, same reasoning `FRONTEND-REACT-ROUTE` already records for `/forgot-password`/`/change-password` being ungated rather than `PublicOnlyGuard`-gated.
- Navbar: none (`AuthLayout` renders no Navbar).

## Page Component
```text
src/features/auth/pages/InvitationAcceptPage.tsx
```

## Implemented Files
```text
src/features/auth/pages/InvitationAcceptPage.tsx
src/features/auth/schemas/auth.schemas.ts          → acceptInvitationSchema
src/features/invitations/hooks/useCreateInvitationsMutation.ts → useAcceptInvitationMutation
src/features/invitations/services/invitations.api.ts          → accept(payload)
src/features/invitations/types/invitation.types.ts            → AcceptInvitationPayload
```

The schema lives in the shared `auth.schemas.ts` rather than its own file so it can reuse `newPasswordSchema` — the same policy object `changePasswordSchema` uses. A separate copy of the policy would be free to drift from what the backend enforces.

The mutation and API service live under `features/invitations/` alongside the invite-creation call, since both hit the same module's endpoints. Only the page itself is an auth-feature concern.

## Responsibilities
This spec owns:
- Read `token` from the URL query string (`useSearchParams()`).
- Render Password/Confirm Password form (task §27: "Password, Confirm Password, [ Create Account ]").
- Validate with React Hook Form + Zod, same password policy as `API-AUTH-CHANGE-PASSWORD`.
- Submit `POST /api/auth/invitations/accept` with `{ token, password, confirmPassword }`.
- On success, redirect to `/login` (task §28, explicit — no auto-login).
- On `INVITATION_TOKEN_INVALID`/`INVITATION_EXPIRED`/`INVITATION_ALREADY_ACCEPTED`, render a page-level safe message instead of the form (or alongside a disabled form) — these are not recoverable by resubmitting the same form.

This spec must not own:
- Any authenticated-only data (auth token, current user) — this page renders before any account exists.
- Server state storage in Redux.

## Missing/Invalid Token (no query param at all)
If `token` is missing from the URL entirely (not just rejected by the API), render the same page-level safe message as `INVITATION_TOKEN_INVALID` without calling the API — do not submit an empty/undefined token.

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| `token` | URL search param | Read-only; never stored in Redux or local state beyond what's needed to pass to the mutation. |
| Form values (`password`, `confirmPassword`) | React Hook Form | Do not store in Redux. |
| Field errors | React Hook Form + Zod resolver | API validation errors map with `setError`. |
| Page-level invalid/expired/accepted state | Local React state | Set from the mutation's error code; replaces the form when set. |
| Mutation state | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |

## Form Library And Validation
Same stack as every other auth form (`react-hook-form`, `zod`, `@hookform/resolvers/zod`, `react-toastify`).

Zod schema:
- `password`: required, min 8 chars, at least one letter and one number (same policy as `API-AUTH-CHANGE-PASSWORD`'s `newPassword`).
- `confirmPassword`: required, must equal `password`.

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleSubmit(onValid, onInvalid)` | React Hook Form validates with Zod. |
| `onValid(values)` | Call `useAcceptInvitationMutation()` with `{ token, password: values.password, confirmPassword: values.confirmPassword }`. |
| `mapApiErrorToForm(error)` | `VALIDATION_ERROR` → field errors. `INVITATION_TOKEN_INVALID`/`INVITATION_EXPIRED`/`INVITATION_ALREADY_ACCEPTED`/`USER_ALREADY_EXISTS` → set page-level state instead of a field error. |

## Submit Flow
```text
Page mounts, reads token from URL
    ↓
User enters Password / Confirm Password
    ↓
React Hook Form validates with Zod
    ↓
Call POST /api/auth/invitations/accept
    ↓
Success -> toast -> redirect to /login
Error (page-level codes) -> replace form with safe message
Error (VALIDATION_ERROR) -> field errors, form stays
```

## Error State
- `INVITATION_TOKEN_INVALID`: "This invitation link is invalid." — safe, does not reveal whether a token ever existed.
- `INVITATION_EXPIRED`: "This invitation has expired. Please ask an administrator to send a new one."
- `INVITATION_ALREADY_ACCEPTED`: "This invitation has already been used. Try logging in instead." with a link to `/login`.
- `USER_ALREADY_EXISTS`: same safe message as `INVITATION_ALREADY_ACCEPTED` (do not distinguish the two to the end user).
- Field-level `VALIDATION_ERROR` renders under the relevant input, same as every other auth form.
- Do not render raw backend error objects.

## Success Toast
```text
toast.success("Account created successfully. You can now log in.", {
  position: "top-right"
})
```

## The API Call Fires Only On Submit
The page must **not** call the accept endpoint on mount. Accepting is a one-time, irreversible state change that also requires a password the visitor has not typed yet: firing it on load would burn the token and leave the invitee permanently unable to finish, with no way to re-redeem the same link.

This is called out explicitly because an earlier implementation did exactly that — a `useEffect` posted `{ token }` alone as soon as the page opened, with no password field anywhere on screen. It compiled and rendered, but could never succeed against the real API, which requires `password` and `confirmPassword`.

## Ambiguities
None blocking. Whether the page should show the invited employee's name/email (read from the token before submit, via a lightweight "preview" API call) is not specified by the daily task and is not included in this contract — the accept endpoint only validates the token at submit time, not on page load.
