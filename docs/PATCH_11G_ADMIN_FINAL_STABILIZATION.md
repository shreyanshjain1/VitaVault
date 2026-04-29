# Patch 11G — Admin Final CI Stabilization

This hotfix stabilizes the Patch 11 admin command center after repeated CI drift around the admin page, admin actions, and admin data helper.

## Why this patch exists

Some branches had a mixed admin state where the page referenced helpers or schema fields that were not available in the generated Prisma client used by CI.

This patch removes those risky references and keeps the admin workspace focused on controls that are already supported by the existing schema.

## Changed files

- `app/admin/page.tsx`
- `app/admin/actions.ts`
- `lib/admin-dashboard.ts`
- `docs/PATCH_11G_ADMIN_FINAL_STABILIZATION.md`

## Fixes

- Defines `ProgressBar` locally in the admin page.
- Defines `AuditCard` locally in the admin page.
- Removes schema-level `deactivatedAt` and `deactivatedReason` usage from the admin page and data helper.
- Removes UI dependency on missing deactivate/reactivate fields.
- Keeps safe admin actions:
  - resend verification email
  - revoke mobile/API sessions
- Keeps compatibility exports for deactivate/reactivate action names, but implements them as safe audit/session workflows without touching missing schema fields.
- Keeps the admin dashboard test mock stable by using the original supported data delegates and count order.

## Validation

After applying, run:

```bash
npm run lint
npm run typecheck
npm run test:run
```

No Prisma migration is required.
