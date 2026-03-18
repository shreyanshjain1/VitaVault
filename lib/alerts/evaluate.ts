import {
  AlertRule,
  AlertRuleCategory,
  AlertSourceType,
  MedicationLogStatus,
  Prisma,
  SymptomSeverity,
} from "@prisma/client";
import { subHours } from "date-fns";
import { db } from "@/lib/db";
import { compareThreshold, metricLabel, symptomSeverityRank } from "@/lib/alerts/constants";
import type { AlertEvaluationTrigger, AlertMatchResult } from "@/lib/alerts/types";

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function buildDedupeKey(parts: Array<string | number | null | undefined>) {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(":");
}

async function getEnabledRules(userId: string) {
  return db.alertRule.findMany({
    where: {
      userId,
      enabled: true,
    },
    orderBy: [{ severity: "desc" }, { updatedAt: "desc" }],
  });
}

async function evaluateVitalThresholdRule(
  rule: AlertRule,
  trigger: AlertEvaluationTrigger
): Promise<AlertMatchResult | null> {
  if (!rule.metricKey || !rule.thresholdOperator || rule.thresholdValue == null) {
    return null;
  }

  const vital = await db.vitalRecord.findFirst({
    where: {
      userId: trigger.userId,
      ...(trigger.sourceType === "VITAL_RECORD" && trigger.sourceId
        ? { id: trigger.sourceId }
        : {
            recordedAt: {
              gte: subHours(new Date(), rule.lookbackHours),
            },
          }),
    },
    orderBy: { recordedAt: "desc" },
  });

  if (!vital) {
    return null;
  }

  const metricValue = normalizeNumber(
    (vital as unknown as Record<string, unknown>)[rule.metricKey]
  );

  if (metricValue == null) {
    return null;
  }

  const crossed = compareThreshold(
    rule.thresholdOperator,
    metricValue,
    rule.thresholdValue,
    rule.thresholdValueSecondary
  );

  if (!crossed) {
    return null;
  }

  const label = metricLabel(rule.metricKey);

  return {
    rule,
    category: "VITAL_THRESHOLD",
    severity: rule.severity,
    visibleToCareTeam: rule.visibleToCareTeam,
    title: `${label} threshold crossed`,
    message: `${label} recorded ${metricValue}, which triggered the ${rule.name} rule.`,
    dedupeKey: buildDedupeKey([
      rule.id,
      "vital",
      vital.id,
      rule.thresholdOperator,
      rule.thresholdValue,
      rule.thresholdValueSecondary,
    ]),
    sourceType: "VITAL_RECORD",
    sourceId: vital.id,
    sourceRecordedAt: vital.recordedAt,
    context: {
      metricKey: rule.metricKey,
      metricValue,
      thresholdOperator: rule.thresholdOperator,
      thresholdValue: rule.thresholdValue,
      thresholdValueSecondary: rule.thresholdValueSecondary,
      readingSource: vital.readingSource,
      vitalId: vital.id,
    },
  };
}

async function evaluateMedicationAdherenceRule(
  rule: AlertRule,
  trigger: AlertEvaluationTrigger
): Promise<AlertMatchResult | null> {
  if (!rule.medicationMissedCount) {
    return null;
  }

  const logs = await db.medicationLog.findMany({
    where: {
      userId: trigger.userId,
      loggedAt: {
        gte: subHours(new Date(), rule.lookbackHours),
      },
      status: {
        in: [MedicationLogStatus.MISSED, MedicationLogStatus.SKIPPED],
      },
    },
    include: {
      medication: {
        select: { id: true, name: true, dosage: true },
      },
    },
    orderBy: { loggedAt: "desc" },
  });

  if (logs.length < rule.medicationMissedCount) {
    return null;
  }

  const latest = logs[0];

  return {
    rule,
    category: "MEDICATION_ADHERENCE",
    severity: rule.severity,
    visibleToCareTeam: rule.visibleToCareTeam,
    title: "Medication adherence concern",
    message: `Detected ${logs.length} missed or skipped medication logs within the last ${rule.lookbackHours} hours.`,
    dedupeKey: buildDedupeKey([
      rule.id,
      "medication",
      latest.id,
      logs.length,
      rule.medicationMissedCount,
    ]),
    sourceType: "MEDICATION_LOG",
    sourceId: latest.id,
    sourceRecordedAt: latest.loggedAt,
    context: {
      missedCount: logs.length,
      threshold: rule.medicationMissedCount,
      medicationId: latest.medicationId,
      medicationName: latest.medication.name,
      statuses: logs.map((log) => ({
        id: log.id,
        status: log.status,
        loggedAt: log.loggedAt.toISOString(),
      })),
    },
  };
}

async function evaluateSymptomSeverityRule(
  rule: AlertRule,
  trigger: AlertEvaluationTrigger
): Promise<AlertMatchResult | null> {
  if (!rule.symptomSeverity) {
    return null;
  }

  const symptom = await db.symptomEntry.findFirst({
    where: {
      userId: trigger.userId,
      resolved: false,
      ...(trigger.sourceType === "SYMPTOM_ENTRY" && trigger.sourceId
        ? { id: trigger.sourceId }
        : {
            createdAt: {
              gte: subHours(new Date(), rule.lookbackHours),
            },
          }),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!symptom) {
    return null;
  }

  const matches =
    symptomSeverityRank[symptom.severity] >= symptomSeverityRank[rule.symptomSeverity];

  if (!matches) {
    return null;
  }

  return {
    rule,
    category: "SYMPTOM_SEVERITY",
    severity: rule.severity,
    visibleToCareTeam: rule.visibleToCareTeam,
    title: "Symptom severity alert",
    message: `${symptom.title} was logged as ${symptom.severity.toLowerCase()} and matched the ${rule.name} rule.`,
    dedupeKey: buildDedupeKey([
      rule.id,
      "symptom",
      symptom.id,
      symptom.severity,
      rule.symptomSeverity,
    ]),
    sourceType: "SYMPTOM_ENTRY",
    sourceId: symptom.id,
    sourceRecordedAt: symptom.startedAt,
    context: {
      symptomId: symptom.id,
      symptomTitle: symptom.title,
      symptomSeverity: symptom.severity,
      requiredSeverity: rule.symptomSeverity,
      bodyArea: symptom.bodyArea,
    },
  };
}

async function evaluateSyncHealthRule(
  rule: AlertRule,
  trigger: AlertEvaluationTrigger
): Promise<AlertMatchResult | null> {
  if (!rule.syncStaleHours) {
    return null;
  }

  const staleCutoff = subHours(new Date(), rule.syncStaleHours);

  const connection = await db.deviceConnection.findFirst({
    where: {
      userId: trigger.userId,
      status: {
        in: ["ACTIVE", "ERROR"],
      },
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: staleCutoff } },
        { lastError: { not: null } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (!connection) {
    return null;
  }

  return {
    rule,
    category: "SYNC_HEALTH",
    severity: rule.severity,
    visibleToCareTeam: rule.visibleToCareTeam,
    title: "Device sync health issue",
    message: connection.lastError
      ? `Device sync reported an error for ${connection.deviceLabel ?? connection.clientDeviceId}.`
      : `No successful sync detected within ${rule.syncStaleHours} hours for ${connection.deviceLabel ?? connection.clientDeviceId}.`,
    dedupeKey: buildDedupeKey([
      rule.id,
      "sync",
      connection.id,
      connection.lastSyncedAt?.toISOString() ?? "never",
      connection.lastError ?? "none",
    ]),
    sourceType: trigger.sourceType === "SYNC_JOB" ? "SYNC_JOB" : "SCHEDULED_SCAN",
    sourceId: trigger.sourceId ?? connection.id,
    sourceRecordedAt: connection.lastSyncedAt,
    context: {
      connectionId: connection.id,
      clientDeviceId: connection.clientDeviceId,
      deviceLabel: connection.deviceLabel,
      source: connection.source,
      platform: connection.platform,
      lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
      lastError: connection.lastError,
      staleHours: rule.syncStaleHours,
    },
  };
}

export async function evaluateAlertRules(
  trigger: AlertEvaluationTrigger
): Promise<AlertMatchResult[]> {
  const rules = await getEnabledRules(trigger.userId);
  const matches: AlertMatchResult[] = [];

  for (const rule of rules) {
    let match: AlertMatchResult | null = null;

    if (rule.category === "VITAL_THRESHOLD") {
      match = await evaluateVitalThresholdRule(rule, trigger);
    } else if (rule.category === "MEDICATION_ADHERENCE") {
      match = await evaluateMedicationAdherenceRule(rule, trigger);
    } else if (rule.category === "SYMPTOM_SEVERITY") {
      match = await evaluateSymptomSeverityRule(rule, trigger);
    } else if (rule.category === "SYNC_HEALTH") {
      match = await evaluateSyncHealthRule(rule, trigger);
    }

    if (match) {
      matches.push(match);
    }
  }

  return matches;
}
