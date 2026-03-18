import type {
  AlertRule,
  AlertRuleCategory,
  AlertSeverity,
  AlertSourceType,
  SymptomSeverity,
} from "@prisma/client";

export type AlertEvaluationTrigger = {
  userId: string;
  ownerUserId?: string;
  sourceType?: AlertSourceType | null;
  sourceId?: string | null;
  sourceRecordedAt?: string | null;
  initiatedBy?: "record_create" | "scheduled_scan" | "manual_scan" | "sync_finish";
};

export type AlertMatchResult = {
  rule: AlertRule;
  category: AlertRuleCategory;
  severity: AlertSeverity;
  visibleToCareTeam: boolean;
  title: string;
  message: string;
  dedupeKey: string;
  sourceType?: AlertSourceType | null;
  sourceId?: string | null;
  sourceRecordedAt?: Date | null;
  context: Record<string, unknown>;
};

export type AlertMetricValue = {
  metricKey: string;
  value: number;
  label: string;
};

export type SymptomTriggerContext = {
  symptomId: string;
  title: string;
  severity: SymptomSeverity;
  startedAt: Date;
};
