---
id: UI-PREVIEW-OUTPUT
type: ui
module: global
status: draft
depends_on:
  - UI-DESIGN-SYSTEM
  - UI-LAYOUT
---

# Preview Output

## Purpose
Define how static HTML UI/UX previews are generated from `docs/05-ui-ux` specs.

## Output Rule
Every page spec in `docs/05-ui-ux/pages` must have a matching standalone HTML preview file.

Standalone means:
- The HTML file must render the page directly.
- The HTML file must not redirect to `index-tailwind.html`.
- The HTML file must not depend on hash routing in another page.
- Shared visual style may be repeated or loaded through shared static assets, but each page file must open independently.

Current required preview files:

| UI page spec | Required HTML preview |
| --- | --- |
| `pages/login.md` | `docs/05-ui-ux-preview/pages/login.html` |
| `pages/forgot-password.md` | `docs/05-ui-ux-preview/pages/forgot-password.html` |
| `pages/change-password.md` | `docs/05-ui-ux-preview/pages/change-password.html` |
| `pages/employee-list.md` | `docs/05-ui-ux-preview/pages/employee-list.html` |
| `pages/employee-create.md` | `docs/05-ui-ux-preview/pages/employee-create.html` |
| `pages/employee-detail.md` | `docs/05-ui-ux-preview/pages/employee-detail.html` |
| `pages/employee-edit.md` | `docs/05-ui-ux-preview/pages/employee-edit.html` |

## Index Rule
`docs/05-ui-ux-preview/index.html` may exist only as a preview hub linking to page files. It must not be the only place where all page previews live, and page files must not redirect back to the hub.

## Layout Rules
- Login, Forgot Password, and Change Password previews use centered account layout when their page specs require it.
- Authenticated pages use app layout.
- Navbar contains page title, conditional back button, and user dropdown.
- In the current standalone preview, Employee List uses the full user dropdown; Create, Detail, and Edit use the compact `Admin User` navbar text.
- Breadcrumb renders inside Wrap Content above page body.
- Breadcrumb must not appear inside Navbar/header markup in any standalone HTML preview.
- Breadcrumb segments with known page targets must be rendered as links. The current page segment remains plain text.
- Top-level pages hide the back button.
- Child pages show the back button.
- Sidebar uses a two-level menu. Level 1 toggles level 2 visibility, and level 2 items include icons.
- `change-password.html` must render as a standalone centered account form, visually matching `forgot-password.html`, without navbar, sidebar, or breadcrumb.

## Employee List Preview Rules
- Match `UI-EMPLOYEE-LIST`.
- Include breadcrumb, toolbar, data table, pagination, and delete confirm popup.
- Data table wrapper must use `overflow-auto` and fixed height `h-[calc(100vh-380px)]` so additional records scroll inside the table area.
- Do not add unlisted statistics cards.
- Do not duplicate the navbar title as a page-level H1.
- Put `Create Employee` in the toolbar action area only.

## Pending Decisions
- Whether previews should use Tailwind CDN or compiled local CSS.
- Whether shared preview assets should be extracted to separate files.
