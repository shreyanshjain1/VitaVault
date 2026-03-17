# VitaVault

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-black?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-6.5-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Auth.js](https://img.shields.io/badge/Auth.js-5-black?style=for-the-badge&logo=auth0)
![Zod](https://img.shields.io/badge/Zod-3.24-3b82f6?style=for-the-badge)
![Recharts](https://img.shields.io/badge/Recharts-2.15-8884d8?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A flagship personal health record and care-collaboration platform for tracking medications, appointments, lab results, vitals, symptoms, documents, AI insights, and shared care access in one secure dashboard.

---

## Overview

VitaVault is a premium, portfolio-worthy health management web app designed to help users keep their personal health records organized in one place while preparing the product for real collaborative healthcare workflows. It is built as a modern startup-style MVP with polished UI, secure authentication, clean data architecture, AI-assisted insights, mobile-ready backend foundations, and investor-ready product direction.

Users can securely manage:

- Health profile
- Allergies and chronic conditions
- Medications and schedules
- Medication adherence logs
- Doctor appointments
- Doctors and clinics
- Lab results
- Vital signs
- Symptom journal
- Vaccination history
- Medical documents
- CSV exports
- Printable health summary
- AI-generated health insights
- Care-team invites and shared access
- Alert center foundation
- Device connection roadmap
- Android-ready mobile ingestion backend foundation

---

## What's New

- Redesigns the dashboard into a more premium command-center experience
- Adds a polished sidebar/app shell with grouped navigation and collapse support
- Elevates AI Insights and Care Team as flagship product features
- Improves care-team invite UX with clearer sender and recipient flows
- Adds Alert Center foundation for future threshold/trend-based monitoring
- Adds Device Connections roadmap page for sponsor/client demos
- Redesigns Health Profile, Medications, Appointments, Labs, Vitals, Symptoms, Documents, Vaccinations, Doctors, Summary, and Exports pages into a more premium SaaS-style layout
- Prevents duplicate same-day medication logs for the same medication schedule
- Adds a **Skipped** medication action alongside **Taken** and **Missed**
- Adds medication adherence summary cards on the Medications page
- Adds mobile backend foundation for Android sync:
  - mobile token auth
  - device connection tracking
  - sync job audit trail
  - device reading ingestion endpoints
  - mirrored supported readings into `VitalRecord`
- Adds GitHub workflow polish with CI typecheck support and contribution templates
- Keeps the app startup-style, premium, and portfolio-ready while improving real product behavior

---

## Screenshots

| Preview 1 | Preview 2 |
|---|---|
| **Landing Page**<br><img src=".mkdir/Landing-Page.jpg" alt="Landing Page" width="100%"> | **Login Page**<br><img src=".mkdir/Login-Page.jpg" alt="Login Page" width="100%"> |
| **Dashboard**<br><img src=".mkdir/Dashboard.jpg" alt="Dashboard" width="100%"> | **Health Profile**<br><img src=".mkdir/Health-Profile.jpg" alt="Health Profile" width="100%"> |
| **Medications**<br><img src=".mkdir/Medications.jpg" alt="Medications" width="100%"> | **Appointments**<br><img src=".mkdir/Appointments.jpg" alt="Appointments" width="100%"> |
| **Lab Results**<br><img src=".mkdir/Lab-Results.jpg" alt="Lab Results" width="100%"> | **Exports Page**<br><img src=".mkdir/Exports-Page.jpg" alt="Exports Page" width="100%"> |
| **AI Insights**<br><img src=".mkdir/AI-Insights.jpg" alt="AI Insights" width="100%"> | **Care Team**<br><img src=".mkdir/Care-Team.jpg" alt="Care Team" width="100%"> |
| **Device Connections**<br><img src=".mkdir/Device-Connections.jpg" alt="Device Connections" width="100%"> | **Alert Center**<br><img src=".mkdir/Alert-Center.jpg" alt="Alert Center" width="100%"> |
| **Vaccinations**<br><img src=".mkdir/Vaccinations.jpg" alt="Vaccinations" width="100%"> | **Doctors**<br><img src=".mkdir/Doctors.jpg" alt="Doctors" width="100%"> |
| **Summary**<br><img src=".mkdir/Summary.jpg" alt="Summary" width="100%"> | **Vitals**<br><img src=".mkdir/Vitals.jpg" alt="Vitals" width="100%"> |
| **Symptoms**<br><img src=".mkdir/Symptoms.jpg" alt="Symptoms" width="100%"> | **Documents**<br><img src=".mkdir/Documents.jpg" alt="Documents" width="100%"> |

---

## Features

### Authentication
- Sign up
- Login
- Logout
- Protected dashboard routes
- Secure password hashing with bcrypt
- Demo user seed
- Separate mobile token authentication foundation for Android sync

### Dashboard
- Premium command-center layout
- Profile completion card
- Next medication reminder
- Upcoming appointments
- Latest lab results
- Recent symptoms
- Health alerts
- Quick module cards
- Trend charts for blood pressure, weight, blood sugar, and medicine adherence
- Stronger flagship placement for AI and care-team features

### Health Records
- Health profile management
- Medication management with schedules and adherence tracking
- Same-day medication logging protection to avoid duplicate dose entries
- Taken, Missed, and Skipped adherence actions
- Medication adherence summary cards
- Appointment tracking with follow-up notes
- Lab result logging with result flags
- Vital signs tracker with charts and history
- Symptom journal with severity and status
- Vaccination history
- Medical document uploads
- Doctor and clinic directory
- Reminder visibility from health data
- Printable summary experience
- CSV export support

### Collaboration & AI
- AI insight generation from stored records
- AI-first product positioning with better empty/error states
- Care-team invite creation and acceptance flow
- Shared patient workspace foundation
- Access-role and permission-based collaboration
- Alert Center foundation for future escalation workflows

### Mobile & Device Readiness
- Device Connections roadmap page
- Android-ready mobile backend ingestion foundation
- Device connection tracking
- Sync job history and auditability
- Reading source modeling for manual and future connected health sources
- Mirroring supported synced readings into `VitalRecord`
- Designed for Health Connect as the first real mobile ingestion path

### Productivity
- Search and filter support
- CSV export routes
- Printable summary page
- Responsive premium layout for desktop and mobile
- Sidebar collapse support
- Premium animated page transitions and staggered UI motion

### Security
- Route protection via middleware
- Authenticated ownership checks
- Zod-based server validation
- Secure password hashing
- Environment-based secrets
- File upload validation
- Cross-user access prevention on data routes and exports
- Mobile bearer-token auth foundation for app sync

### Developer Experience
- TypeScript typecheck script
- CI workflow for automated type checking
- GitHub issue templates
- GitHub pull request template
- Prisma-powered data modeling
- Modular UI/page architecture for easier scaling

---

## Tech Stack

- **Next.js 15+** with App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Prisma ORM**
- **PostgreSQL**
- **Auth.js / NextAuth**
- **Zod**
- **Recharts**
- **lucide-react**
- **framer-motion**

---

## Folder Structure

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
├── lib/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
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

## Main Pages

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

---

## Demo User

```text
Email: demo@health.local
Password: demo12345
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create a `.env` file in the root using this content:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phr_companion?schema=public"
AUTH_SECRET="your-long-random-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4.1-mini"
```

### 3. Push the Prisma schema

```bash
npm run db:push
```

### 4. Seed demo data

```bash
npm run seed
```

### 5. Run the development server

```bash
npm run dev
```

### 6. Optional: run typecheck

```bash
npm run typecheck
```

### 7. Open the app

```text
http://localhost:3000
```

---

## Export Routes

- `/exports/appointments`
- `/exports/medications`
- `/exports/labs`
- `/exports/vitals`

---

## Prisma Models

The project includes the following main Prisma models:

- User
- HealthProfile
- Medication
- MedicationSchedule
- MedicationLog
- Appointment
- Doctor
- LabResult
- VitalRecord
- SymptomEntry
- VaccinationRecord
- MedicalDocument
- Reminder
- CareAccess
- CareInvite
- AccessAuditLog
- AiInsight
- DeviceConnection
- DeviceReading
- MobileSessionToken
- SyncJob

---

## Why This Project Stands Out

- Built like a startup MVP, not just a CRUD school project
- Covers multiple real healthcare record workflows in one product
- Adds collaborative care and AI layers beyond a basic personal tracker
- Blends premium UI with practical data handling
- Includes analytics, adherence tracking, export flows, printable summary support, and mobile-ready device ingestion foundations
- Strong candidate for a pinned GitHub project and portfolio centerpiece

---

## Future Improvements

- Edit and delete flows across all entities
- Recurring reminder engine
- Email and push notifications
- Full caregiver notification workflow
- Android Health Connect production sync
- Apple Health / wearable integrations
- Better medical document categorization
- Audit trail and activity log expansion
- Cloud object storage for uploads
- OCR support for prescriptions and lab reports
- Richer AI-assisted health summaries
- PWA offline support
- FHIR / interoperability direction for future clinical integrations

---

## License

MIT
