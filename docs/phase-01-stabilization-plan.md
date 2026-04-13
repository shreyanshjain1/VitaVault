# VitaVault Phase 01 - Stabilization Plan

This patch is the foundation pass before feature work.

## Goals
- stabilize auth action return flow and remove avoidable TypeScript friction
- make form validation safer for empty numeric/string inputs
- make CI fail earlier on Prisma/schema issues
- clean the initial migration so fresh setup is easier to trust and review

## Included in this patch
1. `app/actions.ts`
   - tightened callback URL helper typing
   - fixed auth action return flow after `redirect()` so TypeScript no longer complains about missing returns
   - removed one implicit-any callback hotspot in medication schedule validation

2. `lib/validations.ts`
   - added preprocessing helpers so empty string inputs become `undefined`
   - fixed the common bug where empty numeric fields could be coerced to `0`
   - trimmed signup/login/profile inputs more consistently

3. `.github/workflows/ci.yml`
   - added Prisma schema validation before typecheck

4. `package.json`
   - added `db:validate`
   - added `check` to run schema validation + typecheck together

5. `prisma/migrations/0_init/migration.sql`
   - reformatted the collapsed one-line migration into readable multi-line SQL without changing intent

## Recommended verification after applying
```bash
npm install
npm run db:validate
npm run typecheck
```

## What comes next
Phase 02 should focus on finishing the CRUD lifecycle for core modules:
- doctors edit/delete
- medications edit/archive
- appointments edit/cancel
- labs edit/delete
- vitals edit/delete
- symptoms resolve/edit/delete
- vaccinations edit/delete
- documents replace/delete
