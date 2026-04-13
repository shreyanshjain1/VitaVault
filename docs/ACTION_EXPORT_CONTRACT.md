# Action Export Contract

This project currently relies on a **single shared server action file** at `app/actions.ts`.

Because several pages import actions directly from that file, later patches can accidentally overwrite it and silently remove older exports. That was the root cause behind repeated deployment and typecheck regressions.

## Required exports

The following exports must continue to exist unless the page imports are refactored at the same time:

- `signupAction`
- `loginAction`
- `saveHealthProfile`
- `addDoctor`
- `updateDoctor`
- `deleteDoctor`
- `saveMedication`
- `updateMedication`
- `deleteMedication`
- `logMedicationStatus`
- `saveAppointment`
- `updateAppointment`
- `deleteAppointment`
- `saveLabResult`
- `updateLabResult`
- `deleteLabResult`
- `saveVital`
- `updateVital`
- `deleteVital`
- `saveSymptom`
- `updateSymptom`
- `toggleSymptomResolved`
- `deleteSymptom`
- `saveVaccination`
- `updateVaccination`
- `deleteVaccination`
- `uploadDocument`
- `updateDocumentMetadata`
- `deleteDocument`

## Workflow rule

Before pushing or deploying, run:

```bash
npm run actions:check
```

For a stronger local safety pass, run:

```bash
npm run verify
```

## Why this phase exists

This does **not** fully split actions by domain yet. That would be a bigger refactor and carries more risk.

This phase is intentionally conservative:

- keep the current import shape working
- stop regressions from accidental overwrites
- add a cheap safety net before future feature patches

Once the app is more stable, the next refactor can move actions into domain files and reduce the size of `app/actions.ts` safely.
