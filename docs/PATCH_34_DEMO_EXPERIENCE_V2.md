# Patch 34 — Demo Experience v2

## Summary

This patch expands VitaVault's public demo experience so the read-only `/demo` area mirrors the newer authenticated product hubs added after the original demo surface.

## Added demo routes

- `/demo/notifications`
- `/demo/care-plan`
- `/demo/trends`
- `/demo/medication-safety`
- `/demo/visit-prep`
- `/demo/lab-review`
- `/demo/vitals-monitor`
- `/demo/symptom-review`
- `/demo/device-sync-simulator`
- `/demo/emergency-card`
- `/demo/audit-log`
- `/demo/api-docs`

## Updated files

- `lib/demo-data.ts`
- `app/demo/walkthrough/page.tsx`

## Notes

This is a demo-only patch. It does not write to the database and requires no Prisma migration.
