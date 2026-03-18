import { AlertStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createAlertAuditLog } from "@/lib/alerts/audit";
import type { AlertEvaluationTrigger, AlertMatchResult } from "@/lib/alerts/types";
import { evaluateAlertRules } from "@/lib/alerts/evaluate";

async function isSuppressedByCooldown(match: AlertMatchResult) {
  const since = new Date(Date.now() - match.rule.cooldownMinutes * 60 * 1000);

  const existing = await db.alertEvent.findFirst({
    where: {
      userId: match.rule.userId,
      ruleId: match.rule.id,
      dedupeKey: match.dedupeKey,
      createdAt: { gte: since },
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function materializeAlertMatch(match: AlertMatchResult) {
  const suppressed = await isSuppressedByCooldown(match);

  if (suppressed) {
    return { created: false as const, alert: null };
  }

  const alert = await db.alertEvent.create({
    data: {
      userId: match.rule.userId,
      ruleId: match.rule.id,
      title: match.title,
      message: match.message,
      category: match.category,
      severity: match.severity,
      visibleToCareTeam: match.visibleToCareTeam,
      sourceType: match.sourceType ?? null,
      sourceId: match.sourceId ?? null,
      sourceRecordedAt: match.sourceRecordedAt ?? null,
      dedupeKey: match.dedupeKey,
      contextJson: JSON.stringify(match.context),
    },
  });

  await createAlertAuditLog({
    userId: match.rule.userId,
    ruleId: match.rule.id,
    alertId: alert.id,
    action: "alert.created",
    metadata: {
      title: match.title,
      category: match.category,
      severity: match.severity,
      sourceType: match.sourceType,
      sourceId: match.sourceId,
      dedupeKey: match.dedupeKey,
    },
  });

  return { created: true as const, alert };
}

export async function runAlertEvaluation(trigger: AlertEvaluationTrigger) {
  const matches = await evaluateAlertRules(trigger);
  const createdAlerts = [];

  for (const match of matches) {
    const result = await materializeAlertMatch(match);
    if (result.created && result.alert) {
      createdAlerts.push(result.alert.id);
    }
  }

  return {
    evaluatedRuleCount: matches.length,
    createdAlertCount: createdAlerts.length,
    createdAlertIds: createdAlerts,
  };
}

export async function updateAlertStatus(args: {
  ownerUserId: string;
  actorUserId: string;
  alertId: string;
  status: Extract<AlertStatus, "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED">;
  note?: string | null;
}) {
  const current = await db.alertEvent.findFirst({
    where: {
      id: args.alertId,
      userId: args.ownerUserId,
    },
  });

  if (!current) {
    throw new Error("Alert not found.");
  }

  const now = new Date();

  const alert = await db.alertEvent.update({
    where: { id: current.id },
    data: {
      status: args.status,
      ownerAcknowledgedAt:
        args.status === "ACKNOWLEDGED" ? now : current.ownerAcknowledgedAt,
      resolvedAt: args.status === "RESOLVED" ? now : current.resolvedAt,
      dismissedAt: args.status === "DISMISSED" ? now : current.dismissedAt,
    },
  });

  await createAlertAuditLog({
    userId: args.ownerUserId,
    actorUserId: args.actorUserId,
    alertId: alert.id,
    ruleId: alert.ruleId,
    action: `alert.${args.status.toLowerCase()}`,
    note: args.note ?? null,
    metadata: {
      previousStatus: current.status,
      nextStatus: args.status,
    },
  });

  return alert;
}
