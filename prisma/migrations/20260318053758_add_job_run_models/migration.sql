-- CreateEnum
CREATE TYPE "JobKind" AS ENUM ('ALERT_EVALUATION', 'REMINDER_GENERATION', 'DAILY_HEALTH_SUMMARY', 'DEVICE_SYNC_PROCESSING');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobKind" "JobKind" NOT NULL,
    "bullmqJobId" TEXT,
    "status" "JobRunStatus" NOT NULL DEFAULT 'QUEUED',
    "userId" TEXT,
    "connectionId" TEXT,
    "syncJobId" TEXT,
    "inputJson" TEXT,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "attemptsMade" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRunLog" (
    "id" TEXT NOT NULL,
    "jobRunId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contextJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobRun_bullmqJobId_key" ON "JobRun"("bullmqJobId");

-- CreateIndex
CREATE INDEX "JobRun_jobKind_createdAt_idx" ON "JobRun"("jobKind", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_status_createdAt_idx" ON "JobRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_userId_createdAt_idx" ON "JobRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_connectionId_createdAt_idx" ON "JobRun"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_syncJobId_createdAt_idx" ON "JobRun"("syncJobId", "createdAt");

-- CreateIndex
CREATE INDEX "JobRunLog_jobRunId_createdAt_idx" ON "JobRunLog"("jobRunId", "createdAt");

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DeviceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "SyncJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRunLog" ADD CONSTRAINT "JobRunLog_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
