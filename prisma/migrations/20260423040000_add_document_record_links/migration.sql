-- CreateEnum
CREATE TYPE "DocumentLinkType" AS ENUM ('APPOINTMENT', 'LAB_RESULT', 'DOCTOR');

-- AlterTable
ALTER TABLE "MedicalDocument"
ADD COLUMN     "linkedRecordId" TEXT,
ADD COLUMN     "linkedRecordType" "DocumentLinkType";

-- CreateIndex
CREATE INDEX "MedicalDocument_userId_createdAt_idx" ON "MedicalDocument"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicalDocument_userId_linkedRecordType_linkedRecordId_idx" ON "MedicalDocument"("userId", "linkedRecordType", "linkedRecordId");
