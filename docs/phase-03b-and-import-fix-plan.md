# Phase 03B + import/export reconciliation

This patch does two things together:

1. Fixes the missing action exports that were causing `npm run typecheck` to fail after the record-management pages were updated.
2. Adds the first working pass of alert rule management so the alert center can move beyond a read-only placeholder flow.

## Included in this patch

- Restores and exports missing actions in `app/actions.ts`
  - `updateDoctor`
  - `deleteDoctor`
  - `updateAppointment`
  - `deleteAppointment`
  - `updateLabResult`
  - `deleteLabResult`
  - `updateDocumentMetadata`
  - `deleteDocument`
- Re-includes the previously added clinical-record CRUD actions so your action layer is complete in one file.
- Adds `deleteUpload()` helper to clean up local uploaded files when records are deleted.
- Extends the alert center with a dedicated rules page:
  - create rule
  - edit rule
  - delete rule
  - rules list with event counts and settings
- Updates alert queries and the main alerts page to use the rules screen.

## Apply order

1. Paste these files into the project.
2. Run:

```bash
npm run typecheck
```

3. If Prisma types are out of date, run:

```bash
npx prisma generate
npm run typecheck
```

## Expected outcome

- The import errors from `app/appointments/page.tsx`, `app/doctors/page.tsx`, `app/documents/page.tsx`, and `app/labs/page.tsx` should be resolved.
- The alert center gets a manageable rules layer at `/alerts/rules`.

## Notes

- This patch assumes your repo already has the alert models from the Phase 03A patch in the Prisma schema/client.
- If `db.alertRule` or `db.alertEvent` are missing, regenerate Prisma client and make sure the Phase 03A schema patch has already been applied.
