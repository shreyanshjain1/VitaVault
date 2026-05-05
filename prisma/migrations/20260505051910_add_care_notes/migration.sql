/*
  Warnings:

  - A unique constraint covering the columns `[dedupeKey]` on the table `Reminder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReminderState" AS ENUM ('DUE', 'SENT', 'OVERDUE', 'SKIPPED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "ReminderSourceType" AS ENUM ('MEDICATION_SCHEDULE', 'APPOINTMENT', 'VACCINATION', 'LAB_FOLLOW_UP', 'GENERAL');

-- AlterTable
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
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
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

-- CreateIndex
CREATE INDEX "ReminderAuditLog_userId_createdAt_idx" ON "ReminderAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReminderAuditLog_reminderId_createdAt_idx" ON "ReminderAuditLog"("reminderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_dedupeKey_key" ON "Reminder"("dedupeKey");

-- CreateIndex
CREATE INDEX "Reminder_userId_dueAt_idx" ON "Reminder"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_state_dueAt_idx" ON "Reminder"("userId", "state", "dueAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_type_dueAt_idx" ON "Reminder"("userId", "type", "dueAt");

-- AddForeignKey
ALTER TABLE "ReminderAuditLog" ADD CONSTRAINT "ReminderAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderAuditLog" ADD CONSTRAINT "ReminderAuditLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderAuditLog" ADD CONSTRAINT "ReminderAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
