# Phase 02A - Action Layer Stabilization

## Goal

Stabilize the shared server action surface before adding more features.

## Problem

`app/actions.ts` became a regression hotspot. Later feature patches replaced the file and removed older exports that were still used by page modules. This caused repeated local typecheck failures and Vercel deployment failures.

## What this phase does

- keeps `app/actions.ts` as the active shared action file
- documents the required export contract
- adds an automated contract check via `npm run actions:check`
- wires that check into the broader local verification flow
- expands TypeScript exclusions for leftover temp files

## What this phase does NOT do

- no domain-splitting refactor yet
- no page import rewrites yet
- no feature additions yet

## Success criteria

- `npm run actions:check` passes
- `npm run typecheck` passes
- `npm run build` passes
- future patches cannot silently remove action exports without being caught locally
