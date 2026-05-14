# Patch 79: Docs Navigation and Architecture Map

## Summary

This patch adds a clean documentation entrypoint and high-level reviewer maps for VitaVault. The project already has many detailed patch notes, so this patch makes the docs folder easier to navigate without changing runtime code.

## Files added

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURE_MAP.md`
- `docs/API_OVERVIEW.md`

## What changed

- Added a documentation hub that points reviewers to the best starting documents.
- Added a high-level architecture guide covering app layers, domain helpers, data access, mobile/device APIs, jobs, reports, and testing strategy.
- Added a workflow-based feature map organized by product areas instead of patch history.
- Added an API overview for route groups, mobile API surfaces, internal APIs, exports, and safety expectations.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No `package-lock.json` changes.
- No runtime code changes.
- No README changes.

## Validation

Recommended checks after applying:

```powershell
npm run db:validate:ci
npm run typecheck
npm run lint
npm run test:run
```

Because this is docs-only, the main validation goal is making sure the project still passes the usual checks and the new docs link to intended existing project surfaces.
