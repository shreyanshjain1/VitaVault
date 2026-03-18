-- CreateEnum
CREATE TYPE "AlertRuleCategory" AS ENUM ('VITAL_THRESHOLD', 'MEDICATION_ADHERENCE', 'SYMPTOM_SEVERITY', 'SYNC_HEALTH');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ThresholdOperator" AS ENUM ('GT', 'GTE', 'LT', 'LTE', 'BETWEEN');

-- CreateEnum
CREATE TYPE "AlertSourceType" AS ENUM ('VITAL_RECORD', 'MEDICATION_LOG', 'SYMPTOM_ENTRY', 'SYNC_JOB', 'DEVICE_READING', 'SCHEDULED_SCAN');

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AlertRuleCategory" NOT NULL,
    "metricKey" TEXT,
    "sourceType" "AlertSourceType",
    "sourceId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "visibleToCareTeam" BOOLEAN NOT NULL DEFAULT true,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 180,
    "lookbackHours" INTEGER NOT NULL DEFAULT 24,
    "thresholdOperator" "ThresholdOperator",
    "thresholdValue" DOUBLE PRECISION,
    "thresholdValueSecondary" DOUBLE PRECISION,
    "symptomSeverity" "SymptomSeverity",
    "medicationMissedCount" INTEGER,
    "syncStaleHours" INTEGER,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "AlertRuleCategory" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "visibleToCareTeam" BOOLEAN NOT NULL DEFAULT true,
    "ownerAcknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "sourceType" "AlertSourceType",
    "sourceId" TEXT,
    "sourceRecordedAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "contextJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "ruleId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertRule_userId_enabled_category_idx" ON "AlertRule"("userId", "enabled", "category");

-- CreateIndex
CREATE INDEX "AlertRule_userId_visibleToCareTeam_idx" ON "AlertRule"("userId", "visibleToCareTeam");

-- CreateIndex
CREATE UNIQUE INDEX "AlertEvent_dedupeKey_key" ON "AlertEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "AlertEvent_userId_status_createdAt_idx" ON "AlertEvent"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AlertEvent_userId_category_createdAt_idx" ON "AlertEvent"("userId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "AlertEvent_ruleId_createdAt_idx" ON "AlertEvent"("ruleId", "createdAt");

-- CreateIndex
CREATE INDEX "AlertEvent_sourceType_sourceId_idx" ON "AlertEvent"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "AlertAuditLog_userId_createdAt_idx" ON "AlertAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AlertAuditLog_alertId_createdAt_idx" ON "AlertAuditLog"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "AlertAuditLog_ruleId_createdAt_idx" ON "AlertAuditLog"("ruleId", "createdAt");

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertAuditLog" ADD CONSTRAINT "AlertAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertAuditLog" ADD CONSTRAINT "AlertAuditLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "AlertEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertAuditLog" ADD CONSTRAINT "AlertAuditLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertAuditLog" ADD CONSTRAINT "AlertAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
