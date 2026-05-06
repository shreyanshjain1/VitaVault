# Patch 40 — Role-Based Experience Polish

Patch 40 tightens the difference between authenticated user-facing surfaces and administrator-only operations surfaces.

## What changed

- Added `lib/route-policy.ts` as the central policy map for sensitive direct routes.
- Enforced admin-only direct access for `/admin`, `/jobs`, and `/ops` through shared server-side policy helpers.
- Kept `/audit-log` visible for regular users as a scoped security/audit workspace while preserving admin-wide visibility in the data layer.
- Moved `/api-docs` out of the Admin & Ops navigation group and into authenticated account-level navigation for reviewer/mobile API visibility.
- Hid admin-only audit links from non-admin audit views.
- Added route-policy tests covering navigation visibility and direct route policy rules.

## Policy after this patch

| Route | Sidebar visibility | Direct access |
| --- | --- | --- |
| `/admin` | Admin only | Admin only |
| `/jobs` | Admin only | Admin only |
| `/ops` | Admin only | Admin only |
| `/audit-log` | Authenticated users | Scoped for regular users, wider for admins |
| `/api-docs` | Authenticated users | Authenticated users |
| `/device-connection` | Authenticated users | Authenticated users |

## Migration note

This patch intentionally does not touch Prisma schema or migrations. The previously identified reminder migration safety issue should remain a separate focused hotfix.
