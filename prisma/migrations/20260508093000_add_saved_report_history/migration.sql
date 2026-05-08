-- Patch 52: Persist generated Report Builder packets for real report history.
CREATE TYPE "SavedReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'REVIEW', 'SHARED', 'ARCHIVED');

CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "presetId" TEXT,
    "sectionsJson" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "status" "SavedReportStatus" NOT NULL DEFAULT 'GENERATED',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "highRiskAlerts" INTEGER NOT NULL DEFAULT 0,
    "abnormalLabs" INTEGER NOT NULL DEFAULT 0,
    "unresolvedSymptoms" INTEGER NOT NULL DEFAULT 0,
    "careNotesCount" INTEGER NOT NULL DEFAULT 0,
    "documentLinkRate" INTEGER NOT NULL DEFAULT 0,
    "packetHref" TEXT NOT NULL,
    "printHref" TEXT NOT NULL,
    "sourceSummaryJson" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "SavedReport_userId_createdAt_idx" ON "SavedReport"("userId", "createdAt");
CREATE INDEX "SavedReport_userId_status_createdAt_idx" ON "SavedReport"("userId", "status", "createdAt");
CREATE INDEX "SavedReport_userId_archivedAt_createdAt_idx" ON "SavedReport"("userId", "archivedAt", "createdAt");
