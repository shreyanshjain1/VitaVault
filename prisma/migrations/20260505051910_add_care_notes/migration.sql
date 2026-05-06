/*
  Patch 41 migration safety hotfix

  This migration upgrades reminders with lifecycle fields, channel/source enums,
  a dedupe key, and audit logging.

  Safety notes:
  - `Reminder.updatedAt` is added with `DEFAULT CURRENT_TIMESTAMP` so existing
    Reminder rows can migrate successfully.
  - The enum creation statements use guarded DO blocks so a partially attempted
    local migration can be retried without failing on already-created enum types.
  - The `Reminder_dedupeKey_key` unique index remains safe for nullable values
    in PostgreSQL. If a local database was manually populated with duplicate
    non-null dedupe keys before this migration, clean those duplicates before
    rerunning Prisma migrate.
*/

DO $$ BEGIN
  CREATE TYPE "ReminderState" AS ENUM ('DUE', 'SENT', 'OVERDUE', 'SKIPPED', 'COMPLETED', 'MISSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReminderChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReminderSourceType" AS ENUM ('MEDICATION_SCHEDULE', 'APPOINTMENT', 'VACCINATION', 'LAB_FOLLOW_UP', 'GENERAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Reminder" ADD COLUMN     "channel" "ReminderChannel" NOT NULL DEFAULT 'IN_APP',
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "missedAt" TIMESTAMP(3),
ADD COLUMN     "overdueAt" TIMESTAMP(3),
ADD COLUMN     "quietHoursEnd" TEXT,
ADD COLUMN     "quietHoursStart" TEXT,
ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "skippedAt" TIMESTAMP(3),
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" "ReminderSourceType",
ADD COLUMN     "state" "ReminderState" NOT NULL DEFAULT 'DUE',
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "ReminderAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReminderAuditLog_userId_createdAt_idx" ON "ReminderAuditLog"("userId", "createdAt");

CREATE INDEX "ReminderAuditLog_reminderId_createdAt_idx" ON "ReminderAuditLog"("reminderId", "createdAt");

CREATE UNIQUE INDEX "Reminder_dedupeKey_key" ON "Reminder"("dedupeKey");

CREATE INDEX "Reminder_userId_dueAt_idx" ON "Reminder"("userId", "dueAt");

CREATE INDEX "Reminder_userId_state_dueAt_idx" ON "Reminder"("userId", "state", "dueAt");

CREATE INDEX "Reminder_userId_type_dueAt_idx" ON "Reminder"("userId", "type", "dueAt");

ALTER TABLE "ReminderAuditLog" ADD CONSTRAINT "ReminderAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderAuditLog" ADD CONSTRAINT "ReminderAuditLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderAuditLog" ADD CONSTRAINT "ReminderAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
