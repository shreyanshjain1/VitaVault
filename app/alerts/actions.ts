"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { alertStatusActionSchema } from "@/lib/validations";
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
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid alert status change.");
  }

  const { alertId, status, note, ownerUserId } = parsed.data;

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
    },
  });

  if (!alert) {
    throw new Error("Alert not found.");
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (status === "ACKNOWLEDGED") {
    updateData.ownerAcknowledgedAt = now;
  }
  if (status === "RESOLVED") {
    updateData.resolvedAt = now;
  }
  if (status === "DISMISSED") {
    updateData.dismissedAt = now;
  }

  await db.alertEvent.update({
    where: { id: alert.id },
    data: updateData,
  });

  await createAlertAuditLog({
    userId: alert.userId,
    alertId: alert.id,
    ruleId: alert.ruleId,
    actorUserId: currentUser.id,
    action: `STATUS_CHANGED_TO_${status}`,
    note: note || null,
    metadataJson: JSON.stringify({
      previousStatus: alert.status,
      nextStatus: status,
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/alerts");
  revalidatePath(`/alerts/${alert.id}`);
}
