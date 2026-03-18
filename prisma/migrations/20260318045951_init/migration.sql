/*
  Warnings:

  - A unique constraint covering the columns `[externalReadingId]` on the table `VitalRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReadingSource" AS ENUM ('MANUAL', 'ANDROID_HEALTH_CONNECT', 'APPLE_HEALTH', 'FITBIT', 'SMART_BP_MONITOR', 'SMART_SCALE', 'PULSE_OXIMETER', 'OTHER');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS', 'WEB', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceConnectionStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "DeviceReadingType" AS ENUM ('STEPS', 'HEART_RATE', 'WEIGHT', 'BLOOD_PRESSURE', 'OXYGEN_SATURATION', 'BLOOD_GLUCOSE', 'TEMPERATURE');

-- AlterTable
ALTER TABLE "VitalRecord" ADD COLUMN     "externalReadingId" TEXT,
ADD COLUMN     "readingSource" "ReadingSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "DeviceConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ReadingSource" NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "clientDeviceId" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "appVersion" TEXT,
    "status" "DeviceConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopesJson" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceReading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "source" "ReadingSource" NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "readingType" "DeviceReadingType" NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "unit" TEXT,
    "valueInt" INTEGER,
    "valueFloat" DOUBLE PRECISION,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "metadataJson" TEXT,
    "rawPayloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileSessionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileSessionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "source" "ReadingSource" NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "mirroredCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceConnection_userId_source_status_idx" ON "DeviceConnection"("userId", "source", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceConnection_userId_source_clientDeviceId_key" ON "DeviceConnection"("userId", "source", "clientDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceReading_dedupeKey_key" ON "DeviceReading"("dedupeKey");

-- CreateIndex
CREATE INDEX "DeviceReading_userId_capturedAt_idx" ON "DeviceReading"("userId", "capturedAt");

-- CreateIndex
CREATE INDEX "DeviceReading_userId_readingType_capturedAt_idx" ON "DeviceReading"("userId", "readingType", "capturedAt");

-- CreateIndex
CREATE INDEX "DeviceReading_connectionId_capturedAt_idx" ON "DeviceReading"("connectionId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MobileSessionToken_tokenHash_key" ON "MobileSessionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MobileSessionToken_userId_expiresAt_idx" ON "MobileSessionToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "SyncJob_userId_createdAt_idx" ON "SyncJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncJob_connectionId_createdAt_idx" ON "SyncJob"("connectionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VitalRecord_externalReadingId_key" ON "VitalRecord"("externalReadingId");

-- CreateIndex
CREATE INDEX "VitalRecord_userId_recordedAt_idx" ON "VitalRecord"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "VitalRecord_userId_readingSource_idx" ON "VitalRecord"("userId", "readingSource");

-- AddForeignKey
ALTER TABLE "DeviceConnection" ADD CONSTRAINT "DeviceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceReading" ADD CONSTRAINT "DeviceReading_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DeviceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceReading" ADD CONSTRAINT "DeviceReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileSessionToken" ADD CONSTRAINT "MobileSessionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DeviceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
