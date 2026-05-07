# VitaVault Known Limitations

VitaVault is a strong full-stack portfolio and product-foundation project, but it is not a regulated medical device, not a clinical decision support system, and not production-ready for real protected health information without additional compliance work.

This document keeps the current limitations honest so reviewers can understand what is implemented, what is simulated, and what should be hardened next.

## Production and compliance limitations

| Area | Current state | Recommended next step |
|---|---|---|
| Clinical safety | The app provides organization, summaries, and workflow signals, but it does not provide medical advice. | Add explicit patient/clinician disclaimers across AI, review hubs, reports, and emergency views. |
| HIPAA/PHI readiness | The architecture has protected routes and document delivery, but it has not completed regulatory compliance controls. | Add formal access policies, retention rules, audit review procedures, DPA/vendor review, and production security documentation. |
| Deployment security | Environment validation exists, but production hardening depends on real hosting and secret configuration. | Add deployment runbooks, secret rotation docs, backup/restore drills, and incident-response docs. |
| Document storage | The app has storage abstraction foundations, but real production file storage needs provider-specific security configuration. | Use S3/R2/Azure/GCS-style storage with signed URLs, encryption, malware scanning, and retention rules. |

## Data and workflow limitations

| Area | Current state | Recommended next step |
|---|---|---|
| Report history | Report Builder shows generated recent packet context, but report history is not persisted as a database model yet. | Add a `ReportPacket` or `GeneratedReport` model with saved parameters, creator, timestamps, and audit events. |
| Care notes | Care notes now appear across timeline, report builder, print packets, and export readiness, but they are still patient-level notes. | Add optional links from notes to specific labs, appointments, medications, symptoms, documents, alerts, or reports. |
| AI insights | AI insight foundations exist, including source-aware direction, but production AI review workflows need stricter controls. | Add source review UI, prompt/version logging, patient disclaimers, moderation, and confidence labels. |
| Data quality | Many pages show readiness and follow-up signals, but there is no dedicated data quality center yet. | Add a central data quality page for missing, stale, duplicate, contradictory, or incomplete records. |
| Shared care | Shared patient access exists, but granular field-level permissions are not complete. | Add per-module sharing scopes and reviewable permission presets. |

## Mobile and device limitations

| Area | Current state | Recommended next step |
|---|---|---|
| Mobile API | Mobile auth, sessions, connections, and device readings have schema-backed foundations. | Add OpenAPI output, SDK examples, rate limits, and request signing for production use. |
| Sleep readings | Sleep tracking is not currently part of the Prisma `DeviceReadingType` enum. | Add sleep support only through a deliberate Prisma enum migration and matching docs/tests. |
| Device ingestion | Device readings can be validated and ingested, but device-provider integrations are simulated/foundational. | Add provider-specific connectors and reconciliation logic for Apple Health, Health Connect, Fitbit, and smart devices. |
| Background sync | BullMQ/Redis foundations exist, but production worker deployment depends on environment setup. | Add queue dashboards, retry/rerun controls, dead-letter handling, and alerting. |

## Demo limitations

| Area | Current state | Recommended next step |
|---|---|---|
| Public demo | `/demo` routes are read-only and use sample data for portfolio review. | Keep demo pages aligned whenever authenticated features change. |
| Live deployment | The Vercel demo may not have the database and secrets required for all authenticated flows. | Use the no-login demo for review and configure production env vars for full app testing. |
| Screenshots | README screenshots may lag behind fast-moving UI patches. | Refresh screenshots after major visual updates and keep filenames stable. |

## Testing limitations

The project includes useful targeted tests, but it is not full end-to-end coverage yet.

Current coverage focuses on:

- action export/import hygiene
- route policy helpers
- migration safety checks
- mobile API validation
- export center readiness
- document storage and protected download behavior
- invite/outbound email helpers
- notification and care-note workflow helpers
- report builder presets
- security helper behavior

Recommended future coverage:

1. Playwright flows for demo and authenticated route smoke tests
2. route-level RBAC tests for admin-only pages
3. report-builder print snapshot tests
4. shared patient permission tests
5. mobile API route integration tests
6. export packet generation tests
7. background job retry/rerun tests

## Patch status notes

- Role-based navigation and admin-only route policy were polished in Patch 40.
- Migration safety was improved in Patch 41.
- Mobile API docs and schema-backed reading types were aligned in Patch 42.
- Report Builder presets and generated packet context were added in Patch 43.
- Care Notes were connected across timeline, report, print, and export workflows in Patch 44.
- Portfolio-facing README, feature matrix, known limitations, metadata, and demo wording were refreshed in Patch 45.
