# Patch 01 — Stabilization and Showcase Documentation

## Purpose

Patch 01 focuses on stabilizing repo checks and making the project presentation cleaner before new product features are added.

## Included changes

### 1. Fixed action import checker false positives

Updated `scripts/check-page-action-imports.cjs` so it only parses imports that directly come from `@/app/actions`.

The previous regex could accidentally capture unrelated imports above the actions import, causing false failures for modules such as:

- `date-fns`
- `lucide-react`
- `@/components/app-shell`
- `@/components/common`

### 2. Rebuilt README as a product showcase

The README now focuses on:

- what VitaVault is
- why the project stands out
- product pillars
- actual app routes
- architecture snapshot
- domain model coverage
- screenshots
- current product status
- roadmap direction

It intentionally avoids turning the README into a local setup manual.

### 3. Updated folder structure accuracy

`FOLDER_STRUCTURE.txt` now reflects the current application more accurately and removes the outdated `middleware.ts` reference.

### 4. Added known limitations document

Added `docs/KNOWN_LIMITATIONS.md` to keep future development honest and focused.

## Files changed

- `README.md`
- `FOLDER_STRUCTURE.txt`
- `scripts/check-page-action-imports.cjs`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/PATCH_01_STABILIZATION.md`

## Verification

Run:

```bash
npm run actions:check
npm run actions:imports
npm run actions:shadow
```

Expected result:

```txt
All action and action-import checks should pass.
```

For full local verification, run:

```bash
npm run verify
```

## Suggested PR title

```txt
Fix repo checks and refresh VitaVault showcase documentation
```

## Suggested commit message

```txt
fix: stabilize repo checks and showcase documentation
```
