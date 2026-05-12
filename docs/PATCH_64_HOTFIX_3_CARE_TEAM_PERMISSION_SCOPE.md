# Patch 64 Hotfix 3 — Care Team Permission Scope Fix

## Summary

This hotfix fixes the remaining TypeScript error in `app/care-team/actions.ts` after the Patch 64 lint cleanup.

## Problem

The `permissions` variable was declared inside `revokeCareAccessAction()`, where it was not used, but the `updateCareAccessPermissionsAction()` function still spread `...permissions` inside the update payload.

That caused:

```txt
Cannot find name 'permissions'. Did you mean 'Permissions'?
```

It also caused an ESLint warning because the misplaced declaration was unused.

## Fix

- Removed the unused `permissionsFromForm(formData)` declaration from `revokeCareAccessAction()`.
- Restored `const permissions = permissionsFromForm(formData);` inside `updateCareAccessPermissionsAction()` before the database update payload.

## Safety

- No Prisma migration.
- No schema changes.
- No package changes.
- No README changes.
- No behavior changes beyond restoring the intended permission update payload.
