---
id: UI-DESIGN-SYSTEM
type: ui
module: global
status: draft
---

# Design System

## Purpose
Define the visual direction, component rules, interaction states, and accessibility expectations for the Employee Management System.

The product should feel like a modern internal operations tool: clear, fast, trustworthy, and energetic. The dominant theme is green, supported by neutral surfaces and restrained accent colors.

## Theme Concept
Theme name: `Green Momentum`.

Design intent:
- Use green as the main brand color to communicate growth, stability, and positive operational momentum.
- Keep screens work-focused and scannable for repeated employee-management tasks.
- Avoid a marketing-style UI. The app should feel like a professional admin system, not a landing page.
- Use subtle motion and crisp states to make actions feel responsive.

## Color Palette
Primary colors:

| Token | Use | Draft value |
| --- | --- | --- |
| `primary.50` | Soft backgrounds | `#ecfdf3` |
| `primary.100` | Hover backgrounds | `#d1fadf` |
| `primary.500` | Primary buttons, active nav | `#12b76a` |
| `primary.600` | Primary hover | `#039855` |
| `primary.700` | Active/pressed | `#027a48` |

Supporting colors:

| Token | Use | Draft value |
| --- | --- | --- |
| `neutral.50` | App background | `#f8faf9` |
| `neutral.100` | Subtle borders/backgrounds | `#eef2f0` |
| `neutral.700` | Body text | `#344054` |
| `neutral.900` | Headings | `#101828` |
| `info.500` | Informational states | `#2e90fa` |
| `warning.500` | Warning states | `#f79009` |
| `danger.600` | Delete/destructive actions | `#d92d20` |

Rules:
- Green is the dominant action and navigation color.
- Do not make every surface green; keep forms and tables on neutral white/surface backgrounds.
- Use danger red only for destructive actions such as delete confirmation.
- Use warning amber for caution states, not delete buttons.
- Auth/account pages may use the current preview background treatment: a soft green radial highlight blended into a light neutral vertical gradient.
- Auth/account gradients must stay subtle and must not become decorative or marketing-like.

## Typography
- Use a clean sans-serif font stack.
- Page titles should be clear and compact.
- Form labels must be readable and close to inputs.
- Do not scale font size with viewport width.
- Letter spacing must be `0`.
- Text must not overlap, truncate critical values without tooltip, or overflow buttons.

## Shape And Spacing
- App cards, auth panels, sidebar items, modals, and summary boxes use the current preview radius scale: `rounded-xl` to `rounded-2xl`.
- Inputs and buttons use `rounded-lg`.
- Use consistent spacing scale: `4`, `8`, `12`, `16`, `24`, `32`.
- Do not nest cards inside cards.
- Use stable dimensions for buttons, table rows, icon buttons, and modal actions to prevent layout shift.

## Components
### Buttons
| Variant | Use |
| --- | --- |
| Primary | Save, Confirm create, Confirm update, Login. |
| Secondary | Cancel, Back, neutral navigation. |
| Destructive | Confirm delete only. |
| Ghost/Icon | Toolbar and low-emphasis actions. |

Rules:
- Buttons must show hover, focus, disabled, and loading states.
- Primary buttons use green.
- Destructive buttons use danger red.
- Loading buttons prevent duplicate submit.

### Forms
- Labels appear above fields.
- Required fields should be visually indicated.
- Field-level errors appear directly below fields.
- Form-level errors appear near actions or inside confirm popup.
- Password fields must support show/hide password toggle.
- Do not display raw backend error objects.

### Tables
- Tables should optimize scanning.
- Row actions should use familiar icons where possible.
- Status values use small badges with approved labels.
- Do not show raw internal IDs as primary user-facing values.

### Modals And Confirm Popups
- Center modal in viewport.
- Dim page background behind modal.
- Use the preview modal treatment: `max-w-xl`, `rounded-2xl`, white panel, `p-6`, and `shadow-soft`.
- Trap focus while open.
- Escape closes only when no mutation is pending.
- Return focus to the triggering action when closed.
- Confirm create/update uses primary green action.
- Confirm delete uses destructive red action.

### Toasts
- Position: top-right.
- Success toasts use green.
- Error toasts use safe, concise messages.
- Do not show secrets or raw backend errors.

## Page States
| State | Behavior |
| --- | --- |
| Loading | Skeleton preferred for page/table; spinner acceptable for buttons. |
| Empty | Concise message and allowed primary action. |
| Error | Safe message with retry when applicable. |
| Forbidden | Explain missing permission without exposing internals. |
| Success | Toast or inline success according to page spec. |

## Accessibility
- All interactive controls must be keyboard reachable.
- Focus ring must be visible and theme-consistent.
- Forms must associate labels and errors with inputs.
- Dialogs must use dialog semantics.
- Color must not be the only signal for status or errors.

## Pending Decisions
- Exact font family is not approved.
- Exact Tailwind token configuration is not approved.
- Component library is not approved.
- Exact toast duration is not approved.
