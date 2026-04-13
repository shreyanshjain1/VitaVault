"use server";

import { revalidatePath } from "next/cache";
import { alertRuleSchema, alertStatusActionSchema } from "@/lib/validations";
import { requireUser } from "@/lib/session";
import { requireOwnerAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { createAlertAuditLog } from "@/lib/alerts/audit";

function boolFromFormData(formData: FormData, name: string, fallback = false) {
  const value = formData.get(name);
  if (value == null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

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
    where: { id: alertId, userId: ownerUserId },
    select: {
      id: true,
      userId: true,
      ruleId: true,
      status: true,
      ownerAcknowledgedAt: true,
    },
  });

  if (!alert) throw new Error("Alert not found.");

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

export async function createAlertRule(formData: FormData) {
  const currentUser = await requireUser();

  const parsed = alertRuleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    metricKey: formData.get("metricKey"),
    enabled: boolFromFormData(formData, "enabled", true),
    severity: formData.get("severity"),
    visibleToCareTeam: boolFromFormData(formData, "visibleToCareTeam", true),
    cooldownMinutes: formData.get("cooldownMinutes") || 180,
    lookbackHours: formData.get("lookbackHours") || 24,
    thresholdOperator: formData.get("thresholdOperator") || undefined,
    thresholdValue: formData.get("thresholdValue") || undefined,
    thresholdValueSecondary: formData.get("thresholdValueSecondary") || undefined,
    symptomSeverity: formData.get("symptomSeverity") || undefined,
    medicationMissedCount: formData.get("medicationMissedCount") || undefined,
    syncStaleHours: formData.get("syncStaleHours") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid alert rule.");
  }

  const data = parsed.data;

  const rule = await db.alertRule.create({
    data: {
      userId: currentUser.id!,
      name: data.name,
      description: data.description || null,
      category: data.category,
      metricKey: data.metricKey || null,
      enabled: data.enabled,
      severity: data.severity,
      visibleToCareTeam: data.visibleToCareTeam,
      cooldownMinutes: data.cooldownMinutes,
      lookbackHours: data.lookbackHours,
      thresholdOperator: data.thresholdOperator ?? null,
      thresholdValue: data.thresholdValue ?? null,
      thresholdValueSecondary: data.thresholdValueSecondary ?? null,
      symptomSeverity: data.symptomSeverity ?? null,
      medicationMissedCount: data.medicationMissedCount ?? null,
      syncStaleHours: data.syncStaleHours ?? null,
    },
  });

  await createAlertAuditLog({
    userId: currentUser.id!,
    ruleId: rule.id,
    actorUserId: currentUser.id!,
    action: "RULE_CREATED",
    metadata: {
      category: rule.category,
      severity: rule.severity,
      enabled: rule.enabled,
    },
  });

  revalidatePath("/alerts");
  revalidatePath("/alerts/rules");
}

export async function updateAlertRule(formData: FormData) {
  const currentUser = await requireUser();
  const ruleId = String(formData.get("ruleId") || "").trim();
  if (!ruleId) throw new Error("Rule ID is required.");

  const existing = await db.alertRule.findFirst({
    where: { id: ruleId, userId: currentUser.id! },
    select: { id: true, category: true, severity: true, enabled: true },
  });
  if (!existing) throw new Error("Alert rule not found.");

  const parsed = alertRuleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    metricKey: formData.get("metricKey"),
    enabled: boolFromFormData(formData, "enabled", true),
    severity: formData.get("severity"),
    visibleToCareTeam: boolFromFormData(formData, "visibleToCareTeam", true),
    cooldownMinutes: formData.get("cooldownMinutes") || 180,
    lookbackHours: formData.get("lookbackHours") || 24,
    thresholdOperator: formData.get("thresholdOperator") || undefined,
    thresholdValue: formData.get("thresholdValue") || undefined,
    thresholdValueSecondary: formData.get("thresholdValueSecondary") || undefined,
    symptomSeverity: formData.get("symptomSeverity") || undefined,
    medicationMissedCount: formData.get("medicationMissedCount") || undefined,
    syncStaleHours: formData.get("syncStaleHours") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid alert rule.");
  }

  const data = parsed.data;

  await db.alertRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      metricKey: data.metricKey || null,
      enabled: data.enabled,
      severity: data.severity,
      visibleToCareTeam: data.visibleToCareTeam,
      cooldownMinutes: data.cooldownMinutes,
      lookbackHours: data.lookbackHours,
      thresholdOperator: data.thresholdOperator ?? null,
      thresholdValue: data.thresholdValue ?? null,
      thresholdValueSecondary: data.thresholdValueSecondary ?? null,
      symptomSeverity: data.symptomSeverity ?? null,
      medicationMissedCount: data.medicationMissedCount ?? null,
      syncStaleHours: data.syncStaleHours ?? null,
    },
  });

  await createAlertAuditLog({
    userId: currentUser.id!,
    ruleId,
    actorUserId: currentUser.id!,
    action: "RULE_UPDATED",
    metadata: {
      previousCategory: existing.category,
      previousSeverity: existing.severity,
      previousEnabled: existing.enabled,
      nextCategory: data.category,
      nextSeverity: data.severity,
      nextEnabled: data.enabled,
    },
  });

  revalidatePath("/alerts");
  revalidatePath("/alerts/rules");
}

export async function deleteAlertRule(formData: FormData) {
  const currentUser = await requireUser();
  const ruleId = String(formData.get("ruleId") || "").trim();
  if (!ruleId) throw new Error("Rule ID is required.");

  const existing = await db.alertRule.findFirst({
    where: { id: ruleId, userId: currentUser.id! },
    select: { id: true, name: true, _count: { select: { events: true } } },
  });
  if (!existing) throw new Error("Alert rule not found.");

  await db.alertRule.delete({ where: { id: ruleId } });

  await createAlertAuditLog({
    userId: currentUser.id!,
    actorUserId: currentUser.id!,
    action: "RULE_DELETED",
    note: existing.name,
    metadata: {
      linkedEvents: existing._count.events,
    },
  });

  revalidatePath("/alerts");
  revalidatePath("/alerts/rules");
}
