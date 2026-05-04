# VitaVault Demo Data Seed

The demo data seed creates a complete reviewer-friendly VitaVault workspace with realistic health records, care-team access, alerts, reminders, device sync history, AI insight history, documents, and admin/ops signals.

## Command

```bash
npm run seed:demo
```

## Demo accounts

All seeded accounts use this password:

```txt
demo12345
```

| Email | Role | Purpose |
|---|---|---|
| `admin@vitavault.demo` | Admin | Review admin, ops, audit, jobs, security, and account lifecycle surfaces |
| `patient@vitavault.demo` | Patient | Full patient record workspace with health data and workflows |
| `caregiver@vitavault.demo` | Caregiver | Shared-care reviewer with access to the patient workspace |
| `doctor@vitavault.demo` | Doctor | Provider-style shared access persona |
| `lab@vitavault.demo` | Lab staff | Lab-review persona for role coverage |

## What gets seeded

The seed resets only the demo accounts above, then recreates:

- a patient profile with emergency contact, allergies, chronic conditions, and notes
- doctors/providers
- active and completed medications
- medication schedules and adherence logs
- upcoming and completed appointments
- lab results with normal, borderline, and high flags
- vitals with blood pressure, glucose, oxygen, temperature, and weight readings
- symptoms with resolved and unresolved states
- vaccinations with future due dates
- medical documents with linked and unlinked states
- reminders across medication, appointment, and lab follow-up workflows
- alert rules, alert events, and alert audit logs
- device connection, device readings, sync job, job run, and job logs
- care access relationships and a pending care-team invite
- access audit logs
- an AI insight with source-style flags and recommended follow-ups

## Safety notes

This script is intended for local development and portfolio/demo databases only.

It deletes and recreates accounts matching the demo emails above. It does not touch non-demo accounts.

Do not run it against a production database.
