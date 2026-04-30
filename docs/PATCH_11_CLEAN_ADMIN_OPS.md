# Patch 11 — Clean Admin/Ops Command Center

This patch rebuilds Patch 11 from the clean VitaVault base without carrying over the admin merge-conflict drift from the previous attempt.

## Scope

- Replaces `app/admin/page.tsx` with a clean Admin Command Center.
- Replaces `lib/admin-dashboard.ts` with a test-compatible admin data layer.
- Replaces `app/admin/actions.ts` with safe admin server actions.
- Keeps `app/ops/page.tsx` and `lib/ops-health.ts` as the Operations Command Center files from the current clean base.

## Admin Command Center

The admin page now focuses on safe, business-facing visibility:

- total users
- verified users and verification rate
- pending care-team invites
- admin accounts
- risk items
- active care access
- open alerts
- failed jobs
- active mobile/API sessions
- user roster snapshot
- recent users
- invite queue
- job activity
- merged audit feed

## Safe Admin Actions

The admin action file intentionally keeps the actions that are safe across branches:

- resend verification email
- revoke mobile/API sessions

This patch does not depend on account deactivation UI or fields, so it avoids the previous conflict cycle around `deactivatedAt`, `deactivatedReason`, `deactivateUserAction`, and `reactivateUserAction`.

## Test Compatibility

`lib/admin-dashboard.ts` keeps the same count/query shape expected by `tests/admin-dashboard.test.ts`:

- 8 count calls
- 2 user `findMany` calls
- invite/job/audit `findMany` calls

This avoids breaking the existing Vitest mock.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```

## Manual routes

- `/admin`
- `/ops`
- `/jobs`
- `/security`
