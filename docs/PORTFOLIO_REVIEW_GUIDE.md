# VitaVault Portfolio Review Guide

This guide is written for recruiters, technical reviewers, and maintainers who want to understand VitaVault quickly without reading every file first.

## Fastest review path

Use the public demo routes first:

1. `/demo/walkthrough`
2. `/demo/dashboard`
3. `/demo/notifications`
4. `/demo/care-plan`
5. `/demo/visit-prep`
6. `/demo/trends`
7. `/demo/exports`
8. `/demo/security`
9. `/demo/admin`

The public demo is read-only and uses sample data, but it shows the intended product story without requiring login or a configured database.

## What to inspect in the code

| File or folder | Why it matters |
|---|---|
| `prisma/schema.prisma` | Shows the full health-product domain model. |
| `app/` | Shows the Next.js App Router structure and product route surface. |
| `lib/route-policy.ts` | Central route-access policy helper for admin-only surfaces. |
| `lib/report-builder.ts` | Report builder aggregation and packet logic. |
| `lib/report-builder-presets.ts` | Scenario-based report preset contract. |
| `lib/care-note-workflows.ts` | Care-note workflow mapping used across timeline/report/export surfaces. |
| `lib/mobile-device-api.ts` | Shared mobile/device API validation contract. |
| `lib/export-center.ts` | Export readiness and packet preparation logic. |
| `tests/` | Targeted Vitest coverage for regression-prone business helpers. |
| `docs/` | Product documentation, feature matrix, limitations, and patch notes. |

## Product story in one minute

VitaVault is a personal health record platform that expands beyond forms and dashboards. It models the workflows around health data: care-team sharing, notifications, visit prep, clinical review, report packets, exports, mobile/device ingestion, AI insight foundations, and admin/ops/security surfaces.

The project is meant to show that the developer can think beyond UI screens and build a product foundation with:

- structured data modeling
- server-side validation
- protected routes
- role-aware navigation
- audit/security workflows
- testable pure business logic
- report and export workflows
- demo/reviewer experience
- production-minded docs and limitations

## Strongest technical signals

- Large Prisma domain model with health records, collaboration, alerts, jobs, devices, AI, exports, and audit concepts
- Next.js App Router implementation with many protected product routes
- Auth.js / NextAuth authentication foundation
- Zod-backed server validation patterns
- Mobile/device API contract separated into reusable validation logic
- Report Builder presets separated into pure helper functions
- Care Notes connected across multiple workflows without adding risky schema changes
- Route policy helper used to keep admin-only routes consistent
- Vitest tests for helpers and risky regressions
- Action export/import hygiene scripts

## Suggested demo narration

A strong walkthrough can be explained like this:

1. Start with the dashboard as the patient command center.
2. Show how records feed into notifications, care plan, and visit prep.
3. Show clinical review hubs for trends, medication safety, labs, vitals, and symptoms.
4. Show report builder and exports as doctor handoff workflows.
5. Show care team and care notes as collaboration foundations.
6. Show device/API docs and device sync simulator as mobile-readiness foundations.
7. End with security, audit log, jobs, ops, and admin to prove the app thinks about operations.

## Current limitations to mention honestly

- It is a portfolio/product foundation, not a real regulated clinical system.
- Public demo pages are read-only.
- Full authenticated flows require database and environment configuration.
- Persistent report history and record-attached care notes are future work.
- Production document storage, compliance controls, and provider-specific device integrations need hardening.

## Recommended future patch ideas

1. Persistent report history model
2. Record-attached care notes
3. Background jobs v2 with admin retry tools
4. Data Quality Center
5. Production document storage provider hardening
6. Playwright demo smoke tests
7. OpenAPI spec generation for mobile routes
