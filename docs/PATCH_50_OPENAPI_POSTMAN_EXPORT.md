# Patch 50: OpenAPI/Postman Export

Patch 50 adds machine-readable exports for VitaVault's mobile and connected-device API surface.

## Added

- `lib/mobile-api-contract-export.ts`
  - OpenAPI 3.1 contract builder
  - Postman Collection 2.1 builder
  - shared export metadata helpers
- `/api/mobile/openapi`
  - downloads `vitavault-mobile-openapi.json`
- `/api/mobile/postman`
  - downloads `vitavault-mobile-postman-collection.json`
- API docs export cards
- Mobile API documentation for importing generated contracts
- Tests for OpenAPI/Postman contract generation

## Safety

- No Prisma schema changes.
- No migrations.
- No package changes.
- No mobile endpoint behavior changes.
- Exports are generated from existing mobile API contract/security metadata.

## Reviewer value

A reviewer can now import the mobile/device API into Postman, Swagger UI, Insomnia, or an API gateway without reverse-engineering route handlers.
