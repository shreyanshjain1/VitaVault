# Patch 11 — Admin/Ops Command Center Upgrade

## Summary

This patch upgrades VitaVault's admin and operations surfaces into stronger business-facing command centers. It focuses on clearer product storytelling, operational readiness, user lifecycle visibility, risk triage, and reviewer-friendly admin workflows.

## Files changed

- `app/admin/page.tsx`
- `app/ops/page.tsx`
- `lib/admin-dashboard.ts`
- `lib/ops-health.ts`
- `docs/PATCH_11_ADMIN_OPS_COMMAND_CENTER.md`

## Admin upgrades

- Renames the page experience into an admin command center.
- Adds a business-facing hero with user count, care relationship count, verification rate, recent growth, and risk item count.
- Adds an admin runbook panel for reviewing alerts, jobs, pending verification, invites, and audit logs.
- Adds an operational risk board covering high-priority alerts, failed jobs, failed syncs, stale devices, pending verification, and overdue reminders.
- Adds role mix distribution across patients, caregivers, doctors, lab staff, and admins.
- Keeps user lifecycle actions intact: deactivate/reactivate user, revoke mobile/API sessions, and resend verification email.
- Keeps roster, recent users, invite queue, recent jobs, and audit feed sections.

## Operations upgrades

- Upgrades `/ops` into a stronger operations command center.
- Adds deployment readiness scoring.
- Adds required and recommended environment readiness checks.
- Adds a recommended runbook with links to jobs, alerts, care team, and security.
- Adds workload risk cards for clinical review load, reminder pressure, worker reliability, care-sharing backlog, and device freshness.
- Adds recent failed job run review.
- Adds recent sync failure review.
- Adds open alert queue.
- Adds pending invite queue.
- Adds reminder delivery signal.

## Stability fixes included

- Fixes a duplicate `tone` property in `lib/ops-health.ts` that could break TypeScript compilation.
- Keeps the patch schema-safe with no Prisma migration required.
- Reuses existing models and operational data already present in VitaVault.

## Manual test routes

- `/admin`
- `/ops`
- `/jobs`
- `/audit-log`
- `/security`

## Validation commands

```bash
npm run typecheck
npm run lint
npm run test:run
```
