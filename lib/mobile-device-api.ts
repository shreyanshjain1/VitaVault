import {
  DevicePlatform,
  DeviceReadingType,
  ReadingSource,
} from "@prisma/client";
import { z } from "zod";

export const SUPPORTED_DEVICE_READINGS = [
  {
    type: DeviceReadingType.HEART_RATE,
    requiredValue: "valueInt",
    behavior: "Mirrors into heartRate",
  },
  {
    type: DeviceReadingType.BLOOD_PRESSURE,
    requiredValue: "systolic + diastolic",
    behavior: "Mirrors into systolic/diastolic",
  },
  {
    type: DeviceReadingType.OXYGEN_SATURATION,
    requiredValue: "valueInt",
    behavior: "Mirrors into oxygenSaturation",
  },
  {
    type: DeviceReadingType.WEIGHT,
    requiredValue: "valueFloat",
    behavior: "Mirrors into weightKg",
  },
  {
    type: DeviceReadingType.BLOOD_GLUCOSE,
    requiredValue: "valueFloat",
    behavior: "Mirrors into bloodSugar",
  },
  {
    type: DeviceReadingType.TEMPERATURE,
    requiredValue: "valueFloat",
    behavior: "Mirrors into temperatureC",
  },
  {
    type: DeviceReadingType.STEPS,
    requiredValue: "valueInt",
    behavior: "Stored as device reading only",
  },
] as const;

export const SUPPORTED_DEVICE_READING_TYPES = SUPPORTED_DEVICE_READINGS.map(
  (reading) => reading.type
);

export const MOBILE_DEVICE_ENDPOINTS = [
  {
    method: "POST",
    path: "/api/mobile/auth/login",
    auth: "Public credentials",
    purpose: "Validate email/password and issue a mobile bearer token.",
  },
  {
    method: "GET",
    path: "/api/mobile/auth/me",
    auth: "Bearer token",
    purpose: "Validate current mobile session and return the mobile user.",
  },
  {
    method: "POST",
    path: "/api/mobile/auth/logout",
    auth: "Bearer token",
    purpose: "Revoke the active mobile bearer token.",
  },
  {
    method: "GET",
    path: "/api/mobile/connections",
    auth: "Bearer token",
    purpose: "List device connections, platform, source, status, sync time, and error state.",
  },
  {
    method: "POST",
    path: "/api/mobile/device-readings",
    auth: "Bearer token",
    purpose: "Upsert the device connection, persist raw readings, create a sync job, and mirror supported vitals.",
  },
] as const;

function isValidDateTime(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

const metadataSchema = z.record(z.unknown());

export const mobileDeviceReadingSchema = z
  .object({
    readingType: z.nativeEnum(DeviceReadingType),
    capturedAt: z.string().trim().min(1, "capturedAt is required."),
    clientReadingId: z.string().trim().min(1).max(191).optional(),
    unit: z.string().trim().max(40).optional(),
    valueInt: z.number().int().optional(),
    valueFloat: z.number().optional(),
    systolic: z.number().int().optional(),
    diastolic: z.number().int().optional(),
    metadata: metadataSchema.optional(),
    rawPayload: metadataSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!isValidDateTime(value.capturedAt)) {
      ctx.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "capturedAt must be a valid ISO date/time value.",
      });
    }

    if (value.readingType === DeviceReadingType.BLOOD_PRESSURE) {
      if (value.systolic == null || value.diastolic == null) {
        ctx.addIssue({
          code: "custom",
          message: "Blood pressure readings require systolic and diastolic values.",
        });
      }
      return;
    }

    if (
      value.readingType === DeviceReadingType.HEART_RATE ||
      value.readingType === DeviceReadingType.OXYGEN_SATURATION ||
      value.readingType === DeviceReadingType.STEPS
    ) {
      if (value.valueInt == null) {
        ctx.addIssue({
          code: "custom",
          path: ["valueInt"],
          message: `${value.readingType} requires valueInt.`,
        });
      }
      return;
    }

    if (
      value.readingType === DeviceReadingType.WEIGHT ||
      value.readingType === DeviceReadingType.BLOOD_GLUCOSE ||
      value.readingType === DeviceReadingType.TEMPERATURE
    ) {
      if (value.valueFloat == null) {
        ctx.addIssue({
          code: "custom",
          path: ["valueFloat"],
          message: `${value.readingType} requires valueFloat.`,
        });
      }
    }
  });

export const mobileDeviceSyncSchema = z.object({
  source: z.nativeEnum(ReadingSource),
  platform: z.nativeEnum(DevicePlatform),
  clientDeviceId: z.string().trim().min(1).max(191),
  deviceLabel: z.string().trim().max(191).optional(),
  appVersion: z.string().trim().max(60).optional(),
  scopes: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  syncMetadata: metadataSchema.optional(),
  readings: z.array(mobileDeviceReadingSchema).min(1).max(500),
});

export type MobileDeviceSyncPayload = z.infer<typeof mobileDeviceSyncSchema>;
