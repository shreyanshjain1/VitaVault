import { NextResponse } from "next/server";
import { enqueueAlertEvaluation } from "@/lib/jobs/enqueue";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (!body?.userId) {
    return NextResponse.json(
      { error: "userId is required." },
      { status: 400 }
    );
  }

  const result = await enqueueAlertEvaluation({
    userId: body.userId,
    sourceType: body.sourceType ?? null,
    sourceId: body.sourceId ?? null,
    sourceRecordedAt: body.sourceRecordedAt ?? null,
    initiatedBy: body.initiatedBy ?? "manual_scan",
  });

  return NextResponse.json({ ok: true, ...result });
}
