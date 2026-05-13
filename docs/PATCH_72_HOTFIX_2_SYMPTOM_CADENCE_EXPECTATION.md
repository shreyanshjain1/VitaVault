# Patch 72 Hotfix 2 — Symptom Cadence Test Expectation

This hotfix updates the final symptom review regression test to match the product-facing cadence label returned by the helper.

## Fix

- Keeps the helper behavior from Patch 72 intact.
- Updates the grouped card expectation from the older raw span label to the newer cadence label: `About every 13 days`.

## Safety

- No Prisma migration.
- No package changes.
- No README changes.
- Test-only update.
