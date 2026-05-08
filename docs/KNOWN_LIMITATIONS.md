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
| Report history | Report Builder can save report packets and keep generated packet context. | Add sharing delivery records, recipient tracking, and export attachment history. |
| Care notes | Care notes appear across timeline, report builder, print packets, and export readiness, but they are still patient-level notes. | Add optional links from notes to specific labs, appointments, medications, symptoms, documents, alerts, or reports. |
| AI insights | AI insight foundations exist, including source-aware direction, but production AI review workflows need stricter controls. | Add source review UI, prompt/version logging, patient disclaimers, moderation, and confidence labels. |
| Data quality | The Data Quality Center computes quality and readiness at request time. | Add saved snapshots so users can see cleanup progress over time. |
| Shared care | Shared patient access exists, but granular field-level permissions are not complete. | Add per-module sharing scopes and reviewable permission presets. |

## Mobile and device limitations

| Area | Current state | Recommended next step |
|---|---|---|
| Mobile API | Mobile auth, sessions, connections, readings, OpenAPI/Postman exports, rate limits, and payload guards exist. | Add SDK examples, persistent distributed rate limits, and request signing for production use. |
| Sleep readings | Sleep tracking is not currently part of the Prisma `DeviceReadingType` enum. | Add sleep support only through a deliberate Prisma enum migration and matching docs/tests. |
| Device ingestion | Device readings can be validated, ingested, reviewed, opened in per-device detail pages, and mirrored into vitals. Provider connector contracts describe how external sources should normalize records. | Build native/provider clients for Apple Health, Android Health Connect, Fitbit, and smart-device vendors. |
| Provider tokens | Provider connector contracts exist, but external OAuth token storage is not implemented. | Add encrypted provider-token storage before supporting Fitbit-style OAuth integrations. |
| Background sync | BullMQ/Redis foundations exist, and the Jobs dashboard supports admin filtering, retry, acknowledgement, and persisted cancellation. Production worker deployment still depends on environment setup. | Add true BullMQ dead-letter queues, Redis job removal from the UI, alerting, and hosted worker runbooks. |

## Demo limitations

| Area | Current state | Recommended next step |
|---|---|---|
| Public demo | `/demo` routes are read-only and use sample data for portfolio review. | Keep demo pages aligned whenever authenticated features change. |
| Live deployment | The Vercel demo may not have the database and secrets required for all authenticated flows. | Use the no-login demo for review and configure production env vars for full app testing. |
| Screenshots | The README screenshot gallery uses the actual `.mkdir/` filenames currently in the repository. | Keep filenames stable and refresh images after major visual redesigns. |

## Testing limitations

The project includes useful targeted tests, but it is not full end-to-end coverage yet.

Current coverage focuses on:

- action export/import hygiene
- route policy helpers
- migration safety checks
- mobile API validation and security helpers
- OpenAPI/Postman contract generation
- device provider connector helper logic
- export center readiness
- document storage and protected download behavior
- invite/outbound email helpers
- notification and care-note workflow helpers
- report builder presets and saved report history
- security helper behavior

Recommended future coverage:

1. Playwright flows for demo and authenticated route smoke tests
2. route-level RBAC tests for admin-only pages
3. report-builder print snapshot tests
4. shared patient permission tests
5. mobile API route integration tests
6. export packet generation tests
7. background job retry/rerun tests
