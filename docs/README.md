# VitaVault Documentation Hub

This folder contains the working documentation for VitaVault, a full-stack personal health record and health-tech portfolio platform. The goal of this hub is to make the project easier to review without forcing readers to scan every historical patch note.

## Start here

| Document | Purpose |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | High-level architecture, runtime layers, data flow, and operational boundaries. |
| [`FEATURE_MAP.md`](./FEATURE_MAP.md) | Product module map grouped by user workflow and reviewer value. |
| [`API_OVERVIEW.md`](./API_OVERVIEW.md) | API route overview, mobile API surface, internal APIs, and export contracts. |
| [`FEATURE_MATRIX.md`](./FEATURE_MATRIX.md) | Existing route-by-route matrix for authenticated and public demo surfaces. |
| [`MOBILE_DEVICE_API.md`](./MOBILE_DEVICE_API.md) | Detailed mobile/device API guide, supported values, and contract exports. |
| [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) | Deployment validation checklist. |
| [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) | Honest limitations and reviewer context. |
| [`PRISMA_MIGRATION_CHAIN.md`](./PRISMA_MIGRATION_CHAIN.md) | Prisma migration-chain notes and migration safety rules. |
| [`ENVIRONMENT.md`](./ENVIRONMENT.md) | Environment variable setup for local, reviewer, and Vercel contexts. |

## Reviewer paths

### Product reviewer path

1. Start with the public demo walkthrough.
2. Review the product module map in [`FEATURE_MAP.md`](./FEATURE_MAP.md).
3. Review the screenshots and public project narrative in the root `README.md`.
4. Open the no-login demo routes and compare them with authenticated workflow coverage.

### Technical reviewer path

1. Read [`ARCHITECTURE.md`](./ARCHITECTURE.md).
2. Review [`API_OVERVIEW.md`](./API_OVERVIEW.md) and [`MOBILE_DEVICE_API.md`](./MOBILE_DEVICE_API.md).
3. Inspect `prisma/schema.prisma`, `lib/`, `app/`, and `tests/`.
4. Run the standard local check commands from the patch instructions or deployment checklist.

### Deployment reviewer path

1. Read [`ENVIRONMENT.md`](./ENVIRONMENT.md).
2. Confirm `.env.example` matches the target environment.
3. Run `npm run db:validate:ci`, `npm run typecheck`, `npm run lint`, and `npm run test:run`.
4. Check `/api/health` once deployed.

## Documentation categories

| Category | Files |
|---|---|
| Architecture and product | `ARCHITECTURE.md`, `FEATURE_MAP.md`, `FEATURE_MATRIX.md` |
| API and integrations | `API_OVERVIEW.md`, `MOBILE_DEVICE_API.md`, mobile SDK examples under `examples/mobile-api/` |
| Deployment and operations | `ENVIRONMENT.md`, `DEPLOYMENT_CHECKLIST.md`, `PRISMA_MIGRATION_CHAIN.md` |
| Historical patch notes | `PATCH_*.md` files |
| Known limits and QA | `KNOWN_LIMITATIONS.md`, demo and deployment checklists |

## Notes on patch documentation

The `PATCH_*.md` files are retained as implementation history. They are useful for understanding how the project evolved, but they are not the best starting point for reviewers. Prefer the overview documents above first, then use patch notes only when tracing a specific change.

## Current high-level project shape

VitaVault includes:

- Health profile, medications, labs, vitals, symptoms, vaccinations, doctors, appointments, and documents.
- Care-plan, visit-prep, notification, alert, reminder, and review-queue workflows.
- Care-team sharing, care notes, and shared patient workspace foundations.
- Report builder, saved report history, export center, emergency card, and print-ready packets.
- AI insights workspace with source/trust review signals.
- Mobile/device ingestion APIs, device connection management, provider connector abstractions, and SDK examples.
- Admin, ops, jobs, security center, audit log, deployment readiness, and data quality surfaces.
- Public no-login demo routes for reviewer-friendly inspection.
