import { NextResponse } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  const user = await requireMobileUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized mobile session." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}