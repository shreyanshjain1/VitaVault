# Phase 04H — Record deep-linking and focus highlighting

This patch makes timeline and review queue items open the exact target record context instead of just landing on the destination module.

## Included
- Deep links with `?focus=<id>#item-<id>` for timeline items
- Deep links with `?focus=<id>#item-<id>` for review queue items
- Focus styling on target module cards for:
  - appointments
  - labs
  - vitals
  - symptoms
  - vaccinations
  - documents
  - reminders
- Small shared helper for building record links and applying focus-card styling

## Why this phase is safe
- No migration
- No Redis / BullMQ dependency
- No change to server action contracts
- Read-only navigation enhancement
