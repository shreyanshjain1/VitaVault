import { NextResponse } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import {
  consumeMobileApiRateLimit,
  getMobileNoStoreHeaders,
  getMobilePayloadTooLargeBody,
  getMobileRateLimitErrorBody,
  getMobileRateLimitHeaders,
  getMobileSecurityPolicy,
  getRetryAfterHeaders,
  isMobileRequestTooLarge,
} from "@/lib/mobile-api-security";
import { mobileDeviceSyncSchema } from "@/lib/mobile-device-api";
import {
  ingestDeviceReadings,
  upsertDeviceConnection,
  type IncomingReading,
} from "@/lib/mobile-readings";

export async function POST(request: Request) {
  const endpoint = "readings:sync" as const;
  const policy = getMobileSecurityPolicy(endpoint);
  const rateLimit = consumeMobileApiRateLimit({ request, endpoint });

  if (!rateLimit.allowed) {
    return NextResponse.json(getMobileRateLimitErrorBody(rateLimit, policy.label.toLowerCase()), {
      status: 429,
      headers: getMobileNoStoreHeaders(getRetryAfterHeaders(rateLimit)),
    });
  }

  if (isMobileRequestTooLarge(request, endpoint)) {
    return NextResponse.json(getMobilePayloadTooLargeBody(endpoint), {
      status: 413,
      headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)),
    });
  }

  const user = await requireMobileUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized mobile session." },
      { status: 401, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  }

  try {
    const body = await request.json();
    const parsed = mobileDeviceSyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid device reading payload.",
          details: parsed.error.flatten(),
        },
        { status: 400, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
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

    return NextResponse.json(
      {
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
      },
      { headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest device readings.";

    return NextResponse.json(
      { error: message },
      { status: 500, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  }
}
