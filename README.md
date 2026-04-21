# VitaVault

**VitaVault** is a business-focused personal health record platform built to feel like a real product, not a classroom CRUD app. It combines structured medical record management, AI-assisted summaries, care collaboration, alerts, reminders, exports, and background job processing into one polished health workspace.

<p align="center">
  <img src=".mkdir/Landing-Page.jpg" alt="VitaVault Landing Page" width="100%" />
</p>

## Product Positioning

VitaVault is designed around a simple idea: health records should be **organized, reviewable, shareable, and operationally useful**.

Instead of scattering information across notes, messages, PDFs, and memory, VitaVault brings everything into a single system with:
- patient-facing record management
- care-team sharing foundations
- reminder and alert workflows
- AI-assisted record summaries
- background jobs for asynchronous processing
- exportable clinical data views
- operational visibility for product/admin workflows

## Core Highlights

### Unified Health Record Workspace
- Health profile and baseline patient context
- Medications and adherence tracking
- Appointments and care follow-ups
- Lab result tracking
- Vitals trend logging
- Symptom journaling
- Vaccination records
- Document upload and organization
- Doctor directory and linked care context

### Collaboration and Review
- Care-team invite flows
- Shared access foundations
- Review queue concepts for triage-style workflows
- Timeline-style activity and record linking

### Intelligence and Monitoring
- AI-generated health summaries and insight surfaces
- Alert rules and alert event tracking foundations
- Reminder center for due and overdue actions
- Device connection and sync foundations

### Operational Foundations
- BullMQ + Redis background jobs
- Job runs and queue visibility
- Export workflows
- Audit-minded data modeling
- Prisma-backed schema for a serious product surface

## Feature Surface

| Area | What VitaVault Covers |
|---|---|
| Authentication | Secure sign-in and protected app access |
| Patient Records | Health profile, medications, labs, vitals, symptoms, vaccinations, documents |
| Care Collaboration | Invite workflows and shared access foundations |
| AI Layer | Insight generation and summary experiences |
| Alerts & Reminders | Rule-driven alerting foundation and task tracking |
| Exports | Structured exports for selected record areas |
| Device / Mobile | Device connection, mobile auth, and reading sync groundwork |
| Jobs & Ops | Worker queues, job dispatch, logs, and operational visibility |

## Architecture Snapshot

### Frontend
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide icons

### Backend / Platform
- Auth.js / NextAuth
- Prisma ORM
- PostgreSQL
- BullMQ
- Redis
- Zod validations

### Product Design Goals
- premium SaaS-style UI
- health-record-first workflows
- extensible data model
- portfolio-quality structure with business use potential
- scalable foundation for reminders, alerts, exports, and collaboration

## Gallery

<p align="center">
  <img src=".mkdir/Dashboard.jpg" alt="Dashboard" width="48%" />
  <img src=".mkdir/Health-Profile.jpg" alt="Health Profile" width="48%" />
</p>
<p align="center">
  <img src=".mkdir/Medications.jpg" alt="Medications" width="48%" />
  <img src=".mkdir/Lab-Results.jpg" alt="Lab Results" width="48%" />
</p>
<p align="center">
  <img src=".mkdir/Vitals.jpg" alt="Vitals" width="48%" />
  <img src=".mkdir/Documents.jpg" alt="Documents" width="48%" />
</p>
<p align="center">
  <img src=".mkdir/Care-Team.jpg" alt="Care Team" width="48%" />
  <img src=".mkdir/Alert-Center.jpg" alt="Alert Center" width="48%" />
</p>
<p align="center">
  <img src=".mkdir/AI-Insights.jpg" alt="AI Insights" width="48%" />
  <img src=".mkdir/Exports-Page.jpg" alt="Exports" width="48%" />
</p>

## Why This Repo Stands Out

VitaVault is not just a UI concept. The repo already includes:
- a real Prisma domain model
- modular route structure across many health workflows
- background worker scaffolding
- queue/job visibility
- care-access modeling
- upload handling
- AI integration foundations
- export/report surfaces

That gives it stronger product depth than a typical demo health tracker.

## Current Product Direction

The project is moving toward a more complete business-ready platform with focus on:
- stronger record integrity
- cleaner collaboration flows
- deeper reporting and exports
- hardened internal APIs
- improved operational health tooling
- better test and CI confidence

## Repository Standards

The repo includes GitHub-first hygiene to support iterative PR-based development:
- pull request template
- issue templates
- CI for Prisma validation, typecheck, and linting
- dedicated lint workflow for fast PR signal

## Suggested PR Theme for This Phase

**Phase 01 — Data Integrity and Repo Hygiene**
- fix document type mismatch in the Documents module
- align device connection route references
- upgrade repository presentation in README
- add lint automation for pull requests

## License

This project is released under the MIT License.
