import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateMobileCredentials, createMobileSessionToken } from "@/lib/mobile-auth";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  deviceName: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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