-- Patch 36: Care Team Notes / Collaboration Layer
CREATE TYPE "CareNoteCategory" AS ENUM ('GENERAL', 'MEDICATION', 'LAB', 'SYMPTOM', 'APPOINTMENT', 'CARE_PLAN', 'FAMILY', 'ADMINISTRATIVE');
CREATE TYPE "CareNotePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "CareNoteVisibility" AS ENUM ('PRIVATE', 'CARE_TEAM', 'PROVIDERS');

CREATE TABLE "CareNote" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "category" "CareNoteCategory" NOT NULL DEFAULT 'GENERAL',
  "priority" "CareNotePriority" NOT NULL DEFAULT 'NORMAL',
  "visibility" "CareNoteVisibility" NOT NULL DEFAULT 'CARE_TEAM',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CareNote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CareNote" ADD CONSTRAINT "CareNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareNote" ADD CONSTRAINT "CareNote_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CareNote_ownerUserId_pinned_priority_createdAt_idx" ON "CareNote"("ownerUserId", "pinned", "priority", "createdAt");
CREATE INDEX "CareNote_ownerUserId_category_createdAt_idx" ON "CareNote"("ownerUserId", "category", "createdAt");
CREATE INDEX "CareNote_authorUserId_createdAt_idx" ON "CareNote"("authorUserId", "createdAt");
