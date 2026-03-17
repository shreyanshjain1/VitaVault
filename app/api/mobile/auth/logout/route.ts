import { NextResponse } from "next/server";
import { getBearerTokenFromRequest, revokeMobileToken } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const token = getBearerTokenFromRequest(request);

    if (token) {
      await revokeMobileToken(token);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to revoke mobile session." },
      { status: 500 }
    );
  }
}