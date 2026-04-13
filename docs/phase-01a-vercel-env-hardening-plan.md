# Phase 01A — Vercel Environment Hardening

This patch is intentionally limited to deployment-environment safety.

## Goals

- fail early with a clear message when required environment variables are missing
- make local and Vercel environment requirements explicit
- reduce ambiguous Vercel build failures
- avoid touching deeper app behavior in this phase

## Changes included

- added `scripts/verify-env.cjs`
- added `npm run env:check`
- updated `npm run build` to run environment validation before Prisma + Next.js build
- expanded deployment guidance in `docs/VERCEL_DEPLOYMENT_CHECKLIST.md`
- expanded `.env.example`

## Variables treated as required

- `DATABASE_URL`
- `AUTH_SECRET`
- `REDIS_URL` in production / Vercel

## Variables treated as recommended warnings

- `NEXTAUTH_URL`
- `AUTH_TRUST_HOST`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Why this comes first

The app already contains Prisma, Auth.js, Redis, and BullMQ dependencies. If those environment variables are missing, deployment can fail before feature-level issues even matter.
