# Patch 11H — Admin Conflict Cleanup

This hotfix resolves the remaining admin merge-conflict leftovers after Patch 11.

## Files changed

- `app/admin/page.tsx`
- `app/admin/actions.ts`
- `lib/admin-dashboard.ts`

## Fixes

- Removes the leftover deactivate/reactivate UI block from `app/admin/page.tsx`.
- Removes `Textarea`, `isDisabled`, `deactivatedAt`, and `deactivatedReason` usage from the admin page.
- Keeps a local `ProgressBar` helper so lint/typecheck do not fail.
- Keeps a local `AuditCard` helper so the merged audit feed renders safely.
- Keeps safe admin actions for verification resend and mobile/API session revocation.
- Keeps compatibility exports for `deactivateUserAction` and `reactivateUserAction`, but they only write audit/session-safe actions and do not touch missing Prisma fields.
- Removes the unused `deactivatedUsers` Promise result from `lib/admin-dashboard.ts`.
- Keeps `deactivatedUsers: 0` in the summary object only as a safe compatibility value.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
