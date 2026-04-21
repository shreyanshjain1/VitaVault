import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enqueueAlertScheduledScan } from "@/lib/jobs/enqueue";
import {
  authenticateInternalRequest,
  canManageAllAlertScans,
} from "@/lib/internal-api-auth";

export async function POST(request: Request) {
  const actor = await authenticateInternalRequest(request);

  if (!actor.ok) {
    return NextResponse.json(
      { error: "Unauthorized internal request." },
      { status: 401 }
    );
  }

  if (
    actor.kind === "session" &&
    !canManageAllAlertScans(actor.user.role)
  ) {
    return NextResponse.json(
      { error: "Only admins can trigger a full alert scan." },
      { status: 403 }
    );
  }

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
