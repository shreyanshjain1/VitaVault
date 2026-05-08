# VitaVault

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Auth.js](https://img.shields.io/badge/Auth.js-5-black?style=for-the-badge)
![BullMQ](https://img.shields.io/badge/BullMQ-Redis-red?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-Tested-6e9f18?style=for-the-badge&logo=vitest)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**VitaVault** is a full-stack personal health record and care-coordination platform built as a product-style healthcare workspace, not a simple CRUD demo.

It combines structured health records, care-team collaboration, alert and reminder workflows, report packets, exports, AI-assisted summaries, mobile/device ingestion foundations, security controls, admin tooling, and a public demo surface inside one Next.js application.

---

## Live links

- **GitHub:** [shreyanshjain1/VitaVault](https://github.com/shreyanshjain1/VitaVault)
- **Vercel demo:** [vita-vault-s6up.vercel.app](https://vita-vault-s6up.vercel.app/)
- **Public walkthrough:** `/demo/walkthrough`
- **Feature matrix:** [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md)
- **Portfolio review guide:** [`docs/PORTFOLIO_REVIEW_GUIDE.md`](docs/PORTFOLIO_REVIEW_GUIDE.md)
- **Known limitations:** [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)

The public demo routes are designed for fast review without requiring a production database login.

---

## What VitaVault demonstrates

VitaVault is designed to showcase production-minded full-stack engineering across product workflows, data modeling, access control, device ingestion, reporting, and operations.

The app demonstrates:

- longitudinal records for profile, medications, appointments, doctors, labs, vitals, symptoms, vaccinations, and documents
- care-team access, shared patient workspace foundations, and care notes
- notifications, care plans, visit prep, alerts, reminders, and review queues
- clinical review hubs for trends, medication safety, lab follow-up, vitals monitoring, and symptom review
- report builder presets, saved report history, print views, emergency cards, exports, and handoff packets
- AI insight persistence and source-aware summary foundations
- mobile authentication, bearer-token sessions, device connections, provider connector contracts, and reading ingestion
- admin, jobs, ops, audit log, security center, deployment checks, and route-policy enforcement
- no-login demo routes for recruiter and reviewer walkthroughs

---

## Product pillars

### Personal Health Record Workspace

Users can manage profile details, medications, schedules, adherence logs, appointments, providers, lab results, vitals, symptoms, vaccinations, protected documents, reminders, emergency information, summaries, and exports.

### Shared Care Foundations

VitaVault supports care-team invites, scoped access, shared patient routes, caregiver workspace foundations, audit-aware access, and care notes that connect into timeline, report, print, and export workflows.

### Alerts, Notifications, and Care Workflows

The platform includes threshold-based alert rules, alert events, notification center, care plan, visit prep, review queues, reminder workflows, and worker-backed evaluation foundations.

### Reports, Exports, and Handoff Packets

The app includes patient summaries, emergency cards, export readiness checks, report builder presets, saved report history, print packets, and pre-share checks for doctor visits and care-team reviews.

### Device and Mobile Readiness

The mobile/device layer includes credential login, bearer-token sessions, revocation, device connection tracking, device reading ingestion, sync jobs, OpenAPI/Postman exports, provider connector contracts, and a simulator for review.

### Security, Admin, and Operations

The platform includes Auth.js authentication, protected workflows, route policy, password rotation, email verification, password reset flows, protected documents, audit log, security center, admin account lifecycle tools, job operations, and deployment readiness scripts.

---

## Current application surface

### Authenticated product routes

| Area | Routes |
|---|---|
| Core | `/dashboard`, `/onboarding`, `/health-profile`, `/timeline`, `/data-quality` |
| Care workflow | `/notifications`, `/care-plan`, `/visit-prep`, `/emergency-card`, `/emergency-card/print` |
| Records | `/medications`, `/appointments`, `/doctors`, `/labs`, `/vitals`, `/symptoms`, `/vaccinations`, `/documents` |
| Review hubs | `/medication-safety`, `/lab-review`, `/vitals-monitor`, `/symptom-review`, `/trends` |
| Collaboration | `/care-team`, `/care-notes`, `/patient/[ownerUserId]`, `/invite/[token]` |
| Alerts & reminders | `/alerts`, `/alerts/[id]`, `/alerts/rules`, `/reminders`, `/review-queue`, `/review-queue/print` |
| Intelligence & reports | `/ai-insights`, `/summary`, `/summary/print`, `/exports`, `/report-builder`, `/report-builder/print` |
| Device/mobile | `/device-connection`, `/device-connection/[id]`, `/device-sync-simulator`, `/api-docs` |
| Security/account | `/audit-log`, `/security`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` |
| Admin/ops | `/admin`, `/ops`, `/jobs` |

### Public demo routes

| Demo area | Routes |
|---|---|
| Demo shell | `/demo`, `/demo/walkthrough`, `/demo/dashboard` |
| Demo records | `/demo/health-profile`, `/demo/medications`, `/demo/appointments`, `/demo/doctors`, `/demo/labs`, `/demo/vitals`, `/demo/symptoms`, `/demo/vaccinations`, `/demo/documents` |
| Demo workflows | `/demo/care-team`, `/demo/ai-insights`, `/demo/alerts`, `/demo/timeline`, `/demo/reminders`, `/demo/review-queue`, `/demo/summary`, `/demo/exports`, `/demo/data-quality` |
| Demo review hubs | `/demo/notifications`, `/demo/care-plan`, `/demo/visit-prep`, `/demo/trends`, `/demo/medication-safety`, `/demo/lab-review`, `/demo/vitals-monitor`, `/demo/symptom-review`, `/demo/emergency-card` |
| Demo platform | `/demo/device-connection`, `/demo/api-docs`, `/demo/security`, `/demo/audit-log`, `/demo/jobs`, `/demo/ops`, `/demo/admin` |

---

## Feature matrix snapshot

| Product layer | Representative modules | What it shows |
|---|---|---|
| Patient record system | Profile, meds, appointments, doctors, labs, vitals, symptoms, vaccines, documents | Broad structured health data coverage |
| Care workflow layer | Notifications, care plan, visit prep, review queue, reminders, alerts | Next-action thinking beyond CRUD |
| Clinical review layer | Trends, medication safety, lab review, vitals monitor, symptom review | Data interpretation and follow-up readiness |
| Collaboration layer | Care team, care notes, shared patient workspace, invites | Patient-controlled care access and collaboration |
| Reporting layer | Summary, report builder, saved report history, emergency card, exports, print packets | Doctor handoff and portable records |
| Device/mobile layer | Mobile auth APIs, sessions, connections, readings, provider adapters, API docs | Connected-health ingestion foundations |
| Platform layer | Security, audit log, admin, ops, jobs, deployment checks | Production-minded backend and operations |
| Demo layer | `/demo` and `/demo/walkthrough` | Recruiter-friendly product review without login |

See [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md) for the full feature map.

---

## Architecture snapshot

| Layer | Implementation |
|---|---|
| App framework | Next.js 15 App Router |
| UI | React 19, TypeScript, Tailwind CSS, reusable component layer |
| Auth | Auth.js / NextAuth credentials flow |
| Data | Prisma ORM with PostgreSQL |
| Validation | Zod schemas and server-side validation helpers |
| Background jobs | Redis + BullMQ worker foundation |
| AI | OpenAI client integration foundation |
| Charts/UI utilities | Recharts, lucide-react, Framer Motion |
| Testing | Vitest with targeted route and business-logic coverage |
| Repo health | action export checks, import checks, hygiene checks, Prisma validation, environment validation |

---

## Domain model coverage

The Prisma schema models a broad health-product domain, including users, auth state, profiles, doctors, appointments, medications, labs, vitals, symptoms, vaccinations, documents, care access, care notes, reminders, exports, saved reports, AI insights, mobile sessions, device connections, device readings, sync jobs, alert rules, alert events, alert audits, job runs, and job logs.

---

## Screenshots

The original screenshot set is stored in [`.mkdir/`](.mkdir/) so reviewers can preview the product quickly from GitHub.

### Reviewer entry points

| Landing Page | Login Page |
|---|---|
| <img src=".mkdir/Landing-Page.jpg" alt="VitaVault landing page" width="100%"> | <img src=".mkdir/Login-Page.jpg" alt="VitaVault login page" width="100%"> |

### Core patient workspace

| Dashboard | Health Profile |
|---|---|
| <img src=".mkdir/Dashboard.jpg" alt="VitaVault dashboard" width="100%"> | <img src=".mkdir/Health-Profile.jpg" alt="Health profile workspace" width="100%"> |

| Medications | Appointments |
|---|---|
| <img src=".mkdir/Medications.jpg" alt="Medication management" width="100%"> | <img src=".mkdir/Appointments.jpg" alt="Appointment management" width="100%"> |

| Doctors | Documents |
|---|---|
| <img src=".mkdir/Doctors.jpg" alt="Doctor directory" width="100%"> | <img src=".mkdir/Documents.jpg" alt="Document workspace" width="100%"> |

### Clinical review and record coverage

| Lab Results | Vitals |
|---|---|
| <img src=".mkdir/Lab-Results.jpg" alt="Lab results review" width="100%"> | <img src=".mkdir/Vitals.jpg" alt="Vitals monitoring" width="100%"> |

| Symptoms | Vaccinations |
|---|---|
| <img src=".mkdir/Symptoms.jpg" alt="Symptom tracking" width="100%"> | <img src=".mkdir/Vaccinations.jpg" alt="Vaccination records" width="100%"> |

### Collaboration, intelligence, devices, and handoff

| Care Team | AI Insights |
|---|---|
| <img src=".mkdir/Care-Team.jpg" alt="Care team workspace" width="100%"> | <img src=".mkdir/AI-Insights.jpg" alt="AI insights workspace" width="100%"> |

| Alert Center | Summary |
|---|---|
| <img src=".mkdir/Alert-Center.jpg" alt="Alert center" width="100%"> | <img src=".mkdir/Summary.jpg" alt="Patient summary" width="100%"> |

| Device Connections | Exports Page |
|---|---|
| <img src=".mkdir/Device-Connections.jpg" alt="Device connection dashboard" width="100%"> | <img src=".mkdir/Exports-Page.jpg" alt="Export center" width="100%"> |

---

## Repo health commands

```bash
npm install
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```

---

## Local setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed:demo
npm run dev
```

Common local environment values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vitavault"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

Optional values depend on the feature being tested:

```env
REDIS_URL="redis://127.0.0.1:6379"
OPENAI_API_KEY=""
EMAIL_FROM=""
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
```

---

## Deployment notes

VitaVault is Vercel-ready, but production-like flows depend on environment configuration.

Required for full production behavior:

- PostgreSQL database connection
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- production email settings for invite, reset, and verification flows
- Redis URL for worker-backed queues
- OpenAI key for live AI features
- storage provider configuration for production document storage

The public demo routes are read-only so the project can still be reviewed even when production database features are not configured.

---

## Testing strategy

The test suite focuses on business logic and regression-prone workflow areas:

- internal API authorization
- export center readiness
- document storage and protected download behavior
- outbound and invite email behavior
- notification helper logic
- deployment readiness checks
- route policy expectations
- mobile/device API validation and security helpers
- OpenAPI/Postman contract generation
- migration safety checks
- report builder presets and saved report history
- care-note workflow helpers
- device integration helper logic

---

## Current limitations

VitaVault is a strong portfolio and product foundation, but it is not a regulated medical device or production clinical system.

Known limitations include:

- demo routes are read-only and use sample data
- care notes are patient-level and not yet attached to every individual record type
- sleep tracking is not currently in the Prisma device reading enum
- provider connector contracts exist, but native Apple Health, Android Health Connect, and wearable apps are external client work
- production document storage needs provider-specific hardening before real PHI usage
- background jobs require Redis and worker deployment configuration
- AI features require production-grade source review, prompt logging, and medical disclaimer controls before real clinical use

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for details.

---

## Portfolio review path

For a fast review, use this path:

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

For deeper review, inspect:

- `prisma/schema.prisma`
- `lib/report-builder.ts`
- `lib/report-history.ts`
- `lib/care-note-workflows.ts`
- `lib/mobile-device-api.ts`
- `lib/device-provider-connectors.ts`
- `lib/route-policy.ts`
- `tests/`
- `docs/`

---

## License

MIT License. See [`LICENSE`](LICENSE).
