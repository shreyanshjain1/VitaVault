
# Phase 02B - Action Import Hardening

## Goal

Stop action-layer regressions before deeper refactors or new feature work.

## What this phase does

- verifies the expected `app/actions.ts` export surface
- verifies page imports from `@/app/actions` against actual exports
- catches temp files, patch folders, and shadow copies that can reintroduce stale logic
- adds a stronger `npm run verify` workflow

## What this phase does not do

- no breaking refactor of server actions
- no page import rewrites
- no domain-module split yet

## Why this is the right next step

The current codebase already recovered the missing CRUD exports. The safer move now is to guard that surface so later patches cannot silently drop exports and break pages or Vercel builds again.

## Recommended workflow

```bash
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run build
```

## Next logical step after this

- patient summary PDF export, or
- a controlled domain split where `app/actions.ts` stays as a stable facade
