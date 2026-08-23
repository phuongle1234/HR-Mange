---
id: UI-RESPONSIVE
type: ui
module: global
status: draft
---

# Responsive

## Purpose
Define responsive behavior for public auth pages, authenticated layouts, forms, tables, and confirmation popups.

## Breakpoint Intent
| Viewport | Behavior |
| --- | --- |
| Desktop | Sidebar visible, navbar fixed, content uses full available workspace. |
| Tablet | Sidebar may collapse or become drawer; content remains scannable. |
| Mobile | Sidebar becomes drawer; forms and actions stack vertically. |

Exact Tailwind breakpoint values follow default Tailwind unless the implementation spec changes them.

## Auth Pages
- Login form is centered horizontally and vertically.
- Forgot Password form is centered horizontally and vertically.
- Change Password form is centered horizontally and vertically when using `CenteredAccountLayout`.
- Auth form width should be constrained for readability.
- On mobile, auth form uses nearly full width with safe page padding.
- Do not show sidebar/navbar on centered auth/account pages.

## App Layout
- Navbar remains visible at top.
- Desktop sidebar uses fixed width.
- Mobile sidebar opens as drawer.
- Wrap content scrolls vertically without breaking navbar.

## Forms
- Desktop forms may use one or two columns depending field grouping.
- Mobile forms use single column.
- Action buttons stack full-width on small screens.
- Field error text must wrap without overlapping adjacent fields.

## Tables
- Desktop table shows all approved columns where space allows.
- Tablet may reduce lower-priority columns.
- Mobile may use horizontal scroll or responsive row cards if approved.
- Row action buttons must remain reachable and not overlap table text.

## Confirm Popups
- Desktop modal uses constrained width.
- Mobile modal uses safe margins and full-width actions.
- Modal body scrolls internally if content exceeds viewport.
- Focus trap and Escape behavior remain the same across viewports.

## Accessibility
- Touch targets should be at least 44px high where practical.
- Keyboard focus order must follow visual order.
- Responsive changes must not hide required form errors or actions.

## Pending Decisions
- Exact sidebar mobile drawer behavior.
- Whether employee table becomes cards on mobile.
- Exact max widths for auth forms and app content.
