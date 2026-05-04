# Patch 16 — Visit Prep Hub

## Files changed

- `app/visit-prep/page.tsx`
- `lib/visit-prep.ts`
- `lib/app-routes.ts`

## Summary

This patch adds a protected Visit Prep Hub that helps patients prepare for provider appointments using existing VitaVault records.

## Added

- Protected `/visit-prep` route
- Visit readiness score
- Next appointment context panel
- Provider-ready prep task queue
- Readiness checklist for emergency contact, allergies, medications, labs, vitals, doctors, symptoms, and appointments
- Provider timeline from appointments, reminders, labs, symptoms, vitals, and documents
- Medication snapshot for active medications
- Care context panel for allergies, emergency contact, doctors, and document hygiene
- Review signals for open alerts and unresolved severe symptoms
- Sidebar navigation entry

## Implementation notes

- Uses existing Prisma models only
- Requires no database migration
- Does not add schema-level account, care, or admin changes
- Can be paired with the existing `/summary/print?mode=doctor` route for a printable handoff packet

## Manual checks

Visit:

```txt
/visit-prep
/appointments
/summary/print?mode=doctor
```

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
