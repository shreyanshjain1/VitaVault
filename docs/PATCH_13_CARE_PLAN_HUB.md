# Patch 13 — Care Plan Hub

This patch adds a new protected `/care-plan` page that turns existing VitaVault records into a prioritized care-planning workspace.

## Added

- New `/care-plan` route
- `lib/care-plan.ts` data aggregation layer
- Care-plan readiness score
- Profile, record, and workflow readiness sections
- Prioritized action list from:
  - open alerts
  - due/overdue reminders
  - abnormal lab results
  - unresolved moderate/severe symptoms
  - missing profile emergency/allergy details
  - unlinked medical documents
  - missing active medication context
- Upcoming care timeline from:
  - appointments
  - reminders
  - vaccination due dates
- Care context snapshot for:
  - providers
  - active medications
  - latest vitals
- Sidebar navigation entry

## Notes

- No Prisma migration required.
- Uses existing models only.
- Does not add new write actions.
- Safe to merge after Patch 12.
