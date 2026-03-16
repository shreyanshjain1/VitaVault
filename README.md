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

A flagship personal health record companion for tracking medications, appointments, lab results, vitals, symptoms, documents, and health insights in one secure dashboard.

---

## Overview

VitaVault is a premium, portfolio-worthy health management web app designed to help users keep their personal health records organized in one place. It is built as a modern startup-style MVP with polished UI, secure authentication, clean data architecture, and analytics-driven health insights.

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

---

## What's New

- Prevents duplicate same-day medication logs for the same medication schedule
- Adds a **Skipped** medication action alongside **Taken** and **Missed**
- Adds medication adherence summary cards on the Medications page
- Adds GitHub workflow polish with CI typecheck support and contribution templates
- Keeps the app startup-style, premium, and portfolio-ready while improving real product behavior

---

## Screenshots

> Place these images inside your repo folder exactly as shown below so GitHub can render them.
> 
> Example folder path in repo: `.mkdir/`

### Landing Page
![Landing Page](.mkdir/Landing-Page.jpg)

### Login Page
![Login Page](.mkdir/Login-Page.jpg)

### Dashboard
![Dashboard](.mkdir/Dashboard.jpg)

### Health Profile
![Health Profile](.mkdir/Health-Profile.jpg)

### Medications
![Medications](.mkdir/Medications.jpg)

### Appointments
![Appointments](.mkdir/Appointments.jpg)

### Lab Results
![Lab Results](.mkdir/Lab-Results.jpg)

### Exports Page
_Exports page screenshot placeholder added — current image file appears incomplete, so replace `.mkdir/Exports-Page.jpg` with a valid screenshot when ready._

---

## Features

### Authentication
- Sign up
- Login
- Logout
- Protected dashboard routes
- Secure password hashing with bcrypt
- Demo user seed

### Dashboard
- Welcome panel
- Profile completion card
- Next medication reminder
- Upcoming appointments
- Latest lab results
- Recent symptoms
- Health alerts
- Quick action cards
- Trend charts for blood pressure, weight, blood sugar, and medicine adherence

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

### Productivity
- Search and filter support
- CSV export routes
- Printable summary page
- Responsive premium layout for desktop and mobile

### Security
- Route protection via middleware
- Authenticated ownership checks
- Zod-based server validation
- Secure password hashing
- Environment-based secrets
- File upload validation
- Cross-user access prevention on data routes and exports

### Developer Experience
- TypeScript typecheck script
- CI workflow for automated type checking
- GitHub issue templates
- GitHub pull request template
- Prisma-powered data modeling

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
│   ├── appointments/
│   ├── dashboard/
│   ├── doctors/
│   ├── documents/
│   ├── exports/
│   ├── health-profile/
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

---

## Why This Project Stands Out

- Built like a startup MVP, not just a CRUD school project
- Covers multiple real healthcare record workflows in one product
- Blends premium UI with practical data handling
- Includes analytics, adherence tracking, export flows, and printable summary support
- Strong candidate for a pinned GitHub project and portfolio centerpiece

---

## Future Improvements

- Edit and delete flows across all entities
- Recurring reminder engine
- Email and push notifications
- Shared caregiver access
- Better medical document categorization
- Audit trail and activity log
- Cloud object storage for uploads
- OCR support for prescriptions and lab reports
- AI-assisted health summaries
- PWA offline support

---

## License

MIT
