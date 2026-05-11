# Patch 56 — Server-Side Route Guard Audit

## Summary

Patch 56 strengthens VitaVault's sensitive-route guard layer by extending the route policy registry beyond sidebar-only page routes and into high-risk API surfaces.

The patch keeps the change focused and low risk: it does not add database migrations, does not change public README content, and does not modify the user-facing route layout.

## What changed

- Added API route policies for:
  - `/api/jobs/dispatch`
  - `/api/internal/alerts/scan`
  - `/api/internal/alerts/evaluate`
- Added a sensitive-route audit list covering admin pages and privileged APIs.
- Added route-policy lookup helpers for exact and nested route checks.
- Added an API-safe route guard that returns JSON `401` / `403` responses instead of relying on page redirects.
- Updated `/api/jobs/dispatch` to use the centralized API route policy guard.
- Expanded route-policy tests to verify:
  - admin sidebar routes are backed by admin route policies
  - sensitive page/API routes are tracked in one audit list
  - admin-only API policies reject non-admin roles
  - nested and query-string route paths map back to their owning policies

## Files changed

- `lib/route-policy.ts`
- `app/api/jobs/dispatch/route.ts`
- `tests/route-policy.test.ts`
- `docs/PATCH_56_SERVER_SIDE_ROUTE_GUARD_AUDIT.md`

## Safety notes

- No Prisma migration is required.
- No package changes are required.
- No README changes were made.
- Existing admin page guards remain intact.
- Existing internal alert API token behavior remains intact.
- The job dispatch API now returns a proper JSON `401` response for unauthenticated requests and a JSON `403` response for non-admin sessions.

## Recommended checks

```powershell
npm install
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```

Targeted test:

```powershell
npm run test:run -- tests/route-policy.test.ts
```
