import { NextResponse } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import {
  consumeMobileApiRateLimit,
  getMobileNoStoreHeaders,
  getMobileRateLimitErrorBody,
  getMobileRateLimitHeaders,
  getMobileSecurityPolicy,
  getRetryAfterHeaders,
} from "@/lib/mobile-api-security";

export async function GET(request: Request) {
  const endpoint = "auth:me" as const;
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

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
    { headers: getMobileNoStoreHeaders(getMobileRateLimitHeaders(rateLimit)) }
  );
}
