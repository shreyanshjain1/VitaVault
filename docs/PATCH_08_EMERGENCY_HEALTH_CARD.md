# Patch 08 — Printable Emergency Health Card

## Summary

This patch adds a dedicated emergency health card workflow for VitaVault. The card pulls from existing records and presents the most important triage details in a print-friendly format.

## Added

- `/emergency-card` protected workspace page
- `/emergency-card/print` print-ready emergency card route
- Patient identity, blood type, allergies, chronic conditions, emergency contact, active medications, doctors, latest vitals, severe symptoms, and triage warnings
- Browser print and auto-print support
- Sidebar navigation entry for Emergency Card
- Shared emergency card data layer

## Technical notes

- No Prisma migration is required.
- Data comes from existing `HealthProfile`, `Medication`, `Doctor`, `VitalRecord`, and `SymptomEntry` records.
- The print route supports `/emergency-card/print?autoprint=1`.

## Manual test routes

- `/emergency-card`
- `/emergency-card/print`
- `/emergency-card/print?autoprint=1`
