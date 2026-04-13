# Phase 01C — Repository Hygiene Hardening

## Goal
Reduce accidental regressions caused by temporary patch folders, merge leftovers, and stray temp files.

## What this phase changes
- adds `npm run repo:check`
- adds `npm run verify`
- expands TypeScript excludes for patch/temp leftovers
- expands `.gitignore` for temporary patch and merge files

## Why this matters
Recent failures were amplified by:
- checked-in patch folders such as `phase03_patch/`
- stray temp files like `*.tmp`
- later copy-paste phases replacing working files with mixed patch states

This phase makes those mistakes easier to catch before build/push.

## Commands
```bash
npm run repo:check
npm run verify
```

## Manual cleanup required
This patch cannot delete files from your existing repo automatically.

Delete these from your working tree if they still exist:
- `phase03_patch/`
- `app/medications-page.tsx.tmp`

Then run:
```bash
npm run repo:check
npm run typecheck
npm run build
```
