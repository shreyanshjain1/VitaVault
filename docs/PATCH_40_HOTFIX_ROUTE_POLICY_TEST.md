# Patch 40 Hotfix: Route Policy Test Isolation

## Summary

This hotfix keeps the Patch 40 role policy behavior intact while making the pure route policy helpers safe to import in Vitest.

## Problem fixed

`tests/route-policy.test.ts` imported `lib/route-policy.ts`. The previous version of `lib/route-policy.ts` had top-level imports from `next/navigation` and `@/lib/session`. That caused Vitest to follow the Auth.js / Next.js server module chain and fail with:

```txt
Cannot find module 'next/server' imported from next-auth/lib/env.js
Did you mean to import "next/server.js"?
```

## Change

- Removed server-only imports from the top level of `lib/route-policy.ts`.
- Kept pure helpers importable by tests:
  - `routePolicies`
  - `canAccessRoutePolicy`
  - `isAdminRole`
- Moved server-only imports into `requireRoutePolicy()` through dynamic imports.

## Safety

- No Prisma changes.
- No package changes.
- No route behavior change.
- No test expectation changes.
- This only fixes test import isolation.
