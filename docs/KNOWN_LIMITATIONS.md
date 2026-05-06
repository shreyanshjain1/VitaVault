# VitaVault Known Limitations

This document tracks the honest current-state gaps that should guide future patches. The goal is not to downplay the project, but to keep upgrades practical, focused, and business-useful.

## Current production limitations

### 1. Public deployment still needs complete environment configuration

The app is structured for a real database-backed deployment, but the public Vercel demo depends on production values for database, auth, Redis, and optional AI settings.

Impact:

- live authenticated flows may not behave like the local/full environment until production variables are configured
- public demo routes remain the safest showcase surface while production database setup is incomplete

Recommended next action:

- keep demo routes polished for recruiters/reviewers
- configure production `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXTAUTH_URL`, and `REDIS_URL` when moving to a live product deployment

---

### 2. Document storage is local-first

The current document workflow is useful for development and demo purposes, but production healthcare-style uploads should not depend only on local disk storage.

Impact:

- file persistence can be fragile on serverless hosting
- production privacy, retention, and backup controls are limited

Recommended next action:

- move uploaded documents to object storage such as S3, Cloudflare R2, Supabase Storage, or UploadThing
- keep database metadata in Prisma while storing the file object externally

---

### 3. Redis and worker features require separate production planning

The project includes BullMQ and Redis foundations for alerts, reminders, and jobs. That is strong architecture, but the worker runtime should be treated as a separate production service.

Impact:

- Vercel alone is not always enough for long-running workers
- missing `REDIS_URL` can block job-connected features

Recommended next action:

- document worker deployment separately
- add graceful fallbacks for demo environments where Redis is unavailable
- consider a hosted Redis provider and a small worker host such as Railway, Render, Fly.io, or a VPS

---

### 4. AI insight workflow is still a foundation

The AI feature exists, but it should be improved before being presented as a mature medical assistant.

Impact:

- insights should be treated as supportive summaries, not medical advice
- source-linked explanations and better review states would make this much stronger

Recommended next action:

- add clearer disclaimers
- link insights to underlying records
- add reviewed/dismissed/saved insight states

---

### 5. Care-team sharing needs a richer caregiver workspace

The care access models and shared patient route exist, but the caregiver experience can be more impressive.

Impact:

- the backend capability is stronger than the current visible UX
- reviewers may not immediately see the value of the sharing model

Recommended next action:

- add a caregiver dashboard with latest alerts, recent records, active medications, upcoming appointments, and permission summary

---

### 6. Mobile and device APIs need documentation

The mobile and device ingestion endpoints are one of the strongest backend foundations, but they need clearer product-facing documentation.

Impact:

- reviewers may miss the depth of the API work
- future mobile integration will be slower without request/response examples

Recommended next action:

- add an API documentation page with authentication, endpoint examples, payload shapes, and error responses

---

### 7. Dashboard needs stronger product storytelling

The app has many modules, but the dashboard should do more to summarize health status and guide the user.

Impact:

- users may not immediately understand what needs attention
- the first logged-in screen could look more like a command center

Recommended next action:

- add profile completeness, needs-attention cards, upcoming care timeline, recent activity, and quick actions

---

### 8. Reports and printable outputs can be much stronger

The app already has exports and print routes, but a branded patient summary report would create a major business-value upgrade.

Impact:

- current exports are useful, but not yet a signature showcase feature
- doctors, caregivers, and emergency use cases would benefit from better printable reports

Recommended next action:

- add a branded patient summary report and emergency card in future patches

---

## Near-term patch order

1. Stabilization and documentation accuracy
2. Dashboard command center upgrade
3. First-time onboarding wizard
4. Branded patient summary report
5. Mobile/device API documentation
6. Caregiver shared patient workspace
7. Audit log and security center upgrade
8. Printable emergency health card
---

## Patch 41 update: migration safety

The reminder lifecycle migration has been hardened so `Reminder.updatedAt` is added with `DEFAULT CURRENT_TIMESTAMP` instead of being introduced as a required column with no default. A migration safety test now checks this behavior.

Remaining database caution:

- do not reset production databases unless data loss is intended
- if a local migration attempt already failed, inspect `_prisma_migrations` before retrying
- keep future Prisma migrations small and focused when changing required columns
