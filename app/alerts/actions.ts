"use server";

import { revalidatePath } from "next/cache";
import { AlertRuleCategory, AlertSeverity, AlertSourceType, AlertStatus, SymptomSeverity, ThresholdOperator } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createAlertAuditLog } from "@/lib/alerts/audit";
import { outboundEmailEnabled, sendAlertDigestEmail } from "@/lib/outbound-email";

function toOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toOptionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function changeAlertStatus(formData: FormData) {
  const user = await requireUser();
  const alertId = String(formData.get("alertId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as AlertStatus;
  const note = toOptionalString(formData.get("note"));

  if (!alertId || !["ACKNOWLEDGED", "RESOLVED", "DISMISSED"].includes(nextStatus)) {
    throw new Error("Invalid alert status request.");
  }

  const now = new Date();

  await db.alertEvent.updateMany({
    where: {
      id: alertId,
      userId: user.id!,
    },
    data: {
      status: nextStatus,
      ownerAcknowledgedAt: nextStatus === "ACKNOWLEDGED" ? now : undefined,
      resolvedAt: nextStatus === "RESOLVED" ? now : undefined,
      dismissedAt: nextStatus === "DISMISSED" ? now : undefined,
    },
  });

  await createAlertAuditLog({
    userId: user.id!,
    alertId,
    actorUserId: user.id!,
    action: `alert.status.${nextStatus.toLowerCase()}`,
    note,
  });

  revalidatePath("/alerts");
  revalidatePath(`/alerts/${alertId}`);
  revalidatePath("/dashboard");
}

export async function createAlertRule(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "VITAL_THRESHOLD") as AlertRuleCategory;
  const severity = String(formData.get("severity") ?? "MEDIUM") as AlertSeverity;
  const sourceTypeValue = toOptionalString(formData.get("sourceType"));
  const thresholdOperatorValue = toOptionalString(formData.get("thresholdOperator"));

  if (!name) throw new Error("Rule name is required.");

  const rule = await db.alertRule.create({
    data: {
      userId: user.id!,
      name,
      description: toOptionalString(formData.get("description")),
      category,
      severity,
      enabled: String(formData.get("enabled") ?? "on") === "on",
      visibleToCareTeam: String(formData.get("visibleToCareTeam") ?? "on") === "on",
      metricKey: toOptionalString(formData.get("metricKey")),
      sourceType: sourceTypeValue ? (sourceTypeValue as AlertSourceType) : null,
      sourceId: toOptionalString(formData.get("sourceId")),
      cooldownMinutes: Number(formData.get("cooldownMinutes") ?? 180),
      lookbackHours: Number(formData.get("lookbackHours") ?? 24),
      thresholdOperator: thresholdOperatorValue ? (thresholdOperatorValue as ThresholdOperator) : null,
      thresholdValue: toOptionalNumber(formData.get("thresholdValue")),
      thresholdValueSecondary: toOptionalNumber(formData.get("thresholdValueSecondary")),
      symptomSeverity: toOptionalString(formData.get("symptomSeverity")) as SymptomSeverity | null,
      medicationMissedCount: toOptionalNumber(formData.get("medicationMissedCount")),
      syncStaleHours: toOptionalNumber(formData.get("syncStaleHours")),
      metadataJson: null,
    },
  });

  await createAlertAuditLog({
    userId: user.id!,
    ruleId: rule.id,
    actorUserId: user.id!,
    action: "alert_rule.created",
  });

  revalidatePath("/alerts");
  revalidatePath("/alerts/rules");
}

export async function updateAlertRule(formData: FormData) {
  const user = await requireUser();
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!ruleId) throw new Error("Rule id is required.");

  const sourceTypeValue = toOptionalString(formData.get("sourceType"));
  const thresholdOperatorValue = toOptionalString(formData.get("thresholdOperator"));

  await db.alertRule.updateMany({
    where: { id: ruleId, userId: user.id! },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: toOptionalString(formData.get("description")),
      category: String(formData.get("category") ?? "VITAL_THRESHOLD") as AlertRuleCategory,
      severity: String(formData.get("severity") ?? "MEDIUM") as AlertSeverity,
      enabled: String(formData.get("enabled") ?? "") === "on",
      visibleToCareTeam: String(formData.get("visibleToCareTeam") ?? "") === "on",
      metricKey: toOptionalString(formData.get("metricKey")),
      sourceType: sourceTypeValue ? (sourceTypeValue as AlertSourceType) : null,
      sourceId: toOptionalString(formData.get("sourceId")),
      cooldownMinutes: Number(formData.get("cooldownMinutes") ?? 180),
      lookbackHours: Number(formData.get("lookbackHours") ?? 24),
      thresholdOperator: thresholdOperatorValue ? (thresholdOperatorValue as ThresholdOperator) : null,
      thresholdValue: toOptionalNumber(formData.get("thresholdValue")),
      thresholdValueSecondary: toOptionalNumber(formData.get("thresholdValueSecondary")),
      symptomSeverity: toOptionalString(formData.get("symptomSeverity")) as SymptomSeverity | null,
      medicationMissedCount: toOptionalNumber(formData.get("medicationMissedCount")),
      syncStaleHours: toOptionalNumber(formData.get("syncStaleHours")),
    },
  });

  await createAlertAuditLog({
    userId: user.id!,
    ruleId,
    actorUserId: user.id!,
    action: "alert_rule.updated",
  });

  revalidatePath("/alerts/rules");
  revalidatePath("/alerts");
}

export async function deleteAlertRule(formData: FormData) {
  const user = await requireUser();
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!ruleId) throw new Error("Rule id is required.");

  await createAlertAuditLog({
    userId: user.id!,
    ruleId,
    actorUserId: user.id!,
    action: "alert_rule.deleted",
  });

  await db.alertRule.deleteMany({
    where: { id: ruleId, userId: user.id! },
  });

  revalidatePath("/alerts/rules");
  revalidatePath("/alerts");
}


export async function sendAlertDigestAction() {
  const user = await requireUser();

  if (!user.email) {
    throw new Error("Your account must have an email address to receive alert digests.");
  }

  if (!outboundEmailEnabled()) {
    throw new Error("Email delivery is not configured.");
  }

  const alerts = await db.alertEvent.findMany({
    where: {
      userId: user.id!,
      status: {
        in: ["OPEN", "ACKNOWLEDGED"],
      },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      message: true,
      severity: true,
      status: true,
      createdAt: true,
    },
  });

  if (!alerts.length) {
    throw new Error("No open or acknowledged alerts found.");
  }

  await sendAlertDigestEmail({
    to: user.email,
    patientName: user.name || user.email,
    alerts,
  });

  await Promise.all(
    alerts.map((alert) =>
      createAlertAuditLog({
        userId: user.id!,
        alertId: alert.id,
        actorUserId: user.id!,
        action: "alert.digest_emailed",
      }),
    ),
  );

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}
