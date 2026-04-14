# Phase 04I - Review Queue Quick Actions

This patch adds low-risk operational actions directly on the review queue page.

## Added
- Mark complete for reminder items
- Skip for reminder items
- Snooze 30 minutes for reminder items
- Mark resolved for severe symptom items
- Keeps abnormal labs as open-record items only

## Why this phase is safe
- Reuses existing server actions
- No migration
- No Redis or BullMQ dependency
- No shared action export reshuffle
