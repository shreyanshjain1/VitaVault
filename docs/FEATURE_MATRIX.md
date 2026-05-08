# VitaVault Feature Matrix

This matrix summarizes the current VitaVault product surface for recruiters, reviewers, and maintainers.

## Product layers

| Layer | Modules | Main value |
|---|---|---|
| Core workspace | Dashboard, onboarding, health profile, timeline, data quality | Central command center and structured first-run setup |
| Patient records | Medications, appointments, doctors, labs, vitals, symptoms, vaccinations, documents | Broad personal health record coverage |
| Care workflow | Notifications, care plan, visit prep, reminders, review queue, alerts | Converts records into next actions |
| Clinical review | Health trends, medication safety, lab review, vitals monitor, symptom review | Adds readiness scoring and follow-up prioritization |
| Collaboration | Care team, care notes, shared patient workspace, invites | Supports patient-controlled sharing and caregiver/provider visibility |
| Reports and handoff | Summary, report builder, saved report history, emergency card, exports, print pages | Supports doctor visits, emergency handoffs, and portable record packets |
| Mobile/device | Mobile auth APIs, mobile sessions, device connections, device readings, provider connector contracts, API docs | Shows backend readiness for mobile and connected-device ingestion |
| Security/admin/ops | Security center, audit log, admin, ops, jobs | Shows production-minded operating surfaces beyond normal CRUD |
| Public demo | `/demo`, `/demo/walkthrough`, demo module pages | Lets reviewers inspect the product surface without needing login |

## Authenticated route matrix

| Route | Purpose | Access/story note |
|---|---|---|
| `/dashboard` | Health command center | Authenticated user workspace |
| `/onboarding` | First-time health setup | Authenticated setup flow |
| `/health-profile` | Baseline patient context | Authenticated user data |
| `/timeline` | Longitudinal activity timeline | Includes health records and care-note events |
| `/data-quality` | Data quality center | Computes quality, readiness, and cleanup signals from current records |
| `/notifications` | Unified notification inbox | Combines alerts, reminders, appointments, labs, documents, invites, and devices |
| `/care-plan` | Care plan hub | Readiness score, prioritized actions, timeline, and care context |
| `/visit-prep` | Doctor visit preparation | Provider-ready prep queue and packet handoff context |
| `/emergency-card` | Emergency health card | Printable emergency profile and critical health context |
| `/trends` | Health trends analytics | Trend coverage, risk scoring, vitals/labs/symptoms/adherence signals |
| `/medication-safety` | Medication safety hub | Dose board, adherence, safety actions, reminders, and medication alerts |
| `/lab-review` | Lab review hub | Lab flags, trend cards, document coverage, and follow-up reminders |
| `/vitals-monitor` | Vitals monitor | Vital-sign status, deltas, watch zones, averages, timeline, and device signals |
| `/symptom-review` | Symptom review hub | Severity breakdown, unresolved symptoms, filters, and handoff signals |
| `/documents` | Document intelligence hub | Document readiness, filters, notes, and suggested next steps |
| `/care-team` | Care-team management | Invites, access control, and shared-care foundations |
| `/care-notes` | Collaboration notes | Patient-level notes connected to timeline, reports, print, and exports |
| `/patient/[ownerUserId]` | Shared patient workspace | Caregiver/provider view for granted access |
| `/ai-insights` | AI insight workspace | Stored insights and source-aware summary foundations |
| `/summary` | Patient summary | Handoff dashboard for patient context and report generation |
| `/summary/print` | Printable summary packet | Standard, compact, and doctor-visit print modes |
| `/report-builder` | Report builder | Preset-driven report packets, saved report history, and generated packet context |
| `/report-builder/print` | Printable report builder packet | Preserves selected preset and section context |
| `/exports` | Export center | Export readiness, packet options, and pre-export warnings |
| `/device-connection` | Device connection hub | Connection management, provider adapters, QA payloads, and sync context |
| `/device-connection/[id]` | Device detail view | Per-connection readings, sync jobs, job runs, metadata, and mirrored vitals |
| `/device-sync-simulator` | Device sync simulator | Demo/QA path for ingestion and sync job review |
| `/api-docs` | Mobile/device API docs | Product-facing API contract, OpenAPI, Postman, and provider reference |
| `/audit-log` | Audit log viewer | Scoped for regular users; broader activity for admin roles |
| `/security` | Security center | Account and mobile/API session security context |
| `/admin` | Admin command center | Admin-only route |
| `/ops` | Operations command center | Admin-only route |
| `/jobs` | Background job dashboard | Admin-only route |

## Current strongest signals

- Broad Prisma/PostgreSQL domain modeling
- Authenticated app structure with protected workflows
- Care-team sharing and shared patient workspace foundations
- Care notes connected across timeline, reports, print packets, and exports
- Alerts, reminders, notifications, and care-plan workflows
- Clinical review pages that turn records into action signals
- Report builder presets, saved report history, and print-ready handoff packets
- Mobile/device API foundations with schema-backed validation and security helpers
- Provider connector abstraction for Apple Health, Health Connect, Fitbit, BP monitors, scales, oximeters, and custom sources
- Admin, ops, audit, jobs, and security surfaces
- Route policy helper for admin-only surfaces
- No-login demo routes for reviewers
- Targeted test coverage for business logic and regression-prone helpers

## Best reviewer path

1. `/demo/walkthrough`
2. `/demo/dashboard`
3. `/demo/notifications`
4. `/demo/care-plan`
5. `/demo/visit-prep`
6. `/demo/trends`
7. `/demo/data-quality`
8. `/demo/exports`
9. `/demo/device-connection`
10. `/demo/security`

## Recommended next improvements

1. Mobile API SDK examples for JavaScript, React Native, and cURL
2. Data quality snapshots and cleanup trend history
3. Field-level care-team permissions
4. AI insights review and approval workflow
5. Worker heartbeat and queue health dashboard
6. Security hardening with persistent abuse tracking
7. Playwright smoke tests for the public demo path
8. Native mobile client prototype for Android Health Connect
9. Provider OAuth token storage for Fitbit-style integrations
10. Final screenshot refresh after the next visual UI pass
