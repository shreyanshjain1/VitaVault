# Patch 44: Care Notes Cross-Workflow Integration

## Summary

This patch connects care-team notes into VitaVault's timeline, report builder, print packets, export readiness, and collaboration shortcuts.

## What changed

- Added `lib/care-note-workflows.ts` as a pure helper layer for care-note tone, risk, summary, and pre-share status logic.
- Added care notes to the patient timeline as `CARE_NOTE` events.
- Added care notes to report builder section controls and collaboration-heavy presets.
- Added care notes to report builder readiness metrics, pre-share action checks, and recent packet timeline.
- Added a print-ready Care Notes section to `/report-builder/print`.
- Added a care-team notes packet to Export Center.
- Added quick links from `/care-notes` into filtered timeline and care-team report workflows.
- Added unit tests for care-note workflow helpers and expanded report preset checks.

## Safety

- No Prisma schema changes.
- No migration changes.
- No package changes.
- Uses the existing `CareNote` model and existing permission-aware care-note workspace.
- Keeps persisted report history as a future enhancement.

## Follow-up ideas

- Persist generated report packets in a dedicated report history table.
- Add source-linked care-note references to AI insight citations.
- Allow care notes to be attached directly to specific records such as labs, appointments, or symptoms.
- Add care-note comment threads or acknowledgements for urgent handoff notes.
