# Patch 26C — Storage Response Body Fix

Fixes the remaining document download typecheck issue from Patch 26.

## Changes

- Converts Node `Buffer` data into a real `ArrayBuffer` before passing it to `NextResponse`.
- Avoids the `ArrayBuffer | SharedArrayBuffer` type ambiguity caused by `Buffer.buffer`.
- Keeps the document storage abstraction behavior unchanged.
- Requires no Prisma migration.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
