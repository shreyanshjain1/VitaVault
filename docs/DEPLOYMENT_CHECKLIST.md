# VitaVault Deployment Checklist

This checklist is for preparing VitaVault for a production-style deployment on Vercel or a similar Node.js host.

## Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection used by Prisma and all record modules. |
| `AUTH_SECRET` | Auth.js secret used for session signing and encryption. |
| `NEXTAUTH_URL` | Canonical public URL for auth callbacks and redirects. |
| `APP_URL` | Base app URL used by emails, links, and workflows. |

## Recommended environment variables

| Variable | Purpose |
|---|---|
| `REDIS_URL` | BullMQ workers, alerts, reminders, and job dispatch workflows. |
| `INTERNAL_API_SECRET` | Protection for internal job/dispatch routes. |
| `RESEND_API_KEY` | Outbound email delivery for invites and verification. |
| `RESEND_FROM_EMAIL` | Verified sender identity for outbound email workflows. |
| `OPENAI_API_KEY` | AI insight generation. |
| `DOCUMENT_STORAGE_PROVIDER` | Document binary provider. Use `local`, `s3`, or `r2`. |
| `DOCUMENT_STORAGE_MODE` | Local provider visibility mode: `private` or `public`. |
| `PRIVATE_UPLOAD_DIR` | Private local document upload directory. |

## Cloud document storage variables

Use these when `DOCUMENT_STORAGE_PROVIDER=s3` or `DOCUMENT_STORAGE_PROVIDER=r2`.

| Variable | Purpose |
|---|---|
| `S3_ENDPOINT` / `R2_ENDPOINT` | Object storage endpoint URL. |
| `S3_REGION` / `R2_REGION` | Signing region. Use `auto` for Cloudflare R2. |
| `S3_BUCKET` / `R2_BUCKET` | Bucket name for medical document binaries. |
| `S3_ACCESS_KEY_ID` / `R2_ACCESS_KEY_ID` | Storage access key. |
| `S3_SECRET_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY` | Storage secret key. |
| `S3_FORCE_PATH_STYLE` | Use path-style URLs. Usually `true` for S3-compatible providers. |
| `DOCUMENT_STORAGE_PREFIX` | Folder/prefix for stored medical documents. |

## Local checks

Run these before creating a PR or deploying:

```bash
npm run env:check
npm run deploy:check
```

`npm run deploy:check` runs Prisma validation, TypeScript, ESLint, and Vitest.

## Runtime health check

After starting the app, open:

```txt
/api/health
```

Or run:

```bash
npm run health:local
```

The health endpoint checks deployment readiness, database connectivity, Redis config presence, email config presence, AI config presence, and document storage configuration without exposing secrets.

## Vercel notes

1. Add all required environment variables in Vercel project settings.
2. Use a hosted PostgreSQL database, not local Docker, for deployed builds.
3. Keep `AUTH_TRUST_HOST=true` for Vercel-hosted Auth.js flows.
4. Use a hosted Redis provider for worker-backed flows.
5. Deploy the worker separately if queue processing is required outside the web runtime.
6. Configure email sender/domain verification before enabling email verification in production.
7. Use `DOCUMENT_STORAGE_PROVIDER=s3` or `DOCUMENT_STORAGE_PROVIDER=r2` before accepting real medical documents in a hosted deployment.

## Worker deployment notes

The web app can deploy without a running worker, but queue-backed features will not process automatically unless a worker is running.

Recommended worker command:

```bash
npm run worker
```

For production, run this on a background-worker-capable host such as Railway, Render, Fly.io, a VPS, or another long-running Node process platform.

## Document storage notes

The local provider is useful for development and demos. Production deployments should use durable object storage such as AWS S3, Cloudflare R2, Supabase Storage, Azure Blob Storage, or Google Cloud Storage.

Patch 32 adds an S3-compatible provider, so Cloudflare R2 and most S3-compatible object stores can be used without adding another dependency.
