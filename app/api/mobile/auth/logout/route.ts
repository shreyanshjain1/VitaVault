import { NextResponse } from "next/server";
import { logAccessAudit } from "@/lib/access";
import { getBearerTokenFromRequest, requireMobileUser, revokeMobileToken } from "@/lib/mobile-auth";
import {
  consumeMobileApiRateLimit,
  fingerprintBearerToken,
  getMobileAuditMetadata,
  getMobileNoStoreHeaders,
  getMobileRateLimitErrorBody,
  getMobileRateLimitHeaders,
  getMobileSecurityPolicy,
  getRetryAfterHeaders,
} from "@/lib/mobile-api-security";

export async function POST(request: Request) {
  const endpoint = "auth:logout" as const;
  const policy = getMobileSecurityPolicy(endpoint);
  const rateLimit = consumeMobileApiRateLimit({ request, endpoint });

  if (!rateLimit.allowed) {
    return NextResponse.json(getMobileRateLimitErrorBody(rateLimit, policy.label.toLowerCase()), {
      status: 429,
      headers: getMobileNoStoreHeaders(getRetryAfterHeaders(rateLimit)),
    });
  }

  try {
    const token = getBearerTokenFromRequest(request);
    const user = await requireMobileUser(request);

    if (!token || !user) {
      return NextResponse.json(
        { error: "Unauthorized mobile session." },
        { status: 401, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
      );
    }

    await revokeMobileToken(token);

    await logAccessAudit({
      ownerUserId: user.id,
      actorUserId: user.id,
      action: "mobile_session.revoked",
      targetType: "MOBILE_SESSION",
      metadata: getMobileAuditMetadata(request, {
        tokenFingerprint: fingerprintBearerToken(token),
        source: "mobile_logout",
      }),
    });

    return NextResponse.json(
      { success: true },
      { headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to revoke mobile session." },
      { status: 500, headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
    );
  }
}
