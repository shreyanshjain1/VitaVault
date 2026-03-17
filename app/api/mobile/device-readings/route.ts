import { NextResponse } from "next/server";
import {
  DevicePlatform,
  DeviceReadingType,
  ReadingSource,
} from "@prisma/client";
import { z } from "zod";
import { requireMobileUser } from "@/lib/mobile-auth";
import {
  ingestDeviceReadings,
  upsertDeviceConnection,
  type IncomingReading,
} from "@/lib/mobile-readings";

const readingSchema = z
  .object({
    readingType: z.nativeEnum(DeviceReadingType),
    capturedAt: z.string().min(1),
    clientReadingId: z.string().trim().min(1).max(191).optional(),
    unit: z.string().trim().max(40).optional(),
    valueInt: z.number().int().optional(),
    valueFloat: z.number().optional(),
    systolic: z.number().int().optional(),
    diastolic: z.number().int().optional(),
    metadata: z.any().optional(),
    rawPayload: z.any().optional(),
  })
  .superRefine((value, ctx) => {
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
          message: `${value.readingType} requires valueFloat.`,
        });
      }
    }
  });

const syncSchema = z.object({
  source: z.nativeEnum(ReadingSource),
  platform: z.nativeEnum(DevicePlatform),
  clientDeviceId: z.string().trim().min(1).max(191),
  deviceLabel: z.string().trim().max(191).optional(),
  appVersion: z.string().trim().max(60).optional(),
  scopes: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  syncMetadata: z.any().optional(),
  readings: z.array(readingSchema).min(1).max(500),
});

export async function POST(request: Request) {
  const user = await requireMobileUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized mobile session." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid device reading payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const readings: IncomingReading[] = parsed.data.readings.map((reading) => ({
      readingType: reading.readingType,
      capturedAt: reading.capturedAt,
      clientReadingId: reading.clientReadingId ?? null,
      unit: reading.unit ?? null,
      valueInt: reading.valueInt ?? null,
      valueFloat: reading.valueFloat ?? null,
      systolic: reading.systolic ?? null,
      diastolic: reading.diastolic ?? null,
      metadata:
        reading.metadata && typeof reading.metadata === "object"
          ? (reading.metadata as Record<string, unknown>)
          : null,
      rawPayload:
        reading.rawPayload && typeof reading.rawPayload === "object"
          ? (reading.rawPayload as Record<string, unknown>)
          : null,
    }));

    const syncMetadata =
      parsed.data.syncMetadata && typeof parsed.data.syncMetadata === "object"
        ? (parsed.data.syncMetadata as Record<string, unknown>)
        : null;

    const connection = await upsertDeviceConnection({
      userId: user.id,
      source: parsed.data.source,
      platform: parsed.data.platform,
      clientDeviceId: parsed.data.clientDeviceId,
      deviceLabel: parsed.data.deviceLabel ?? null,
      appVersion: parsed.data.appVersion ?? null,
      scopes: parsed.data.scopes ?? null,
    });

    const result = await ingestDeviceReadings({
      userId: user.id,
      source: parsed.data.source,
      platform: parsed.data.platform,
      connectionId: connection.id,
      clientDeviceId: parsed.data.clientDeviceId,
      readings,
      syncMetadata,
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        source: connection.source,
        platform: connection.platform,
        clientDeviceId: connection.clientDeviceId,
        deviceLabel: connection.deviceLabel,
        status: connection.status,
      },
      sync: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest device readings.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}