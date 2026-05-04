# Patch 22 — Admin Account Lifecycle Controls

## Summary

This patch upgrades the Admin Command Center with schema-backed account lifecycle controls using the existing `User.deactivatedAt` and `User.deactivatedReason` fields.

## Added

- Admin deactivate user action
- Admin reactivate user action
- Deactivation reason capture
- Deactivated account status in the user roster
- Deactivated user count in the admin summary
- Lifecycle controls panel in `/admin`
- Mobile/API session revocation during account deactivation
- Audit log entries for deactivate/reactivate/session revoke actions
- Mobile login/session checks that reject deactivated users

## Safety notes

- Admins cannot deactivate their own account from the Admin Command Center.
- Deactivation does not delete user data.
- Deactivation revokes mobile/API tokens, while existing protected app access is already blocked by the existing `requireUser()` guard.
- Reactivation clears `deactivatedAt` and `deactivatedReason`.

## Files changed

- `app/admin/page.tsx`
- `app/admin/actions.ts`
- `lib/admin-dashboard.ts`
- `lib/mobile-auth.ts`

## Database impact

No Prisma migration is required because the latest schema already includes:

```prisma
User.deactivatedAt
User.deactivatedReason
```

## Test checklist

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```

Manual checks:

- Visit `/admin` as an admin
- Deactivate a non-admin/non-current test user
- Confirm the user row shows `Deactivated`
- Confirm sessions can be revoked
- Reactivate the same user
- Confirm the row returns to `Active`
