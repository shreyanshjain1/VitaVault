import { NextResponse } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await requireMobileUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized mobile session." },
      { status: 401 }
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

  return NextResponse.json({ connections });
}