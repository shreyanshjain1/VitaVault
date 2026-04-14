# Phase 04K – Review Queue Export / Print Layer

This patch adds a print-friendly review queue workflow without touching Redis, Prisma schema, or the shared action surface.

Included:
- Main review queue page gets print/export call-to-actions
- New `/review-queue/print` page for clean handoff exports
- Browser-native print / save-as-PDF support
- Optional auto-print mode via `/review-queue/print?autoprint=1`

Why this phase is safe:
- Reuses existing `getReviewQueueData()`
- No schema migration
- No worker / BullMQ / Redis changes
- No changes to Prisma model shapes
