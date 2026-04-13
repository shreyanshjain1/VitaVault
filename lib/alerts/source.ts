import { db } from "@/lib/db";

export function describeAlertSource(sourceType?: string | null) {
  switch (sourceType) {
    case "VITAL_RECORD":
      return "Vital record";
    case "MEDICATION_LOG":
      return "Medication log";
    case "SYMPTOM_ENTRY":
      return "Symptom entry";
    case "SYNC_JOB":
      return "Sync job";
    case "DEVICE_READING":
      return "Device reading";
    case "SCHEDULED_SCAN":
      return "Scheduled scan";
    default:
      return "Unknown source";
  }
}

export function getAlertSourceHref(sourceType?: string | null, sourceId?: string | null) {
  if (!sourceType || !sourceId) return null;

  switch (sourceType) {
    case "VITAL_RECORD":
    case "DEVICE_READING":
      return "/vitals";
    case "MEDICATION_LOG":
      return "/medications";
    case "SYMPTOM_ENTRY":
      return "/symptoms";
    case "SYNC_JOB":
    case "SCHEDULED_SCAN":
      return "/device-connection";
    default:
      return null;
  }
}

export async function getAlertSourceSummary(sourceType?: string | null, sourceId?: string | null) {
  if (!sourceType || !sourceId) return null;

  if (sourceType === "VITAL_RECORD") {
    const record = await db.vitalRecord.findUnique({ where: { id: sourceId } });
    if (!record) return null;
    const pieces = [
      record.systolic != null && record.diastolic != null
        ? `BP ${record.systolic}/${record.diastolic}`
        : null,
      record.heartRate != null ? `HR ${record.heartRate} bpm` : null,
      record.bloodSugar != null ? `Sugar ${record.bloodSugar}` : null,
      record.temperatureC != null ? `Temp ${record.temperatureC}°C` : null,
      record.oxygenSaturation != null ? `O₂ ${record.oxygenSaturation}%` : null,
    ].filter(Boolean);

    return pieces.length ? pieces.join(" • ") : "Vital record available";
  }

  if (sourceType === "MEDICATION_LOG") {
    const record = await db.medicationLog.findUnique({
      where: { id: sourceId },
      include: { medication: { select: { name: true, dosage: true } } },
    });
    if (!record) return null;
    return `${record.medication.name} • ${record.status}${record.scheduleTime ? ` • ${record.scheduleTime}` : ""}`;
  }

  if (sourceType === "SYMPTOM_ENTRY") {
    const record = await db.symptomEntry.findUnique({ where: { id: sourceId } });
    if (!record) return null;
    return `${record.title} • ${record.severity}${record.bodyArea ? ` • ${record.bodyArea}` : ""}`;
  }

  if (sourceType === "SYNC_JOB") {
    const record = await db.syncJob.findUnique({ where: { id: sourceId } });
    if (!record) return null;
    return `${record.provider} • ${record.status}`;
  }

  if (sourceType === "DEVICE_READING") {
    const record = await db.deviceReading.findUnique({ where: { id: sourceId } });
    if (!record) return null;
    return `${record.metricType} • ${record.metricValue}`;
  }

  return null;
}
