import { db } from "@/lib/db";

export async function createAlertAuditLog(args: {
  userId: string;
  alertId?: string | null;
  ruleId?: string | null;
  actorUserId?: string | null;
  action: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return db.alertAuditLog.create({
    data: {
      userId: args.userId,
      alertId: args.alertId ?? null,
      ruleId: args.ruleId ?? null,
      actorUserId: args.actorUserId ?? null,
      action: args.action,
      note: args.note?.trim() || null,
      metadataJson: args.metadata ? JSON.stringify(args.metadata) : null,
    },
  });
}
