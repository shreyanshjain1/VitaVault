# Patch 23 — AI Insights v2

## Summary

This patch upgrades VitaVault's AI Insights page from a simple latest-insight viewer into a source-aware AI workspace.

## What changed

- Added `lib/ai-insights-workspace.ts` as a dedicated AI insight aggregation layer.
- Rebuilt `/ai-insights` into a richer command center.
- Added AI readiness scoring.
- Added source coverage cards for medications, labs, vitals, symptoms, documents, and appointments.
- Added a risk signal board from alerts, abnormal labs, unresolved severe symptoms, missed medication logs, and vital review signals.
- Added suggested clinician questions from saved AI output.
- Added recommended follow-up queue from saved AI output and due reminders.
- Added prompt transparency notes so reviewers understand what the AI can and cannot use.
- Preserved the existing generate action and fallback behavior.
- Preserved shared patient workspaces where care-team AI permission is enabled.

## Safety notes

The feature remains informational only. It does not diagnose, prescribe, or replace clinician review.

## Migration

No Prisma migration is required.
