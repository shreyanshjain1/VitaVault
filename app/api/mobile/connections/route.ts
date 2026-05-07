import { NextResponse } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import {
  consumeMobileApiRateLimit,
  getMobileNoStoreHeaders,
  getMobileRateLimitErrorBody,
  getMobileRateLimitHeaders,
  getMobileSecurityPolicy,
  getRetryAfterHeaders,
} from "@/lib/mobile-api-security";

export async function GET(request: Request) {
  const endpoint = "connections:list" as const;
  const policy = getMobileSecurityPolicy(endpoint);
  const rateLimit = consumeMobileApiRateLimit({ request, endpoint });

  if (!rateLimit.allowed) {
    return NextResponse.json(getMobileRateLimitErrorBody(rateLimit, policy.label.toLowerCase()), {
      status: 429,
      headers: getMobileNoStoreHeaders(getRetryAfterHeaders(rateLimit)),
    });
  }

  const user = await requireMobileUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized mobile session." },
      { status: 401, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  }

  const connections = await db.deviceConnection.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      source: true,
      platform: true,
      clientDeviceId: true,
      deviceLabel: true,
      appVersion: true,
      status: true,
      lastSyncedAt: true,
      lastError: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    { connections },
    { headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
  );
}
