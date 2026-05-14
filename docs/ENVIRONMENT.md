# VitaVault Environment Setup

This guide explains the environment variables needed to run VitaVault locally, validate a reviewer/demo deployment, or prepare a production deployment.

Copy `.env.example` to `.env` for local development:

```powershell
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Never commit real `.env` values or production secrets.

## Environment levels

| Level | Purpose | Minimum expectation |
| --- | --- | --- |
| Local development | Run the app on a laptop with local Postgres/Redis or mocked optional services | `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL` |
| Reviewer / portfolio demo | Let someone inspect public demo routes and basic app readiness | Required auth/database keys plus `VITAVAULT_DEMO_MODE=true` |
| Production | Real deployment with durable database, secrets, storage, email, and monitoring | Required keys plus recommended integrations |

## Required variables

These should be configured before treating a deployment as stable.

| Variable | Used for | Local example / note |
| --- | --- | --- |
| `DATABASE_URL` | Prisma/PostgreSQL records, auth, reports, and app data | `postgresql://postgres:postgres@localhost:5432/vitavault?schema=public` |
| `AUTH_SECRET` | Auth.js session signing/encryption | Use a long random value |
| `NEXTAUTH_URL` | Auth.js callbacks and redirects | `http://localhost:3000` locally |
| `APP_URL` | Server-side links, emails, API docs, and readiness checks | `http://localhost:3000` locally |
| `NEXT_PUBLIC_APP_URL` | Browser-visible base URL for shared links and client-facing flows | Usually same as `APP_URL` |

## Demo and reviewer variables

| Variable | Used for | Suggested value |
| --- | --- | --- |
| `VITAVAULT_DEMO_MODE` | Server-side demo/reviewer fallback behavior | `true` for portfolio demo deployments |
| `NEXT_PUBLIC_DEMO_MODE` | Browser-visible demo/reviewer fallback behavior | `true` for portfolio demo deployments |
| `HEALTHCHECK_URL` | Optional health endpoint target for scripts | `http://localhost:3000/api/health` locally |

Public `/demo` routes should stay useful for reviewers even while production-only integrations are still incomplete.

## Auth variables

| Variable | Used for | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | Auth.js signing/encryption | Required |
| `NEXTAUTH_URL` | Auth callback URL | Required |
| `AUTH_TRUST_HOST` | Allows Auth.js to trust deployment host headers | Keep `true` on Vercel |

Generate a production-grade `AUTH_SECRET` with a secure random generator. Do not reuse the placeholder from `.env.example`.

## Redis and jobs

| Variable | Used for | Notes |
| --- | --- | --- |
| `REDIS_URL` | BullMQ-style jobs, reminders, alerts, and queue-backed workflows | Recommended for production |
| `WORKER_CONCURRENCY` | Worker processing concurrency | Defaults can stay small locally |
| `JOB_DASHBOARD_LIMIT` | Jobs dashboard result limit | Optional tuning |
| `SKIP_REDIS_DURING_BUILD` | Prevents Redis work during build environments | Set `1` on Vercel/build-only environments if needed |

If Redis is not configured, the main app should still render core pages, but queue-backed features will be degraded.

## AI insights

| Variable | Used for | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Live AI insight generation | Optional; fallback/demo mode should remain usable without it |
| `OPENAI_MODEL` | AI model name | Example: `gpt-5-mini` |

Do not expose `OPENAI_API_KEY` in browser-visible variables.

## Email workflows

| Variable | Used for | Notes |
| --- | --- | --- |
| `EMAIL_VERIFICATION_REQUIRED` | Enables stricter email verification flow | `false` locally, `true` for stricter deployments |
| `RESEND_API_KEY` | Verification, invite, and outbound email delivery | Recommended for production |
| `RESEND_FROM_EMAIL` | Verified sender identity | Must match the email provider configuration |

Without email provider keys, email workflows should remain disabled or degraded rather than leaking errors to users.

## Internal APIs

| Variable | Used for | Notes |
| --- | --- | --- |
| `INTERNAL_API_SECRET` | Protects internal job dispatch and worker-facing routes | Recommended for production |

Use a long random secret and keep it server-only.

## Document storage

### Local storage

| Variable | Used for | Suggested value |
| --- | --- | --- |
| `DOCUMENT_STORAGE_PROVIDER` | Selects storage backend | `local` |
| `DOCUMENT_STORAGE_MODE` | Local visibility mode | `private` |
| `PRIVATE_UPLOAD_DIR` | Local private upload folder | `private-uploads` |

Local/private mode is the safest default for development because health documents should not be public by default.

### S3-compatible storage

| Variable | Used for |
| --- | --- |
| `S3_ENDPOINT` | S3-compatible endpoint |
| `S3_REGION` | Storage region |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` | Access key ID |
| `S3_SECRET_ACCESS_KEY` | Secret access key |
| `S3_FORCE_PATH_STYLE` | Path-style request toggle |
| `S3_PUBLIC_BASE_URL` | Optional public/CDN base URL |
| `DOCUMENT_STORAGE_PREFIX` | Object key prefix |

### Cloudflare R2 aliases

| Variable | Used for |
| --- | --- |
| `R2_ENDPOINT` | R2 endpoint |
| `R2_REGION` | Usually `auto` |
| `R2_BUCKET` | Bucket name |
| `R2_ACCESS_KEY_ID` | Access key ID |
| `R2_SECRET_ACCESS_KEY` | Secret access key |
| `R2_PUBLIC_BASE_URL` | Optional public/custom domain base URL |

The storage layer can use either the S3 names or R2 aliases depending on provider setup.

## Local validation flow

After editing `.env`, run:

```powershell
npm install
npm run db:validate:ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
npm run typecheck
npm run lint
npm run test:run
```

For a running app, also check:

```powershell
npm run dev
```

Then open:

```txt
http://localhost:3000
http://localhost:3000/demo
http://localhost:3000/api/health
```

## Vercel deployment notes

For Vercel or another hosted deployment:

1. Set `DATABASE_URL` to a hosted PostgreSQL database.
2. Set `AUTH_SECRET` to a long random secret.
3. Set `NEXTAUTH_URL`, `APP_URL`, and `NEXT_PUBLIC_APP_URL` to the deployed URL.
4. Keep `AUTH_TRUST_HOST=true`.
5. Set `VITAVAULT_DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true` for portfolio/demo deployments.
6. Add `REDIS_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, and storage credentials only when those integrations are ready.
7. Keep `SKIP_REDIS_DURING_BUILD=1` if build-time Redis checks are not available.

Run database migrations against the intended database before treating authenticated workflows as production-ready:

```powershell
npx prisma migrate deploy
```

## Safety rules

- Never commit `.env`.
- Never put secrets in `NEXT_PUBLIC_*` variables.
- Do not use placeholder values in production.
- Keep document storage private unless there is a deliberate public/CDN workflow.
- Treat `/api/health` output as sanitized status only; it should never expose raw secret values.
