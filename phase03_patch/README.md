# VitaVault

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Auth.js](https://img.shields.io/badge/Auth.js-5-black?style=for-the-badge)
![BullMQ](https://img.shields.io/badge/BullMQ-Redis-red?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A full-stack personal health record platform for structured health tracking, shared care access, AI summaries, alert workflows, and mobile/device ingestion foundations.

---

## Overview

VitaVault is a Next.js healthcare workspace that brings personal record management, collaboration controls, and operational backend infrastructure into one authenticated app.

It is built around a few core ideas:

- keep personal health records organized in one place
- support collaboration through care-team invites and scoped access
- turn passive record storage into actionable workflows with alerts and background jobs
- prepare the data model for device sync and mobile ingestion

Users can manage:

- health profile and baseline medical context
- medications, schedules, and adherence logs
- appointments, doctors, labs, vitals, symptoms, vaccinations, and documents
- AI-generated health insights
- care-team invites and shared access
- alert events and monitoring rules
- device connections, sync jobs, and reading ingestion foundations

---

## Architecture Snapshot

### Frontend
- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui-style component stack
- lucide-react icons
- Recharts for charting
- Framer Motion included in the dependency stack

### Backend
- Server Components and Server Actions
- Auth.js / NextAuth authentication
- Prisma ORM
- PostgreSQL
- Zod validation
- protected route and ownership checks
- export routes and internal API routes

### Jobs & Workers
- BullMQ queues
- Redis-backed worker connection
- dedicated worker runtime
- job dispatch endpoints
- persisted job runs and job logs
- alert scanning support

### Data Layer
The current domain model covers:

- `User`
- `HealthProfile`
- `Medication`
- `MedicationSchedule`
- `MedicationLog`
- `Appointment`
- `Doctor`
- `LabResult`
- `VitalRecord`
- `SymptomEntry`
- `VaccinationRecord`
- `MedicalDocument`
- `Reminder`
- `CareAccess`
- `CareInvite`
- `AccessAuditLog`
- `AiInsight`
- `DeviceConnection`
- `DeviceReading`
- `MobileSessionToken`
- `SyncJob`
- `JobRun`
- `JobRunLog`
- `AlertRule`
- `AlertEvent`
- `AlertAuditLog`

---

## Key Product Areas

### 1. Health Record Management
- Health profile with allergies, chronic conditions, blood type, height, weight, and emergency contact details
- Medication plans with schedules and adherence logging
- Appointment tracking with follow-up context
- Doctor and clinic directory
- Lab result logging
- Vitals history
- Symptom journal
- Vaccination records
- Medical document storage
- Summary and export flows

### 2. Care Collaboration
- Care-team invite flow
- permission-based shared access
- patient sharing foundation
- access audit trail support
- shared-care visibility considerations for alerts

### 3. Alerting & Monitoring
- threshold-based alert engine foundation
- alert categories for vitals, medication adherence, symptom severity, and sync health
- severity levels and lifecycle states
- source-linked alert events
- alert audit trail
- worker-backed evaluation and scheduled scans

### 4. Mobile & Device Readiness
- device connection tracking
- sync job tracking
- reading ingestion foundation
- mirrored supported readings into `VitalRecord`
- mobile token authentication foundation
- reading source modeling for manual and connected inputs

### 5. AI & Summaries
- AI-generated health summaries
- stored insight records
- follow-up and summary-oriented workflow positioning

---

## Engineering Features

### Authentication & Access Control
- credential-based authentication
- protected app routes
- secure password hashing
- ownership enforcement on user-scoped data
- shared-access permission checks
- mobile bearer-token foundation for sync flows

### Validation & Data Safety
- Zod-backed server validation
- route-level ownership checks
- cross-user access prevention
- audit logging for access and alerts
- file/document handling foundation

### Alert Engine
- alert rules with configurable conditions
- cooldown-based duplicate suppression
- status transitions: open, acknowledged, resolved, dismissed
- source references back to triggering records
- alert event audit logging
- care-team visibility controls

### Queue / Worker System
- BullMQ-based queue layer
- Redis-backed queue connection
- dedicated worker entrypoint
- job metadata persistence
- job logs for operational visibility
- queue dashboard support

### Device / Sync Pipeline
- device connection records
- sync job lifecycle tracking
- ingestion support for:
  - heart rate
  - blood pressure
  - blood glucose
  - oxygen saturation
  - temperature
  - weight
- normalized mirroring into `VitalRecord`

---

## Feature Set

### Authentication
- sign up
- login
- logout
- protected routes
- demo seed support
- secure password hashing
- mobile auth foundation

### Dashboard
- command-center style layout
- profile completion visibility
- alert visibility
- reminders panel
- next medication summary
- vitals summary
- appointment summary
- quick navigation workspace

### Health Records
- health profile management
- medication schedules
- adherence logging with Taken / Missed / Skipped
- duplicate same-day medication logging protection
- appointments
- labs
- vitals
- symptoms
- vaccinations
- documents
- doctors
- summary page
- export routes

### Collaboration & AI
- AI insight generation
- care-team invite creation and acceptance
- shared workspace foundation
- permission-aware collaboration
- audit logging for access and alerts

### Jobs & Infrastructure
- jobs dashboard
- internal dispatch routes
- worker runtime
- job persistence and logs
- alert scan script

### Mobile & Device Readiness
- device connection page
- sync job support
- reading ingestion foundation
- mirrored readings into vitals
- Android-oriented backend readiness

---

### Core Experience

| Dashboard | Health Profile |
|---|---|
| <img src=".mkdir/Dashboard.jpg" alt="Dashboard" width="100%"> | <img src=".mkdir/Health-Profile.jpg" alt="Health Profile" width="100%"> |

| Medications | Appointments |
|---|---|
| <img src=".mkdir/Medications.jpg" alt="Medications" width="100%"> | <img src=".mkdir/Appointments.jpg" alt="Appointments" width="100%"> |

| Labs | Exports |
|---|---|
| <img src=".mkdir/Lab-Results.jpg" alt="Lab Results" width="100%"> | <img src=".mkdir/Exports-Page.jpg" alt="Exports Page" width="100%"> |

### Collaboration & Intelligence

| AI Insights | Care Team |
|---|---|
| <img src=".mkdir/AI-Insights.jpg" alt="AI Insights" width="100%"> | <img src=".mkdir/Care-Team.jpg" alt="Care Team" width="100%"> |

| Alert Center | Device Connections |
|---|---|
| <img src=".mkdir/Alert-Center.jpg" alt="Alert Center" width="100%"> | <img src=".mkdir/Device-Connections.jpg" alt="Device Connections" width="100%"> |

### Clinical Records

| Vaccinations | Doctors |
|---|---|
| <img src=".mkdir/Vaccinations.jpg" alt="Vaccinations" width="100%"> | <img src=".mkdir/Doctors.jpg" alt="Doctors" width="100%"> |

| Summary | Vitals |
|---|---|
| <img src=".mkdir/Summary.jpg" alt="Summary" width="100%"> | <img src=".mkdir/Vitals.jpg" alt="Vitals" width="100%"> |

| Symptoms | Documents |
|---|---|
| <img src=".mkdir/Symptoms.jpg" alt="Symptoms" width="100%"> | <img src=".mkdir/Documents.jpg" alt="Documents" width="100%"> |

### Entry Screens

| Landing Page | Login Page |
|---|---|
| <img src=".mkdir/Landing-Page.jpg" alt="Landing Page" width="100%"> | <img src=".mkdir/Login-Page.jpg" alt="Login Page" width="100%"> |

---

## Tech Stack

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM**
- **PostgreSQL**
- **Auth.js / NextAuth**
- **Zod**
- **BullMQ**
- **Redis**
- **Recharts**
- **lucide-react**
- **Framer Motion**

---

## Repository Structure

```text
personal-health-record-companion/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── pull_request_template.md
├── app/
│   ├── (auth)/
│   ├── ai-insights/
│   ├── alerts/
│   ├── api/
│   │   ├── internal/
│   │   └── mobile/
│   ├── appointments/
│   ├── care-team/
│   ├── dashboard/
│   ├── device-connections/
│   ├── doctors/
│   ├── documents/
│   ├── exports/
│   ├── health-profile/
│   ├── invite/
│   ├── jobs/
│   ├── labs/
│   ├── medications/
│   ├── signup/
│   ├── summary/
│   ├── symptoms/
│   ├── vaccinations/
│   ├── vitals/
│   ├── actions.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── alerts/
│   └── ...
├── lib/
│   ├── alerts/
│   ├── jobs/
│   └── ...
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
├── worker/
│   └── processors/
├── public/uploads/
├── types/
├── .env.example
├── middleware.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Main Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/ai-insights`
- `/care-team`
- `/alerts`
- `/device-connections`
- `/health-profile`
- `/medications`
- `/appointments`
- `/labs`
- `/vitals`
- `/symptoms`
- `/vaccinations`
- `/documents`
- `/doctors`
- `/summary`
- `/exports`
- `/jobs`

---

## Demo User

```text
Email: demo@health.local
Password: demo12345
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phr_companion?schema=public"
AUTH_SECRET="your-long-random-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4.1-mini"
REDIS_URL="redis://localhost:6379"
```

### 3. Prepare database

```bash
npm run db:push
```

### 4. Seed demo data

```bash
npm run seed
```

### 5. Run the app

```bash
npm run dev
```

### 6. Run the worker

```bash
npm run worker
```

### 7. Optional checks

```bash
npm run typecheck
npm run build
```

---

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run seed
npm run db:push
npm run db:migrate
npm run typecheck
npm run worker
```

---

## Export Routes

- `/exports/appointments`
- `/exports/medications`
- `/exports/labs`
- `/exports/vitals`

---

## Why This Repo Reads Well

- It goes beyond single-module CRUD and models a broader healthcare workspace.
- It combines product UI, collaboration rules, alert flows, AI summaries, and sync foundations.
- It includes background job infrastructure instead of only synchronous page logic.
- It shows both user-facing product work and backend systems thinking.
- It is a strong pinned project because it demonstrates domain modeling, authorization, jobs, and applied product design in one repo.

---

## Future Work

- fuller edit/delete coverage across all modules
- notification delivery channels
- production-grade Health Connect sync
- Apple Health and wearable integrations
- better document categorization and search
- expanded activity logs and audit views
- object storage for uploads
- OCR-assisted data extraction
- richer AI longitudinal summaries
- offline/PWA workflows
- interoperability / FHIR direction

---

## License

MIT


## Local Prisma setup

1. Copy `.env.example` to `.env`
2. Replace `DATABASE_URL` with your real PostgreSQL connection string
3. Run:

```bash
npm install
npm run db:validate
npx prisma generate
npm run typecheck
```

If `npm run db:validate` fails with `Environment variable not found: DATABASE_URL`, your `.env` file is missing or `DATABASE_URL` is not set yet.
