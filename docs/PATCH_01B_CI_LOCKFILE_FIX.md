# Patch 01B - CI Lockfile Fix

This hotfix resolves the GitHub Actions `npm ci` failure caused by `package.json` and `package-lock.json` being out of sync.

## Problem

GitHub Actions failed during dependency installation with:

```txt
npm ci can only install packages when your package.json and package-lock.json are in sync.
Missing: @emnapi/runtime@1.10.0 from lock file
Missing: @emnapi/core@1.10.0 from lock file
```

## Fix

This patch includes the synchronized dependency files:

- `package.json`
- `package-lock.json`

The lockfile now includes the dependency entries required by the current `package.json`, including:

- `@emnapi/core`
- `@emnapi/runtime`

## Why this matters

`npm ci` is strict by design and is the correct command for CI. It fails whenever the lockfile does not exactly match the dependency manifest. This patch keeps the clean-install workflow intact instead of weakening CI.

## Validation

After applying this patch, run:

```bash
npm ci
npm run actions:check
npm run actions:imports
npm run actions:shadow
```

Then continue with the normal CI checks.
