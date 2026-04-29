# Patch 07 — Audit Log Viewer and Security Activity Center

This patch adds a unified audit/security review surface to VitaVault.

## Files changed

```txt
app/audit-log/page.tsx
app/security/page.tsx
lib/audit-log.ts
docs/PATCH_07_AUDIT_SECURITY_CENTER.md
```

## What was added

- New protected `/audit-log` page.
- Unified activity feed across care access audit logs, alert audit logs, reminder audit logs, worker job runs, and mobile/API session events.
- Source filter for access, alert, reminder, job, and session events.
- Severity filter for info, warning, danger, and success events.
- Free-text search across action, actor, owner, target, note, and metadata.
- Summary cards for visible events, high-risk events, warnings, open alerts, failed jobs, and active sessions.
- CSV-style visible event export action.
- Security Center link to the new Audit Log page.
- Admin-aware visibility: admins can review system-wide activity, while normal users are scoped to their own workspace.

## Notes

- No Prisma migration is required.
- This patch uses existing audit/session/job models already present in the schema.
- This is intentionally a review surface first; destructive moderation actions remain in the existing Security/Admin pages.

## Suggested verification

```bash
npm run typecheck
npm run lint
npm run test:run
```

Manual routes:

```txt
/audit-log
/security
```
