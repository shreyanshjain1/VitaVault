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

**VitaVault** is a full-stack personal health record platform built as a product-style healthcare workspace. It is designed to show more than simple CRUD screens: the app combines structured health records, care-team collaboration, alerts, reminders, AI-assisted summaries, exports, mobile/device ingestion foundations, admin visibility, and security workflows inside one cohesive application.

The project is intentionally built like a business-grade product foundation: clean domain modeling, protected workflows, audit-aware actions, operational pages, public demo surfaces, and a roadmap-ready architecture for future healthcare, wellness, and care coordination features.

---

## Project links

- **Repository:** [github.com/shreyanshjain1/VitaVault](https://github.com/shreyanshjain1/VitaVault)
- **Vercel demo:** [vita-vault-s6up.vercel.app](https://vita-vault-s6up.vercel.app/)
- **Public walkthrough:** `/demo`

> The public deployment is currently best treated as a product showcase/demo surface. Database-backed live flows depend on production environment configuration.

---

## What VitaVault demonstrates

VitaVault is a portfolio-grade health-tech product foundation focused on real full-stack engineering depth:

- patient-owned health records across multiple clinical modules
- medication, appointment, lab, vital, symptom, vaccination, doctor, and document workflows
- care-team invite and shared-access foundations
- threshold-based alert rules and alert-event tracking
- reminder workflows and review queues
- AI-assisted health insight support
- background job architecture with Redis and BullMQ
- mobile API and device ingestion foundations
- protected document delivery
- security, admin, ops, exports, and print-oriented views
- public demo routes for reviewer-friendly exploration without login friction

This repo is not positioned as a lightweight mockup. It is a full-stack product base with enough backend structure to support continued iteration.

---

## Product pillars

### 1. Personal health record workspace

VitaVault gives users a centralized workspace for managing their health information:

- health profile and baseline details
- medications and adherence logs
- appointments and doctors
- lab results
- vital readings
- symptom tracking
- vaccinations
- medical documents
- longitudinal timeline and summary views

### 2. Care-team collaboration

The app includes foundations for patient-controlled sharing:

- care-team invite creation
- invite acceptance and rejection flows
- scoped access records
- shared patient routes
- access-aware views
- audit-friendly care access structure

### 3. Alerts, reminders, and review workflows

VitaVault includes healthcare workflow primitives beyond basic record storage:

- alert rules
- alert events
- alert severity and lifecycle states
- reminder scheduling
- review queue pages
- print-oriented review flows
- worker-backed scan/evaluation foundations

### 4. Mobile and device readiness

The codebase already includes API foundations for future mobile and connected-device workflows:

- mobile login/logout/me endpoints
- bearer-token mobile sessions
- device connection tracking
- device reading ingestion
- sync job modeling
- normalized readings into health records

### 5. AI-assisted health summaries

The AI module is designed as an assistant layer on top of structured records:

- AI insights page
- insight persistence model
- summary-generation foundations
- reviewable product surface for future clinical/workflow intelligence

### 6. Security and operations

The repo includes business-product signals that go beyond a normal portfolio app:

- Auth.js / NextAuth integration
- protected user workflows
- mobile/API session visibility and revocation foundations
- password reset and email verification flows
- protected document download route
- admin dashboard foundations
- ops and job visibility pages
- repo checks and CI-ready scripts

---

## Application surface

### Authenticated product routes

| Area | Routes |
|---|---|
| Core | `/dashboard`, `/health-profile`, `/timeline`, `/summary`, `/summary/print` |
| Records | `/medications`, `/appointments`, `/doctors`, `/labs`, `/vitals`, `/symptoms`, `/vaccinations`, `/documents` |
| Collaboration | `/care-team`, `/patient/[ownerUserId]`, `/invite/[token]` |
| Alerts & reminders | `/alerts`, `/alerts/[id]`, `/alerts/rules`, `/reminders`, `/review-queue`, `/review-queue/print` |
| Intelligence | `/ai-insights` |
| Device/mobile | `/device-connection` |
| Business/ops | `/exports`, `/jobs`, `/ops`, `/security`, `/admin` |
| Account recovery | `/forgot-password`, `/reset-password`, `/verify-email` |

### Public demo routes

The app includes a no-login demo surface for product review and portfolio showcasing:

| Demo area | Routes |
|---|---|
| Demo shell | `/demo`, `/demo/dashboard` |
| Demo records | `/demo/health-profile`, `/demo/medications`, `/demo/appointments`, `/demo/doctors`, `/demo/labs`, `/demo/vitals`, `/demo/symptoms`, `/demo/vaccinations`, `/demo/documents` |
| Demo workflows | `/demo/care-team`, `/demo/ai-insights`, `/demo/alerts`, `/demo/timeline`, `/demo/reminders`, `/demo/review-queue`, `/demo/summary`, `/demo/exports` |
| Demo ops/security | `/demo/device-connection`, `/demo/jobs`, `/demo/ops`, `/demo/security`, `/demo/admin` |

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
| Repo health | action export checks, import checks, hygiene checks, Prisma validation |

---

## Domain model coverage

The Prisma schema models a broad health-product domain, including:

- users and health profiles
- doctors and appointments
- medications and adherence logs
- labs, vitals, symptoms, and vaccinations
- documents and protected file access
- care invites and care access
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

| Medications | Appointments |
|---|---|
| <img src=".mkdir/Medications.jpg" alt="Medications" width="100%"> | <img src=".mkdir/Appointments.jpg" alt="Appointments" width="100%"> |

| Labs | Exports |
|---|---|
| <img src=".mkdir/Lab-Results.jpg" alt="Lab Results" width="100%"> | <img src=".mkdir/Exports-Page.jpg" alt="Exports Page" width="100%"> |

### Collaboration and intelligence

| AI Insights | Care Team |
|---|---|
| <img src=".mkdir/AI-Insights.jpg" alt="AI Insights" width="100%"> | <img src=".mkdir/Care-Team.jpg" alt="Care Team" width="100%"> |

| Alert Center | Device Connection |
|---|---|
| <img src=".mkdir/Alert-Center.jpg" alt="Alert Center" width="100%"> | <img src=".mkdir/Device-Connections.jpg" alt="Device Connection" width="100%"> |

### Clinical records

| Vaccinations | Doctors |
|---|---|
| <img src=".mkdir/Vaccinations.jpg" alt="Vaccinations" width="100%"> | <img src=".mkdir/Doctors.jpg" alt="Doctors" width="100%"> |

| Summary | Vitals |
|---|---|
| <img src=".mkdir/Summary.jpg" alt="Summary" width="100%"> | <img src=".mkdir/Vitals.jpg" alt="Vitals" width="100%"> |

| Symptoms | Documents |
|---|---|
| <img src=".mkdir/Symptoms.jpg" alt="Symptoms" width="100%"> | <img src=".mkdir/Documents.jpg" alt="Documents" width="100%"> |

### Entry screens

| Landing Page | Login Page |
|---|---|
| <img src=".mkdir/Landing-Page.jpg" alt="Landing Page" width="100%"> | <img src=".mkdir/Login-Page.jpg" alt="Login Page" width="100%"> |

---

## Current product status

VitaVault is currently best described as a **feature-rich full-stack health platform foundation**.

Strongest areas:

- broad health record coverage
- Prisma domain modeling
- care-team and shared-access foundations
- alert and reminder workflows
- background job architecture
- mobile/device API foundations
- demo and portfolio presentation surface
- repo health scripts and test foundations

Main areas for future polish:

- stronger onboarding and first-run experience
- more impressive dashboard command center
- branded patient summary reports
- deeper caregiver workspace experience
- formal mobile/device API documentation
- improved audit log and security-center UI
- production object storage for documents
- full production deployment configuration

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for the honest current-state notes used to guide future patch planning.

---

## Roadmap direction

The next best upgrades are intentionally product-facing rather than random feature bloat:

1. **Stabilization and documentation accuracy**
2. **Dashboard command center upgrade**
3. **First-time onboarding wizard**
4. **Branded patient summary report**
5. **Mobile/device API documentation**
6. **Caregiver shared patient workspace**
7. **Audit log and security center upgrade**
8. **Printable emergency health card**

That path turns the existing backend depth into a clearer, more impressive business-ready product experience.
