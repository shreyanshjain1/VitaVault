Phase 04J - Review queue follow-up notes and handoff workflow

What this patch adds
- Reminder quick actions in the review queue: complete, skip, snooze 30 minutes
- Reminder follow-up notes stored in ReminderAuditLog with action review.note
- Severe symptom quick action to mark resolved
- Severe symptom follow-up notes appended safely into the symptom notes field with a review stamp
- Follow-up appointment draft creation from severe symptom queue items

Why this phase is safe
- No schema migration
- No Redis or BullMQ dependency
- No shared action-layer rewrite
- Uses existing Prisma models and existing actions where possible
