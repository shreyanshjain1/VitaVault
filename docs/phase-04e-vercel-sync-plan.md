# Phase 04E deployment sync patch

This patch is for the Vercel build failure where pages import CRUD action exports
that are missing from `app/actions.ts`.

## Included fixes
- adds missing exported server actions for doctors
- adds missing exported server actions for appointments
- adds missing exported server actions for lab results
- adds missing exported server actions for documents
- adds safe local upload deletion helper

## Why Vercel failed
The deployment log shows the build on `main` still does not have these exports:
- `updateAppointment`
- `deleteAppointment`
- `updateDoctor`
- `deleteDoctor`
- `updateDocumentMetadata`
- `deleteDocument`
- `updateLabResult`
- `deleteLabResult`

## After applying
1. copy these files into the repo
2. run `npm run typecheck`
3. commit and push to `main`
4. redeploy on Vercel
