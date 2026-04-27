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

**VitaVault** is a full-stack personal health record platform built as a product-style healthcare workspace rather than a simple CRUD demo.

It combines structured health records, reminder and alert workflows, care-team collaboration, AI-assisted summaries, exports, security controls, admin tooling, and device/mobile-ready foundations inside one application.

---

## Links

- **GitHub:** [shreyanshjain1/VitaVault](https://github.com/shreyanshjain1/VitaVault)
- **Vercel Demo:** [vita-vault-s6up.vercel.app](https://vita-vault-s6up.vercel.app/)
- **Public walkthrough:** open `/demo` on the deployed app
- **Demo note:** database is not configured yet on the public deployment, so the read-only public demo is the best way to explore the product surface online

---

## Why this project stands out

A lot of health-record portfolio apps stop at forms and a dashboard. VitaVault goes further by modeling the operational side of a real product:

- longitudinal patient records across multiple clinical modules
- patient-controlled care-team sharing and invite flows
- alert rules, alert events, and audit history
- queue-backed background processing with Redis and BullMQ
- device and mobile ingestion foundations
- AI-assisted summaries and insight workflows
- exports, print views, admin, ops, and review workflows
- public no-login demo experience for product showcasing

This repo sits at the intersection of **product engineering**, **health-data workflows**, and **production-minded full-stack architecture**.

---

## Product highlights

### Personal Health Record Workspace
Users can manage:

- health profile and baseline context
- medications, schedules, and adherence logs
- appointments and care providers
- lab results
- vitals history
- symptoms and vaccinations
- medical documents
- reminders, summaries, and exports

### Shared Care Foundations
VitaVault includes collaboration-oriented flows such as:

- care-team invite creation and acceptance
- scoped shared access
- access-aware patient views
- invite email support and fallback link sharing
- access auditing foundations

### Alerting and Monitoring
The platform includes a strong alerting foundation:

- threshold-based alert rules
- alert severity and lifecycle states
- source-linked alert events
- alert audit history
- worker-backed evaluation and scan flows

### Device and Mobile Readiness
The app is already structured for connected-data expansion:

- device connection tracking
- device reading ingestion
- sync job lifecycle tracking
- mirrored readings into normalized vitals
- bearer-token foundations for mobile sync flows

### AI and Review Workflows
VitaVault also pushes beyond storage into interpretation:

- AI-generated health insights
- summary generation
- review queue workflows
- print-oriented review and summary views

### Security and Admin Controls
The application now includes stronger operational controls such as:

- password rotation
- mobile/API session visibility and revocation
- email verification and password reset flows
- protected document delivery
- admin user lifecycle controls
- admin and ops visibility pages

---

## Current application surface

The repo currently contains real pages and workflows for:

- `/dashboard`
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
- `/summary/print`
- `/exports`
- `/care-team`
- `/patient/[ownerUserId]`
- `/alerts`
- `/alerts/rules`
- `/timeline`
- `/reminders`
- `/ai-insights`
- `/device-connection`
- `/jobs`
- `/ops`
- `/review-queue`
- `/review-queue/print`
- `/security`
- `/admin`

There is also a dedicated public demo surface for showcasing the product without logging in:

- `/demo`
- `/demo/dashboard`
- `/demo/health-profile`
- `/demo/medications`
- `/demo/appointments`
- `/demo/labs`
- `/demo/vitals`
- `/demo/symptoms`
- `/demo/vaccinations`
- `/demo/doctors`
- `/demo/documents`
- `/demo/care-team`
- `/demo/ai-insights`
- `/demo/alerts`
- `/demo/timeline`
- `/demo/reminders`
- `/demo/review-queue`
- `/demo/summary`
- `/demo/exports`
- `/demo/device-connection`
- `/demo/jobs`
- `/demo/ops`
- `/demo/security`
- `/demo/admin`

---

## Technical architecture

### Frontend
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- reusable component system with utility-first styling
- charting and animated UI support

### Backend
- Auth.js / NextAuth
- Prisma ORM
- PostgreSQL
- Zod validation
- server actions and route handlers
- ownership and shared-access checks

### Background processing
- BullMQ queue layer
- Redis-backed worker runtime
- persisted job runs and job logs
- internal dispatch routes for operational workflows

### Quality and repo health
- Vitest test suite for key business logic
- ESLint and TypeScript validation
- GitHub Actions / CI-oriented repository hardening
- product-facing demo routes for easier showcase and review

### Domain model coverage
The schema includes models for:

- user and health profile data
- medications and adherence logs
- appointments, doctors, labs, vitals, symptoms, vaccinations, documents
- reminders and exports
- care access and invites
- AI insights
- device connections, readings, sync jobs, mobile session tokens
- alert rules, events, and alert audits
- job runs and operational job logs

---

## Product status

VitaVault is already a serious portfolio-grade application with strong architectural depth.

At the same time, the repo is best described as **feature-rich and production-minded, but still evolving**.

Current strengths are strongest in:

- data modeling
- authenticated app structure
- breadth of health modules
- alerting foundations
- worker and job architecture
- care collaboration groundwork
- security and admin controls
- product showcase readiness through the public demo surface

The biggest opportunity now is continued polish:
- tighter demo parity and presentation
- production object storage for documents
- more ops/admin depth
- further hardening of deployment and background workflows

---

## Core experience

| Dashboard | Health Profile |
|---|---|
| <img src=".mkdir/Dashboard.jpg" alt="Dashboard" width="100%"> | <img src=".mkdir/Health-Profile.jpg" alt="Health Profile" width="100%"> |

| Medications | Appointments |
|---|---|
| <img src=".mkdir/Medications.jpg" alt="Medications" width="100%"> | <img src=".mkdir/Appointments.jpg" alt="Appointments" width="100%"> |

| Labs | Exports |
|---|---|
| <img src=".mkdir/Lab-Results.jpg" alt="Lab Results" width="100%"> | <img src=".mkdir/Exports-Page.jpg" alt="Exports Page" width="100%"> |

## Collaboration and intelligence

| AI Insights | Care Team |
|---|---|
| <img src=".mkdir/AI-Insights.jpg" alt="AI Insights" width="100%"> | <img src=".mkdir/Care-Team.jpg" alt="Care Team" width="100%"> |

| Alert Center | Device Connection |
|---|---|
| <img src=".mkdir/Alert-Center.jpg" alt="Alert Center" width="100%"> | <img src=".mkdir/Device-Connections.jpg" alt="Device Connection" width="100%"> |

## Clinical records

| Vaccinations | Doctors |
|---|---|
| <img src=".mkdir/Vaccinations.jpg" alt="Vaccinations" width="100%"> | <img src=".mkdir/Doctors.jpg" alt="Doctors" width="100%"> |

| Summary | Vitals |
|---|---|
| <img src=".mkdir/Summary.jpg" alt="Summary" width="100%"> | <img src=".mkdir/Vitals.jpg" alt="Vitals" width="100%"> |

| Symptoms | Documents |
|---|---|
| <img src=".mkdir/Symptoms.jpg" alt="Symptoms" width="100%"> | <img src=".mkdir/Documents.jpg" alt="Documents" width="100%"> |

## Entry screens

| Landing Page | Login Page |
|---|---|
| <img src=".mkdir/Landing-Page.jpg" alt="Landing Page" width="100%"> | <img src=".mkdir/Login-Page.jpg" alt="Login Page" width="100%"> |

---

## Tech stack

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
- **Vitest**

---

## Repository notes

A few important points about the current repo state:

- this repository is meant to showcase the implemented product surface more than local setup hand-holding
- some areas are complete user flows, while others are strong foundations prepared for later iterations
- local file uploads are currently stored on disk rather than in a production object-storage layer
- the public deployment is best treated as a product walkthrough until database-backed live flows are configured
- the app includes internal and worker-facing infrastructure for product realism, even where some operational polish is still in progress

---

## What comes next

The strongest next upgrades for VitaVault are:

- production-grade document storage
- more polished demo parity with the authenticated app
- deeper admin and ops controls
- richer export and printable patient summary workflows
- stronger delivery and notification mechanisms
- more formal test coverage around newer admin and demo features
