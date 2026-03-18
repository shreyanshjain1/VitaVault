import { db } from "@/lib/db";

export async function createAlertAuditLog(args: {
  userId: string;
  actorUserId?: string | null;
  alertId?: string | null;
  ruleId?: string | null;
  action: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return db.alertAuditLog.create({
    data: {
      userId: args.userId,
      actorUserId: args.actorUserId ?? null,
      alertId: args.alertId ?? null,
      ruleId: args.ruleId ?? null,
      action: args.action,
      note: args.note ?? null,
      metadataJson: args.metadata ? JSON.stringify(args.metadata) : null,
    },
  });
}
