
# Action Export Contract

`app/actions.ts` is a shared public server-action surface used by multiple pages.

## Rule

If a page imports from `@/app/actions`, the imported symbol must continue to be exported until that page is updated in the same change.

## Why this exists

The project previously had regressions where a later patch replaced `app/actions.ts` and accidentally dropped older CRUD exports. The pages still imported those names, which caused local and Vercel type/build failures.

## Required checks before push

```bash
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run build
```

## Current protected action surface

- signupAction
- loginAction
- saveHealthProfile
- addDoctor / updateDoctor / deleteDoctor
- saveMedication / updateMedication / deleteMedication / logMedicationStatus
- saveAppointment / updateAppointment / deleteAppointment
- saveLabResult / updateLabResult / deleteLabResult
- saveVital / updateVital / deleteVital
- saveSymptom / updateSymptom / toggleSymptomResolved / deleteSymptom
- saveVaccination / updateVaccination / deleteVaccination
- uploadDocument / updateDocumentMetadata / deleteDocument

## Next safe refactor path

If you later split `app/actions.ts` into domain modules, keep `app/actions.ts` as a stable facade that re-exports the same public names until all callers are migrated.
