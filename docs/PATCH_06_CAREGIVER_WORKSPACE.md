# Patch 06 - Caregiver Shared Patient Workspace

## Summary

This patch upgrades the shared patient route into a more complete caregiver command center. It turns `/patient/[ownerUserId]` from a long record dump into an access-aware workspace with patient context, permission visibility, attention items, care timeline, recent activity, AI insight context, and care-team visibility.

## Files changed

```txt
app/patient/[ownerUserId]/page.tsx
lib/caregiver-workspace.ts
docs/PATCH_06_CAREGIVER_WORKSPACE.md
```

## What changed

- Rebuilt the shared patient page as a caregiver-friendly workspace.
- Added a shared patient hero with identity, access role, emergency context, and care summary.
- Added key metrics for alerts, reminders, active medications, and documents.
- Added a prioritized `Needs attention` panel from:
  - care-team visible alert events
  - abnormal/borderline labs
  - unresolved symptoms
  - due/overdue/missed reminders
- Added upcoming care timeline.
- Added recent record activity from vitals, symptoms, and documents.
- Added visible permission matrix for shared access.
- Added latest AI insight card.
- Added active care-team member cards.
- Added active medication, appointment, and lab mini-panels.
- Added a dedicated `lib/caregiver-workspace.ts` query/aggregation layer.
- Requires no Prisma migration.

## Why this patch matters

The care-team backend was already strong, but the old shared patient route did not fully showcase the collaboration value. This patch makes the shared view feel closer to a real care-coordination product surface.

## Manual QA

Visit a shared patient route after accepting a care invite:

```txt
/patient/[ownerUserId]
```

Check:

- page loads for active care access
- permission badges match the care grant
- AI button only appears when AI permission is granted
- print packet button only appears when export permission is granted
- attention items are populated from alerts/labs/symptoms/reminders
- empty states appear cleanly for new users

## Suggested checks

```bash
npm run typecheck
npm run lint
npm run test:run
```
