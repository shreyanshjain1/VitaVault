# Patch 57 — Mobile API Contract Consistency Tests

## Summary

This patch strengthens VitaVault's mobile API test coverage by checking that the published SDK examples, OpenAPI export, Postman collection, and server-side Prisma-backed enum values stay aligned.

## Files changed

- `examples/mobile-api/vitavault-mobile-client.ts`
- `tests/mobile-api-sdk-examples.test.ts`
- `tests/mobile-api-contract-export.test.ts`

## Files added

- `docs/PATCH_57_MOBILE_API_CONTRACT_CONSISTENCY_TESTS.md`

## What changed

- Added runtime-safe SDK constants for supported reading types, reading sources, device platforms, and connection statuses.
- Kept SDK platform values limited to the server-backed device platform contract: `ANDROID`, `IOS`, `WEB`, and `OTHER`.
- Added SDK regression coverage to compare exported SDK constants against Prisma enums.
- Added OpenAPI regression coverage to compare schema enum values against Prisma enums and SDK constants.
- Added Postman regression coverage to verify the sync request example only uses valid enum values.
- Updated the contract summary test so endpoint and reading counts are checked against source-of-truth constants instead of hard-coded counts.

## Safety

- No Prisma migration.
- No package changes.
- No README changes.
- No API route changes.
- No app UI changes.
- The patch only strengthens examples and tests around the existing mobile API contract.

## Suggested checks

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

Targeted checks:

```powershell
npm run test:run -- tests/mobile-api-sdk-examples.test.ts tests/mobile-api-contract-export.test.ts
```
