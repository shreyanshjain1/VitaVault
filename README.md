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

It combines structured health records, care-team collaboration, reminder and alert workflows, AI-assisted summaries, exports, report packets, security controls, admin/ops tooling, mobile/device API foundations, and a no-login public demo surface inside one Next.js application.

The project is designed to show production-minded full-stack engineering: domain modeling, protected workflows, route policy, audit-aware actions, report generation, device ingestion contracts, operational pages, test coverage, and clear portfolio storytelling.

---

## Live links

- **GitHub:** [shreyanshjain1/VitaVault](https://github.com/shreyanshjain1/VitaVault)
- **Vercel demo:** [vita-vault-s6up.vercel.app](https://vita-vault-s6up.vercel.app/)
- **Public walkthrough:** `/demo/walkthrough`
- **Feature matrix:** [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md)
- **Portfolio review guide:** [`docs/PORTFOLIO_REVIEW_GUIDE.md`](docs/PORTFOLIO_REVIEW_GUIDE.md)
- **Known limitations:** [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)

> The deployed public demo is the best way to review the product online because database-backed live flows depend on production environment configuration.

---

## What VitaVault demonstrates

Most health-record portfolio apps stop at forms and dashboards. VitaVault goes further by modeling the workflow and operating surface around a personal health record platform.

The app demonstrates:

- longitudinal patient records across health profile, medications, appointments, doctors, labs, vitals, symptoms, vaccinations, and documents
- patient-controlled care-team access and shared workspace foundations
- notification center, care plan, visit prep, alerts, reminders, and review queues
- clinical review hubs for trends, medication safety, labs, vitals, and symptoms
- report builder presets, print views, emergency cards, exports, and patient handoff packets
- care notes connected into timeline, report, print, and export workflows
- AI insight persistence and source-aware summary foundations
- mobile authentication, bearer-token sessions, device connections, and device reading ingestion
- admin, jobs, ops, audit log, security center, and deployment-readiness surfaces
- no-login demo routes for recruiters and reviewers

This repo sits at the intersection of **product engineering**, **health-data workflows**, and **production-minded full-stack architecture**.

---

## Product pillars

### 1. Personal Health Record Workspace

Users can manage:

- health profile and baseline context
- medications, schedules, adherence logs, and medication safety review
- appointments, visit preparation, and provider relationships
- lab results with follow-up and trend context
- vital readings with monitoring and watch-zone signals
- symptom tracking with severity and unresolved-review context
- vaccinations and preventive-care history
- protected document records and document-readiness signals
- reminders, summaries, exports, emergency cards, and print-oriented views

### 2. Shared Care Foundations

VitaVault includes collaboration-oriented flows such as:

- care-team invite creation and acceptance
- scoped shared patient access
- shared patient routes
- access-aware patient views
- invite email support and fallback link sharing
- caregiver workspace and care access audit foundations
- care notes that appear across timeline, reports, print packets, and export readiness

### 3. Alerts, Notifications, and Care Workflows

The platform includes workflow primitives beyond record storage:

- threshold-based alert rules
- alert events and lifecycle states
- notification center across alerts, reminders, appointments, labs, documents, invites, and devices
- care plan hub with readiness scoring and prioritized next actions
- visit prep hub for provider appointments and doctor-packet handoff context
- review queue pages and print-oriented review flows
- worker-backed scan and evaluation foundations

### 4. Reports, Exports, and Handoff Packets

VitaVault includes several surfaces that make health data portable and useful:

- patient summary dashboard
- printable patient summary
- emergency health card
- export center readiness checks
- report builder presets for doctor visits, medication reviews, lab follow-ups, weekly care-team reviews, and emergency handoffs
- generated recent packet history for demo/review context
- pre-share checks that flag missing or urgent data before handoff

### 5. Device and Mobile Readiness

The app is structured for connected-data expansion:

- mobile login, logout, and authenticated user endpoints
- bearer-token foundations for mobile sync flows
- mobile session visibility and revocation foundations
- device connection tracking
- device reading ingestion
- sync job lifecycle tracking
- schema-backed mobile API documentation
- device sync simulator for portfolio review

### 6. Security, Admin, and Operations

The application includes operational controls such as:

- Auth.js / NextAuth authentication
- protected user workflows
- route-policy helper for admin-only surfaces
- password rotation, email verification, and password reset flows
- protected document delivery
- audit log viewer and security center
- admin account lifecycle tools
- jobs, ops, and system readiness pages
- deployment and environment validation scripts

---

## Current application surface

### Authenticated product routes

| Area | Routes |
|---|---|
| Core | `/dashboard`, `/onboarding`, `/health-profile`, `/timeline` |
| Care workflow | `/notifications`, `/care-plan`, `/visit-prep`, `/emergency-card`, `/emergency-card/print` |
| Records | `/medications`, `/appointments`, `/doctors`, `/labs`, `/vitals`, `/symptoms`, `/vaccinations`, `/documents` |
| Review hubs | `/medication-safety`, `/lab-review`, `/vitals-monitor`, `/symptom-review`, `/trends` |
| Collaboration | `/care-team`, `/care-notes`, `/patient/[ownerUserId]`, `/invite/[token]` |
| Alerts & reminders | `/alerts`, `/alerts/[id]`, `/alerts/rules`, `/reminders`, `/review-queue`, `/review-queue/print` |
| Intelligence & reports | `/ai-insights`, `/summary`, `/summary/print`, `/exports`, `/report-builder`, `/report-builder/print` |
| Device/mobile | `/device-connection`, `/api-docs` |
| Security/account | `/audit-log`, `/security`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` |
| Admin/ops | `/admin`, `/ops`, `/jobs` |

### Public demo routes

The app includes a no-login demo surface for portfolio review.

| Demo area | Routes |
|---|---|
| Demo shell | `/demo`, `/demo/walkthrough`, `/demo/dashboard` |
| Demo records | `/demo/health-profile`, `/demo/medications`, `/demo/appointments`, `/demo/doctors`, `/demo/labs`, `/demo/vitals`, `/demo/symptoms`, `/demo/vaccinations`, `/demo/documents` |
| Demo workflows | `/demo/care-team`, `/demo/ai-insights`, `/demo/alerts`, `/demo/timeline`, `/demo/reminders`, `/demo/review-queue`, `/demo/summary`, `/demo/exports` |
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
| Reporting layer | Summary, report builder, emergency card, exports, print packets | Doctor handoff and portable records |
| Device/mobile layer | Mobile auth APIs, sessions, connections, readings, API docs | Connected-device ingestion foundations |
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
| Testing | Vitest with targeted route/business-logic coverage |
| Repo health | action export checks, import checks, hygiene checks, Prisma validation, environment validation |

---

## Domain model coverage

The Prisma schema models a broad health-product domain, including:

- users, auth state, verification, password resets, and health profiles
- doctors and appointments
- medications, schedules, and adherence logs
- labs, vitals, symptoms, and vaccinations
- documents and protected file access
- care invites, care access, and care notes
- reminders and exports
- AI insights
- mobile sessions
- device connections and device readings
- sync jobs
- alert rules, alert events, and alert audits
- job runs and job run logs

This gives the project enough depth to support future upgrades without constantly redesigning the database from scratch.

---

## Screenshots

### Core experience

| Dashboard | Health Profile |
|---|---|
| <img src=".mkdir/Dashboard.jpg" alt="Dashboard" width="100%"> | <img src=".mkdir/Health-Profile.jpg" alt="Health Profile" width="100%"> |

| Medications | Documents |
|---|---|
| <img src=".mkdir/Medications.jpg" alt="Medications" width="100%"> | <img src=".mkdir/Documents.jpg" alt="Documents" width="100%"> |

| Lab Review | Vitals Monitor |
|---|---|
| <img src=".mkdir/Lab-Review.jpg" alt="Lab Review" width="100%"> | <img src=".mkdir/Vitals-Monitor.jpg" alt="Vitals Monitor" width="100%"> |

> Screenshot filenames may be updated as the public demo is refreshed. The app routes and docs are the source of truth for current functionality.

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

For deployment readiness:

```bash
npm run env:check
npm run deploy:check
```

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the required values.

Common local values:

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

### 3. Validate Prisma schema

```bash
npm run db:validate:ci
```

### 4. Apply migrations locally

```bash
npx prisma migrate dev
```

For local demo databases only, reset is acceptable if you do not need the data:

```bash
npx prisma migrate reset
```

Do not use reset against real or production data.

### 5. Seed demo data

```bash
npm run seed:demo
```

### 6. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Deployment notes

VitaVault is Vercel-ready, but production-like flows depend on environment configuration.

Required for full production behavior:

- PostgreSQL database connection
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- production email settings for invite/reset/verification flows
- Redis URL for worker-backed queues
- OpenAI key for live AI features
- storage provider configuration for production document storage

The public demo routes are intentionally no-login and read-only so the app can still be reviewed even when production database configuration is not enabled.

---

## Testing strategy

The test suite focuses on business logic and risk-prone workflow areas:

- internal API authorization
- export center readiness
- document storage and protected download behavior
- outbound/invite email behavior
- notification center helper logic
- deployment readiness checks
- route policy expectations
- mobile/device API validation
- migration safety checks
- report builder presets
- care-note workflow helpers
- security hardening helpers

The goal is not full end-to-end coverage yet. It is targeted coverage for areas most likely to regress during portfolio patching.

---

## Current limitations

VitaVault is a strong portfolio/product foundation, but it is not a regulated medical device or production clinical system.

Known limitations include:

- demo routes are read-only and use sample data
- persistent report history is not yet database-backed
- care notes are patient-level and not yet attached to specific records
- sleep tracking is documented as a future feature and is not currently in the Prisma reading enum
- production document storage needs provider-specific hardening before real PHI usage
- background jobs require Redis and worker deployment configuration
- AI features require production-grade source review, prompt logging, and clinician/user disclaimers before real use

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
7. `/demo/report-builder` if added to the public shell, or `/report-builder` in the authenticated app
8. `/demo/exports`
9. `/demo/security`
10. `/demo/admin`

For deeper review, inspect:

- `prisma/schema.prisma`
- `lib/report-builder.ts`
- `lib/report-builder-presets.ts`
- `lib/care-note-workflows.ts`
- `lib/mobile-device-api.ts`
- `lib/route-policy.ts`
- `tests/`
- `docs/`

---

## License

MIT License. See [`LICENSE`](LICENSE).
