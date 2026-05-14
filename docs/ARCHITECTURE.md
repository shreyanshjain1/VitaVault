# VitaVault Architecture

VitaVault is a full-stack personal health record platform built with the Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Auth.js/NextAuth, Tailwind CSS, server actions, API routes, and Vitest tests.

## System overview

```text
Browser / reviewer demo
        |
        v
Next.js App Router
        |
        +-- Server components and protected pages
        +-- Server actions for authenticated workflows
        +-- API routes for health checks, mobile clients, exports, jobs, and internal scans
        |
        v
Domain helpers in lib/
        |
        +-- clinical workflow helpers
        +-- report/export builders
        +-- notification/alert/reminder orchestration
        +-- mobile/device contracts
        +-- security/audit/admin helpers
        |
        v
Prisma ORM
        |
        v
PostgreSQL

Optional side services:
- Redis/BullMQ-style background job foundation
- OpenAI-powered AI insights when configured
- Email provider for account/invite workflows when configured
- Local, S3, or R2-style document storage providers
```

## Runtime layers

| Layer | Main folders | Responsibility |
|---|---|---|
| App routes | `app/` | Pages, layouts, route handlers, public demo surfaces, protected workflow screens. |
| UI components | `components/` | Reusable cards, forms, shell, alerts, and shared interface elements. |
| Domain logic | `lib/` | Business logic, data shaping, policy checks, review signals, export/report builders. |
| Data model | `prisma/` | Prisma schema, migrations, and seed/demo seed foundations. |
| Worker foundation | `worker/`, `lib/jobs/` | Background job contracts, queues, job run tracking, and job admin helpers. |
| Tests | `tests/` | Vitest regression coverage for helpers, API behavior, route policies, and workflows. |
| Docs | `docs/` | Product, API, deployment, migration, and patch documentation. |

## App Router structure

The app contains both authenticated product routes and public reviewer demo routes.

### Authenticated product areas

- `/dashboard`
- `/health-profile`
- `/medications`
- `/appointments`
- `/labs`
- `/vitals`
- `/symptoms`
- `/documents`
- `/care-team`
- `/care-notes`
- `/visit-prep`
- `/care-plan`
- `/notifications`
- `/alerts`
- `/summary`
- `/report-builder`
- `/exports`
- `/ai-insights`
- `/device-connection`
- `/security`
- `/audit-log`
- `/admin`
- `/ops`
- `/jobs`

### Public reviewer demo areas

Public demo pages live under `/demo/*`. They let reviewers inspect major product surfaces without needing seeded credentials or a production database.

## Domain helper pattern

Most business logic is intentionally placed in `lib/` instead of directly inside pages. This keeps pages focused on composition and makes workflow logic easier to test.

Examples:

| Module | Helper responsibility |
|---|---|
| `lib/notification-center.ts` | Combines alerts, reminders, visits, devices, and review signals into notification items. |
| `lib/export-center.ts` | Builds export packet readiness and supported export definitions. |
| `lib/report-builder.ts` | Builds provider-ready report sections and print context. |
| `lib/visit-prep.ts` | Computes visit readiness, appointment proximity, and prep timeline grouping. |
| `lib/medication-safety.ts` | Classifies medication adherence and safety review states. |
| `lib/lab-review.ts` | Interprets lab trends and follow-up signals. |
| `lib/vitals-monitor.ts` | Classifies freshness, missing readings, and vital risk states. |
| `lib/symptom-review.ts` | Groups symptoms into recurring, worsening, stale, resolved, and stable patterns. |
| `lib/document-hub.ts` | Builds document intelligence review cards and readiness summaries. |
| `lib/ai-insights-workspace.ts` | Builds AI insight review, source, and trust checklist signals. |

## Data access pattern

- Prisma is centralized through `lib/db.ts`.
- Server actions and server routes call Prisma-backed helpers when data persistence is needed.
- Pure helper functions are kept testable with partial mocks where practical.
- Migration history is documented in `docs/PRISMA_MIGRATION_CHAIN.md`.

## Auth and access control

VitaVault uses Auth.js/NextAuth for authentication. Access control is split across:

- session helpers in `lib/session.ts`
- route policy helpers in `lib/route-policy.ts`
- care-team access helpers in `lib/access.ts` and `lib/care-permissions.ts`
- admin-only route and API policies for sensitive surfaces

Admin and ops surfaces are hidden from non-admin navigation and should also be protected server-side.

## Mobile and device architecture

Mobile/device support is split across:

| Area | Files/routes |
|---|---|
| Mobile auth | `/api/mobile/auth/login`, `/api/mobile/auth/me`, `/api/mobile/auth/logout` |
| Device readings | `/api/mobile/device-readings` |
| Device connections | `/api/mobile/connections`, `/device-connection`, `/device-connection/[id]` |
| Contract exports | `/api/mobile/openapi`, `/api/mobile/postman` |
| SDK examples | `examples/mobile-api/` |
| Security helpers | `lib/mobile-api-security.ts` |
| Provider abstractions | `lib/device-provider-connectors.ts` |

The mobile API is contract-tested so SDK examples, OpenAPI/Postman exports, and schema-backed enum values stay aligned.

## Background jobs architecture

The jobs foundation includes:

- queue constants and contracts
- handler definitions
- Redis connection helpers
- job run tracking helpers
- admin/job dashboard surfaces
- device sync job visibility

The application is designed so job foundations can run locally with Redis or degrade safely during build/reviewer flows when configured.

## Reporting and export architecture

Report and export workflows include:

- patient summary packets
- report builder presets
- saved report history
- print routes
- export center readiness checks
- CSV-style export routes
- emergency card and handoff views

These surfaces are designed for doctor visit prep, emergency handoff, and portable personal record sharing.

## Testing strategy

The project uses Vitest for broad helper and route regression coverage. Current test coverage focuses on:

- server action export/import checks
- route policy checks
- mobile API contracts
- workflow helper logic
- report/export behavior
- security/audit behavior
- deployment readiness checks
- public demo route coverage

Future higher-value testing would include browser-based smoke tests for the public demo flow.

## Design constraints

- Avoid unnecessary Prisma migrations.
- Keep README public-facing and avoid patch-history language there.
- Keep patch docs under `docs/`.
- Keep helper logic testable without requiring fully hydrated Prisma mocks.
- Keep public demo pages usable without a fully configured production environment.
