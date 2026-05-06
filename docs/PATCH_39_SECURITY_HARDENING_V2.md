# Patch 39 — Security Hardening v2

## Summary

This patch improves VitaVault's account security posture without adding a new database migration.

## Added

- Stronger password policy helper
- Password rotation validation against the stronger policy
- Security readiness score for `/security`
- Security posture checklist
- Mobile/API session risk labels
- Typed confirmation for sensitive session revocation actions
- Audit log entries for password rotation and token revocation
- In-memory rate limiter for mobile credential login
- Tests for password policy, rate limiting, and security readiness helpers

## Files changed

- `app/security/page.tsx`
- `app/security/actions.ts`
- `app/api/mobile/auth/login/route.ts`
- `lib/security/password-policy.ts`
- `lib/security/rate-limit.ts`
- `lib/security/security-center.ts`
- `tests/security-hardening.test.ts`

## Notes

The rate limiter is intentionally in-memory. It is useful for local and single-instance deployments, while production multi-instance deployments can later replace the storage layer with Redis.

No Prisma migration is required.
