# VitaVault Feature Matrix

This matrix summarizes the current VitaVault product surface after the Patch 1-20 upgrade series. It is meant for reviewers, recruiters, and maintainers who want a fast view of what the app demonstrates.

## Product layers

| Layer | Modules | Main value |
|---|---|---|
| Core workspace | Dashboard, onboarding, health profile, timeline | Gives users a central command center and a structured first-run setup flow |
| Patient records | Medications, appointments, doctors, labs, vitals, symptoms, vaccinations, documents | Covers the major personal health record modules expected in a serious PHR platform |
| Care workflow | Notifications, care plan, visit prep, reminders, review queue, alerts | Turns raw health records into next-action workflows |
| Clinical review | Health trends, medication safety, lab review, vitals monitor, symptom review | Adds interpretation, readiness scoring, and follow-up prioritization on top of records |
| Collaboration | Care team, shared patient workspace, invites | Supports patient-controlled sharing and caregiver/provider visibility |
| Reports and handoff | Summary, summary print, emergency card, exports | Supports doctor visits, emergency situations, and portable record handoffs |
| Mobile/device | Mobile auth APIs, device connections, device readings, API docs | Shows backend readiness for mobile and connected-device ingestion |
| Security/admin/ops | Security center, audit log, admin, ops, jobs | Shows production-minded operating surfaces beyond normal CRUD |
| Public demo | `/demo`, `/demo/walkthrough`, demo module pages | Lets reviewers inspect the product surface without needing login or a configured database |

## Authenticated route matrix

| Route | Purpose | Notes |
|---|---|---|
| `/dashboard` | Health command center | Aggregates profile, alerts, reminders, activity, and readiness context |
| `/onboarding` | First-time health setup | Saves profile context using existing health profile structure |
| `/notifications` | Unified notification inbox | Combines alerts, reminders, appointments, labs, documents, invites, and devices |
| `/care-plan` | Care plan hub | Readiness score, prioritized actions, upcoming care timeline, and care context |
| `/visit-prep` | Doctor visit preparation | Provider-ready prep task queue and doctor packet handoff context |
| `/emergency-card` | Emergency health card | Printable emergency profile and critical health context |
| `/trends` | Health trends analytics | Trend coverage, risk scoring, vitals/labs/symptoms/adherence signals |
| `/medication-safety` | Medication safety hub | Dose board, adherence, safety actions, reminders, and medication alerts |
| `/lab-review` | Lab review hub | Lab flags, trend cards, document coverage, and follow-up reminders |
| `/vitals-monitor` | Vitals monitor | Vital-sign status, deltas, watch zones, averages, timeline, and device signals |
| `/symptom-review` | Symptom review hub | Severity breakdown, unresolved symptoms, clusters, filters, and handoff signals |
| `/documents` | Document intelligence hub | Document readiness, linking coverage, filters, notes, and suggested next steps |
| `/summary` | Patient summary | Handoff dashboard for patient context and report generation |
| `/summary/print` | Printable packet | Standard, compact, and doctor-visit packet modes |
| `/care-team` | Care-team management | Invites, access control, and shared-care foundations |
| `/patient/[ownerUserId]` | Shared patient workspace | Caregiver/provider view for granted access |
| `/audit-log` | Audit log viewer | Unified access, alert, reminder, job, and session activity view |
| `/security` | Security center | Account and mobile/API session security context |
| `/admin` | Admin command center | Users, verification, care access, jobs, invites, and audit activity |
| `/ops` | Operations command center | Environment readiness, workload risks, jobs, sync, alerts, and reminders |
| `/api-docs` | Mobile/device API docs | Public reference for mobile auth, sessions, device connections, and readings |

## Public demo matrix

| Demo route | Shows |
|---|---|
| `/demo` | Showcase landing page, feature matrix, newest product hubs, and recommended review path |
| `/demo/walkthrough` | Guided reviewer path across records, workflows, review hubs, and operations |
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
| `/demo/jobs` | Background job sample data |
| `/demo/ops` | Operational readiness sample data |
| `/demo/security` | Security posture and mobile session sample data |
| `/demo/admin` | Admin/ops sample data |

## Current strongest signals

- Broad domain modeling using Prisma and PostgreSQL
- Authenticated app structure with protected workflows
- Care-team sharing and shared patient workspace foundations
- Alerts, reminders, notifications, and care-plan workflows
- Clinical review pages that turn records into action signals
- Print/report surfaces for patient summary and emergency handoff
- Mobile and device API foundations
- Admin, ops, audit, jobs, and security surfaces
- No-login demo routes for reviewers

## Recommended next improvements

1. Sidebar grouping and navigation UX cleanup
2. AI Insights v2 with source-linked summaries
3. Export Center v2 with polished report packets
4. Device sync simulator / health-data import demo
5. Production document storage abstraction
6. Expanded tests for the new review hubs
