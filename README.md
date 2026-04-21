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

**VitaVault** is a full-stack personal health record platform built to feel more like a real product than a simple CRUD demo.

It combines structured health record management, shared-care access, alert workflows, background jobs, AI-assisted summaries, and mobile/device ingestion foundations in one authenticated workspace.

---

## Why this project stands out

Most health-record portfolio apps stop at basic forms and a dashboard.
VitaVault goes further by modeling the operational side of a real product:

- longitudinal health records across multiple modules
- patient-controlled care sharing and invite flows
- alert rules, alert events, and alert audit trails
- queue-backed background processing with Redis + BullMQ
- mobile token foundations and device reading ingestion
- AI summary and insight workflows
- exports, print views, and operational pages

This repo is aimed at the intersection of **product engineering**, **health-data workflows**, and **production-minded full-stack architecture**.

---

## Product highlights

### Personal Health Record Workspace
Users can manage:
- health profile and baseline medical context
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
- access auditing foundations

### Alerting and Monitoring
The platform includes a strong early alerting foundation:
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
- bearer-token foundation for mobile sync flows

### AI and Review Workflows
VitaVault also pushes beyond storage into interpretation:
- AI-generated health insights
- summary generation
- review-queue and print-oriented review flows

---

## Current application surface

The repo currently contains real pages and flows for:

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

This is one of the reasons the project already feels closer to a product workspace than a single-feature app.

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
- worker/job architecture
- care collaboration groundwork

The main opportunity now is not adding random features.
It is finishing and hardening the existing foundations into a more polished business-ready product.

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

---

## Repository notes

A few important points about the current repo state:

- this repository intentionally showcases the implemented product surface more than local setup instructions
- some areas are complete user flows, while others are foundations prepared for future iterations
- local file uploads are currently stored on disk rather than a production object-storage layer
- the app includes internal and worker-facing infrastructure that is useful for product realism, even where some operational polish is still in progress

---

## Demo account

```text
Email: demo@health.local
Password: demo12345
```

---

## What comes next

The strongest next upgrades for VitaVault are:
- tighter security hardening around internal and operational routes
- richer export and printable patient summary flows
- stronger admin and ops visibility
- better invite delivery and reminder delivery mechanisms
- production-grade document storage strategy
- more formal test coverage

---

## Repository link

GitHub: [shreyanshjain1/VitaVault](https://github.com/shreyanshjain1/VitaVault)
