import {
  AlertRuleCategory,
  AlertSeverity,
  AlertSourceType,
  AlertStatus,
  SymptomSeverity,
  ThresholdOperator,
} from "@prisma/client";

export const alertSeverityLabel: Record<AlertSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const alertStatusLabel: Record<AlertStatus, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

export const alertCategoryLabel: Record<AlertRuleCategory, string> = {
  VITAL_THRESHOLD: "Vital Threshold",
  MEDICATION_ADHERENCE: "Medication Adherence",
  SYMPTOM_SEVERITY: "Symptom Severity",
  SYNC_HEALTH: "Sync Health",
};

export const alertSourceLabel: Partial<Record<AlertSourceType, string>> = {
  VITAL_RECORD: "Vital record",
  MEDICATION_LOG: "Medication log",
  SYMPTOM_ENTRY: "Symptom entry",
  SYNC_JOB: "Sync job",
  DEVICE_READING: "Device reading",
  SCHEDULED_SCAN: "Scheduled scan",
};

export const symptomSeverityRank: Record<SymptomSeverity, number> = {
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
};

export function compareThreshold(
  operator: ThresholdOperator,
  value: number,
  target: number,
  secondary?: number | null
) {
  switch (operator) {
    case "GT":
      return value > target;
    case "GTE":
      return value >= target;
    case "LT":
      return value < target;
    case "LTE":
      return value <= target;
    case "BETWEEN":
      return secondary != null && value >= target && value <= secondary;
    default:
      return false;
  }
}

export function metricLabel(metricKey: string | null | undefined) {
  switch (metricKey) {
    case "systolic":
      return "Systolic blood pressure";
    case "diastolic":
      return "Diastolic blood pressure";
    case "heartRate":
      return "Heart rate";
    case "bloodSugar":
      return "Blood sugar";
    case "oxygenSaturation":
      return "Oxygen saturation";
    case "temperatureC":
      return "Temperature";
    case "weightKg":
      return "Weight";
    default:
      return metricKey ?? "Metric";
  }
}
