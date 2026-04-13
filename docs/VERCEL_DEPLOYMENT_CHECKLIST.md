# Vercel Deployment Checklist

Use this before every VitaVault deployment.

## Required environment variables

Set these in **Vercel → Project Settings → Environment Variables**.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
AUTH_SECRET="your-long-random-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="https://your-project.vercel.app"
REDIS_URL="redis://HOST:6379"
```

## Optional environment variables

```env
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-5-mini"
WORKER_CONCURRENCY="5"
JOB_DASHBOARD_LIMIT="20"
```

## What each variable is for

- `DATABASE_URL`: Prisma and all database-backed pages/routes.
- `AUTH_SECRET`: Auth.js / NextAuth session signing.
- `AUTH_TRUST_HOST`: lets Auth.js trust the deployment host on Vercel.
- `NEXTAUTH_URL`: keeps callback URLs and absolute auth URLs stable.
- `REDIS_URL`: required by BullMQ jobs, reminders, alerts, and worker-connected features.
- `OPENAI_API_KEY`: enables AI insight features.
- `OPENAI_MODEL`: pins the AI model instead of relying on a fallback.

## Local pre-push checks

Run these before pushing to GitHub:

```bash
npm run typecheck
npm run build
```

## If Vercel fails during build

Check these first:

1. Missing `DATABASE_URL`
2. Missing `AUTH_SECRET`
3. Missing `REDIS_URL`
4. Wrong `NEXTAUTH_URL`
5. Old temporary patch folders still inside the repo

## Recommended Vercel settings

- Framework preset: **Next.js**
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default

## After deployment

Smoke test these pages:

1. Login page
2. Dashboard
3. Appointments
4. Alerts
5. Timeline
6. Jobs page
7. Reminders page
