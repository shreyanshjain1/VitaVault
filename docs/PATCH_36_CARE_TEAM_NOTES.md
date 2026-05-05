# Patch 36 — Care Team Notes / Collaboration Layer

## Summary

Patch 36 adds a schema-backed care-note collaboration layer to VitaVault. The goal is to make care-team sharing feel active, not just read-only, by allowing patients, caregivers, doctors, and lab staff with the right permissions to add structured handoff notes.

## Added

- New `CareNote` Prisma model
- New care note enums:
  - `CareNoteCategory`
  - `CareNotePriority`
  - `CareNoteVisibility`
- New migration: `20260505000000_add_care_notes`
- New protected `/care-notes` workspace
- New care-note server actions:
  - create note
  - pin/unpin note
  - archive note
- Care-note audit events through `AccessAuditLog`
- Shared patient workspace care-note panel
- Quick note form on `/patient/[ownerUserId]` when the actor has `canAddNotes`
- Care Notes sidebar entry under Sharing & Reports
- Care Team page CTA to Care Notes

## Permission model

Care notes respect existing care-team permissions:

- Patient owner can create and manage notes on their own record.
- Shared members need `canAddNotes` to create, pin, or archive notes.
- Shared members with record view access can see care-team visible notes.
- Provider-visible notes can be used for clinical handoff context.

## Audit events

The patch writes access audit log entries for:

- `CARE_NOTE_CREATED`
- `CARE_NOTE_PINNED`
- `CARE_NOTE_UNPINNED`
- `CARE_NOTE_ARCHIVED`

## Routes

- `/care-notes`
- `/patient/[ownerUserId]` updated with a care notes panel
- `/care-team` updated with a Care Notes CTA

## Migration note

This patch includes a Prisma migration. After applying the files, run:

```bash
npx prisma migrate dev
npx prisma generate
```

For CI/Vercel, ensure the normal Prisma generate step still runs during install/build.
