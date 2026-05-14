# Patch 75 — Security and Audit Review Dashboard Polish

## Summary

This patch improves VitaVault's security and audit review experience by adding clearer risk classification, review queues, and checklist-style guidance around sensitive account/system events.

## Changes

- Added audit event risk signals for critical, review, monitor, and logged states.
- Added audit review summary counts for visible audit events.
- Added an audit review checklist for critical events, warnings, failed jobs, and open alerts.
- Updated `/audit-log` with a review queue metric, risk badges, action labels, and next-step guidance per event.
- Added a Security Review Dashboard panel to `/security`.
- Added security review checklist helpers for readiness, mobile sessions, care invites, and linked exposure.
- Removed patch-history wording from the Security Center summary card.
- Added tests for audit risk classification and security review dashboard helpers.

## Safety

- No Prisma migration.
- No schema changes.
- No dependency changes.
- No README changes.
- No auth/session behavior changes.
- No audit write behavior changes.
- Existing security actions remain compatible.

## Checks

Run locally:

```powershell
npm install
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```

Targeted tests:

```powershell
npm run test:run -- tests/security-hardening.test.ts tests/audit-log.test.ts
```
