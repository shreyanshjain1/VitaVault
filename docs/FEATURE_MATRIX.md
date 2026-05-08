# VitaVault Feature Matrix

This matrix summarizes the current VitaVault product surface after the latest portfolio-polish pass. It is meant for recruiters, reviewers, and maintainers who want a fast view of what the app demonstrates.

## Product layers

| Layer | Modules | Main value |
|---|---|---|
| Core workspace | Dashboard, onboarding, health profile, timeline | Central command center and structured first-run setup |
| Patient records | Medications, appointments, doctors, labs, vitals, symptoms, vaccinations, documents | Broad personal health record coverage |
| Care workflow | Notifications, care plan, visit prep, reminders, review queue, alerts | Converts records into next actions |
| Clinical review | Health trends, medication safety, lab review, vitals monitor, symptom review | Adds readiness scoring and follow-up prioritization |
| Collaboration | Care team, care notes, shared patient workspace, invites | Supports patient-controlled sharing and caregiver/provider visibility |
| Reports and handoff | Summary, report builder, emergency card, exports, print pages | Supports doctor visits, emergency handoffs, and portable record packets |
| Mobile/device | Mobile auth APIs, mobile sessions, device connections, device readings, API docs | Shows backend readiness for mobile and connected-device ingestion |
| Security/admin/ops | Security center, audit log, admin, ops, jobs | Shows production-minded operating surfaces beyond normal CRUD |
| Public demo | `/demo`, `/demo/walkthrough`, demo module pages | Lets reviewers inspect the product surface without needing login |

## Authenticated route matrix

| Route | Purpose | Access/story note |
|---|---|---|
| `/dashboard` | Health command center | Authenticated user workspace |
| `/onboarding` | First-time health setup | Authenticated setup flow |
| `/health-profile` | Baseline patient context | Authenticated user data |
| `/timeline` | Longitudinal activity timeline | Includes health records and care-note events |
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
| `/report-builder` | Report builder | Preset-driven report packets and generated recent-packet context |
| `/report-builder/print` | Printable report builder packet | Preserves selected preset and section context |
| `/exports` | Export center | Export readiness, packet options, and pre-export warnings |
| `/device-connection` | Device connection hub | Mobile/device readiness and sync context |
| `/api-docs` | Mobile/device API docs | Product-facing API contract reference |
| `/audit-log` | Audit log viewer | Scoped for regular users; broader activity for admin roles |
| `/security` | Security center | Account and mobile/API session security context |
| `/admin` | Admin command center | Admin-only route |
| `/ops` | Operations command center | Admin-only route |
| `/jobs` | Background job dashboard | Admin-only route |

## Public demo matrix

| Demo route | Shows |
|---|---|
| `/demo` | Showcase landing page, feature map, newest product surfaces, and recommended review path |
| `/demo/walkthrough` | Guided reviewer path across records, workflows, review hubs, reports, and operations |
| `/demo/dashboard` | Demo health command center |
| `/demo/health-profile` | Patient baseline and profile context |
| `/demo/medications` | Medication list, schedules, providers, and adherence |
| `/demo/labs` | Lab result sample data |
| `/demo/vitals` | Vital signs sample data |
| `/demo/symptoms` | Symptom journal sample data |
| `/demo/documents` | Protected document index sample data |
| `/demo/care-team` | Care member and invite sample data |
| `/demo/alerts` | Alert events and rule sample data |
| `/demo/reminders` | Reminder sample data |
| `/demo/review-queue` | Care review workload sample data |
| `/demo/summary` | Patient summary sample data |
| `/demo/exports` | Export capability preview |
| `/demo/device-connection` | Connected-device readiness preview |
| `/demo/api-docs` | Mobile/device API reference preview |
| `/demo/jobs` | Background job sample data |
| `/demo/ops` | Operational readiness sample data |
| `/demo/security` | Security posture and mobile session sample data |
| `/demo/audit-log` | Audit trail preview |
| `/demo/admin` | Admin/ops sample data |

## Current strongest signals

- Broad domain modeling using Prisma and PostgreSQL
- Authenticated app structure with protected workflows
- Care-team sharing and shared patient workspace foundations
- Care notes connected across timeline, reports, print packets, and exports
- Alerts, reminders, notifications, and care-plan workflows
- Clinical review pages that turn records into action signals
- Report builder presets and print-ready handoff packets
- Mobile and device API foundations with schema-backed validation
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
7. `/demo/exports`
8. `/demo/security`
9. `/demo/admin`
10. `docs/PORTFOLIO_REVIEW_GUIDE.md`

## Recommended next improvements

1. Persistent report-builder history stored in the database
2. Device provider connector abstraction for Apple Health, Android Health Connect, Fitbit, and smart devices
3. Mobile API SDK examples for JavaScript, React Native, and cURL
4. Data quality snapshots and cleanup trend history
5. Field-level care-team permissions
6. AI insights review and approval workflow
7. Worker heartbeat and queue health dashboard
8. Security hardening v3 with persistent abuse tracking
9. Playwright smoke tests for the public demo path
10. Final screenshot refresh after the next visual UI pass

## Recent portfolio polish additions

- **Patch 48: Data Quality Center** computes profile, record, safety, device, export, and collaboration cleanup signals from existing records without adding a new database table.
- **Patch 49: Mobile API Security Hardening** adds mobile API rate limits, no-store headers, payload-size protection, and mobile session audit events.
- **Patch 50: OpenAPI/Postman Export** adds machine-readable mobile API exports for reviewers and client-integration testing.
- **Patch 51: README Screenshot Restoration** fixes broken screenshot references and restores the original screenshot gallery for GitHub review.
