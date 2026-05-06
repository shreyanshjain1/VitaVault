# Patch 39B - Security Test Fix

Fixes Patch 39 test regressions after Security Hardening v2.

## Changes

- Updates the existing security action test to use a password that satisfies the new uppercase password policy.
- Adds the access audit log mock required by the new security audit logging behavior.
- Mocks mobile session revoke count so the revoke-all test matches the updated action contract.
- Hardens session revoke actions against missing/undefined updateMany return values in partial test mocks.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
```
