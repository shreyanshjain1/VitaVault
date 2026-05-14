# VitaVault Feature Map

This document maps VitaVault by product workflow instead of by implementation patch. Use it to understand what the platform currently does and where each capability fits in the health-record experience.

## Product mission

VitaVault is a personal health record platform focused on structured health data, provider handoff, care-team collaboration, mobile/device ingestion foundations, and production-minded operations surfaces.

## Core health record modules

| Module | Routes | Value |
|---|---|---|
| Dashboard | `/dashboard`, `/demo/dashboard` | Central health command center. |
| Health profile | `/health-profile`, `/demo/health-profile` | Baseline patient context and identity-level health details. |
| Medications | `/medications`, `/demo/medications` | Medication list, schedules, reminders, adherence context. |
| Appointments | `/appointments`, `/demo/appointments` | Visit history and upcoming appointments. |
| Doctors | `/doctors`, `/demo/doctors` | Provider directory and visit context. |
| Labs | `/labs`, `/demo/labs` | Lab result record management. |
| Vitals | `/vitals`, `/demo/vitals` | Vital-sign record management. |
| Symptoms | `/symptoms`, `/demo/symptoms` | Symptom tracking and review context. |
| Vaccinations | `/vaccinations`, `/demo/vaccinations` | Immunization record tracking. |
| Documents | `/documents`, `/demo/documents` | Medical file metadata, notes, download links, and review states. |

## Workflow and care coordination modules

| Module | Routes | Value |
|---|---|---|
| Notifications | `/notifications`, `/demo/notifications` | Unified inbox for alerts, reminders, visits, devices, and review items. |
| Reminders | `/reminders`, `/demo/reminders` | Follow-up and medication reminder workflows. |
| Alerts | `/alerts`, `/alerts/[id]`, `/alerts/rules`, `/demo/alerts` | Health alert review and triage workflow. |
| Care plan | `/care-plan`, `/demo/care-plan` | Action planning across records and next steps. |
| Visit prep | `/visit-prep`, `/demo/visit-prep` | Provider-ready appointment preparation and timeline context. |
| Review queue | `/review-queue`, `/demo/review-queue` | Aggregated review items across health workflows. |
| Timeline | `/timeline`, `/demo/timeline` | Longitudinal health activity and care-note context. |

## Clinical review modules

| Module | Routes | Value |
|---|---|---|
| Health trends | `/trends`, `/demo/trends` | Cross-record trend interpretation and summary metrics. |
| Medication safety | `/medication-safety`, `/demo/medication-safety` | Adherence, missed-dose, schedule, and medication review signals. |
| Lab review | `/lab-review`, `/demo/lab-review` | Lab trend interpretation and follow-up guidance. |
| Vitals monitor | `/vitals-monitor`, `/demo/vitals-monitor` | Vital freshness, missing-reading, and risk state detection. |
| Symptom review | `/symptom-review`, `/demo/symptom-review` | Recurring, worsening, stale, resolved, and stable symptom pattern review. |
| Data quality | `/data-quality`, `/demo/data-quality` | Data completeness, cleanup signals, and readiness scoring. |

## Collaboration modules

| Module | Routes | Value |
|---|---|---|
| Care team | `/care-team`, `/demo/care-team` | Invite-based sharing and permission management. |
| Care notes | `/care-notes`, `/demo/care-notes` | Collaboration notes tied into timeline, reports, and exports. |
| Shared patient workspace | `/patient/[ownerUserId]` | Caregiver/provider workspace for granted access. |

## Reports, exports, and handoff modules

| Module | Routes | Value |
|---|---|---|
| Patient summary | `/summary`, `/summary/print`, `/demo/summary` | Provider-ready patient context packet. |
| Report builder | `/report-builder`, `/report-builder/print`, `/demo/report-builder` | Preset-driven report packets and saved report history. |
| Export center | `/exports`, `/exports/[type]`, `/demo/exports` | Portable export packets and CSV-style downloads. |
| Emergency card | `/emergency-card`, `/emergency-card/print`, `/demo/emergency-card` | Emergency profile and critical health context. |

## AI and intelligence modules

| Module | Routes | Value |
|---|---|---|
| AI insights | `/ai-insights`, `/demo/ai-insights` | Source-aware AI insight review, trust checklist, and fallback states. |
| Document intelligence | `/documents`, `/demo/documents` | Document classification, review readiness, linked-record guidance. |
| Data quality center | `/data-quality`, `/demo/data-quality` | Completeness and cleanup recommendations across records. |

## Mobile and device modules

| Module | Routes/APIs | Value |
|---|---|---|
| Device connection hub | `/device-connection`, `/device-connection/[id]`, `/demo/device-connection` | Device connection status, sync health, provider readiness. |
| Device sync simulator | `/device-sync-simulator`, `/demo/device-sync-simulator` | QA/demo path for device ingestion. |
| Mobile API docs | `/api-docs`, `/demo/api-docs` | Mobile API guide, OpenAPI/Postman links, and SDK examples. |
| Mobile APIs | `/api/mobile/*` | Login, session, connections, device readings, OpenAPI, Postman. |

## Admin, operations, and platform modules

| Module | Routes/APIs | Value |
|---|---|---|
| Admin command center | `/admin`, `/demo/admin` | Admin account and operational visibility. |
| Ops command center | `/ops`, `/demo/ops` | Operational status and platform health context. |
| Jobs dashboard | `/jobs`, `/demo/jobs` | Background job visibility and job run management. |
| Security center | `/security`, `/demo/security` | Account/session/mobile security review. |
| Audit log | `/audit-log`, `/demo/audit-log` | Activity review and high-risk event detection. |
| Deployment readiness | `/api/health` | Health and readiness information for deployed environments. |

## Public demo experience

The `/demo` route family exists so reviewers can inspect product depth without account setup. It should stay consistent with the authenticated app experience and should not depend on private secrets.

Recommended public demo path:

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

## Current strongest portfolio signals

- Broad health-record coverage across core health data types.
- Workflow layers that turn records into actions, review queues, and provider handoff packets.
- Care-team sharing and collaboration foundations.
- Mobile/device API and connector architecture beyond a basic CRUD app.
- Admin, jobs, ops, audit, deployment, and security surfaces.
- Public no-login demo experience.
- Strong helper-level tests across regression-prone product logic.
