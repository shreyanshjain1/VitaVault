import { NextResponse } from "next/server";
import { z } from "zod";
import { logAccessAudit } from "@/lib/access";
import { authenticateMobileCredentials, createMobileSessionToken } from "@/lib/mobile-auth";
import {
  consumeMobileApiRateLimit,
  getMobileAuditMetadata,
  getMobileNoStoreHeaders,
  getMobilePayloadTooLargeBody,
  getMobileRateLimitErrorBody,
  getMobileRateLimitHeaders,
  getMobileSecurityPolicy,
  getRetryAfterHeaders,
  isMobileRequestTooLarge,
} from "@/lib/mobile-api-security";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  deviceName: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  const endpoint = "auth:login" as const;
  const policy = getMobileSecurityPolicy(endpoint);

  if (isMobileRequestTooLarge(request, endpoint)) {
    return NextResponse.json(getMobilePayloadTooLargeBody(endpoint), {
      status: 413,
      headers: getMobileNoStoreHeaders(),
    });
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    const emailScope = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "unknown";
    const rateLimit = consumeMobileApiRateLimit({
      request,
      endpoint,
      discriminator: emailScope,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(getMobileRateLimitErrorBody(rateLimit, policy.label.toLowerCase()), {
        status: 429,
        headers: getMobileNoStoreHeaders(getRetryAfterHeaders(rateLimit)),
      });
    }

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid login payload.",
          details: parsed.error.flatten(),
        },
        { status: 400, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
      );
    }

    const user = await authenticateMobileCredentials({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
      );
    }

    const sessionToken = await createMobileSessionToken({
      userId: user.id,
      name: parsed.data.deviceName ?? "Android device",
    });

    await logAccessAudit({
      ownerUserId: user.id,
      actorUserId: user.id,
      action: "mobile_session.created",
      targetType: "MOBILE_SESSION",
      metadata: getMobileAuditMetadata(request, {
        deviceName: parsed.data.deviceName ?? "Android device",
        expiresAt: sessionToken.expiresAt.toISOString(),
      }),
    });

    return NextResponse.json(
      {
        token: sessionToken.token,
        expiresAt: sessionToken.expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to complete mobile login." },
      { status: 500, headers: getMobileNoStoreHeaders() }
    );
  }
}
