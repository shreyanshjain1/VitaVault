# Phase 04E — Patient Summary PDF Export

## Goal
Add a safer business-facing export feature without introducing new infrastructure dependencies.

## What this patch adds
- richer `/summary` experience
- dedicated `/summary/print` route
- browser-native PDF export workflow via print dialog
- centralized summary data loader in `lib/patient-summary.ts`
- client export actions for print / open print view

## Why this approach
A browser-native print/PDF flow is lower risk than adding a new PDF rendering library or headless browser dependency.

## Validation
- `npm run typecheck`
- `npm run build`
- open `/summary`
- open `/summary/print`
- use browser print dialog and save as PDF
