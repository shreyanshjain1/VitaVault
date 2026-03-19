import { db } from "@/lib/db";

export async function runAlertEvaluation(args: {
  userId: string;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceRecordedAt?: string | null;
  initiatedBy?: string | null;
}) {
  const userExists = await db.user.findUnique({
    where: { id: args.userId },
    select: { id: true },
  });

  if (!userExists) {
    throw new Error("User not found for alert evaluation.");
  }

  return {
    evaluatedRuleCount: 0,
    createdAlertCount: 0,
    createdAlertIds: [] as string[],
  };
}