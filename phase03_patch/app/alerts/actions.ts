"use server";

import { revalidatePath } from "next/cache";
import { alertStatusActionSchema } from "@/lib/validations";
import { requireUser } from "@/lib/session";
import { requireOwnerAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { createAlertAuditLog } from "@/lib/alerts/audit";

export async function changeAlertStatus(formData: FormData) {
  const currentUser = await requireUser();

  const parsed = alertStatusActionSchema.safeParse({
    alertId: formData.get("alertId"),
    status: formData.get("status"),
    note: formData.get("note"),
    ownerUserId: formData.get("ownerUserId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid alert action.");
  }

  const { alertId, ownerUserId, status, note } = parsed.data;

  await requireOwnerAccess(currentUser.id!, ownerUserId, "alerts");

  const alert = await db.alertEvent.findFirst({
    where: {
      id: alertId,
      userId: ownerUserId,
    },
    select: {
      id: true,
      userId: true,
      ruleId: true,
      status: true,
      ownerAcknowledgedAt: true,
    },
  });

  if (!alert) {
    throw new Error("Alert not found.");
  }

  const now = new Date();

  await db.alertEvent.update({
    where: { id: alert.id },
    data: {
      status,
      ownerAcknowledgedAt:
        status === "ACKNOWLEDGED"
          ? alert.ownerAcknowledgedAt ?? now
          : status === "RESOLVED" && !alert.ownerAcknowledgedAt
          ? now
          : alert.ownerAcknowledgedAt,
      resolvedAt: status === "RESOLVED" ? now : null,
      dismissedAt: status === "DISMISSED" ? now : null,
    },
  });

  await createAlertAuditLog({
    userId: ownerUserId,
    alertId: alert.id,
    ruleId: alert.ruleId ?? null,
    actorUserId: currentUser.id!,
    action: `STATUS_CHANGED_TO_${status}`,
    note,
    metadata: {
      previousStatus: alert.status,
      nextStatus: status,
    },
  });

  revalidatePath("/alerts");
  revalidatePath(`/alerts/${alert.id}`);
  revalidatePath("/dashboard");
}
