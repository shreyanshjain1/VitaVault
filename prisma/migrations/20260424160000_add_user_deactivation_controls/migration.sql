ALTER TABLE "User"
  ADD COLUMN "deactivatedAt" TIMESTAMP(3),
  ADD COLUMN "deactivatedReason" TEXT;
