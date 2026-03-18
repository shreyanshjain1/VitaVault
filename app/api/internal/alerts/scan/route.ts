import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enqueueAlertScheduledScan } from "@/lib/jobs/enqueue";

export async function POST() {
  const users = await db.user.findMany({
    select: { id: true },
  });

  const queued = await Promise.all(
    users.map((user) => enqueueAlertScheduledScan(user.id))
  );

  return NextResponse.json({
    ok: true,
    queued: queued.length,
  });
}
