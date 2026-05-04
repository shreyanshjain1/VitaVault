# Patch 21 — Navigation UX Cleanup

Patch 21 reorganizes the authenticated VitaVault navigation so the larger Patch 1–20 product surface is easier to browse.

## Why this patch exists

VitaVault now includes many product hubs: notifications, care plan, trends, medication safety, visit prep, lab review, vitals monitor, symptom review, admin, ops, API docs, and more. A flat sidebar made the app feel more crowded than necessary.

This patch groups the navigation by user workflow instead of by patch order.

## Navigation groups

### Overview
Daily workspace, triage, onboarding, care planning, and visit preparation.

### Records
Core patient-owned health records and longitudinal history.

### Monitoring
Safety review, alerts, reminders, device connections, and focused clinical review hubs.

### Sharing & Reports
Care-team collaboration, AI summaries, emergency card, patient summary, and exports.

### Admin & Ops
Security, audit log, admin workspace, job monitoring, operations, and API docs.

## Files changed

- `components/app-shell.tsx`
- `lib/app-routes.ts`

## Notes

- No Prisma migration is required.
- No server actions are changed.
- Existing route exports remain available through `primaryRoutes` and `utilityRoutes` for compatibility.
- New route groups are exported as `navigationSections` for cleaner future UI work.
