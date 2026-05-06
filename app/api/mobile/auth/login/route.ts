import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateMobileCredentials, createMobileSessionToken } from "@/lib/mobile-auth";
import { consumeRateLimit, getClientRateLimitKey } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  deviceName: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    const emailScope = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "unknown";
    const rateLimit = consumeRateLimit({
      key: getClientRateLimitKey(request, `mobile-login:${emailScope}`),
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many mobile login attempts. Try again later.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid login payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const user = await authenticateMobileCredentials({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const sessionToken = await createMobileSessionToken({
      userId: user.id,
      name: parsed.data.deviceName ?? "Android device",
    });

    return NextResponse.json({
      token: sessionToken.token,
      expiresAt: sessionToken.expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete mobile login." },
      { status: 500 }
    );
  }
}
