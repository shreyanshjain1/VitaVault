import type { AlertSourceType } from "@prisma/client";
import { db } from "@/lib/db";

export function describeAlertSource(sourceType?: string | null) {
  if (!sourceType) return "Unknown source";

  const labels: Record<string, string> = {
    VITAL_RECORD: "Vital record",
    MEDICATION_LOG: "Medication log",
    SYMPTOM_ENTRY: "Symptom entry",
    SYNC_JOB: "Sync job",
    DEVICE_READING: "Device reading",
    SCHEDULED_SCAN: "Scheduled scan",
  };

  return labels[sourceType] ?? sourceType;
}

export async function resolveAlertSource(args: {
  sourceType?: AlertSourceType | null;
  sourceId?: string | null;
}) {
  if (!args.sourceType || !args.sourceId) {
    return { sourceHref: null, sourceSummary: null };
  }

  switch (args.sourceType) {
    case "VITAL_RECORD": {
      const record = await db.vitalRecord.findUnique({
        where: { id: args.sourceId },
        select: {
          id: true,
          recordedAt: true,
          systolic: true,
          diastolic: true,
          heartRate: true,
          bloodSugar: true,
          oxygenSaturation: true,
          temperatureC: true,
          weightKg: true,
        },
      });
      if (!record) return { sourceHref: "/vitals", sourceSummary: "Vital record unavailable" };
      const parts = [
        record.systolic != null && record.diastolic != null
          ? `BP ${record.systolic}/${record.diastolic}`
          : null,
        record.heartRate != null ? `HR ${record.heartRate}` : null,
        record.bloodSugar != null ? `Sugar ${record.bloodSugar}` : null,
        record.oxygenSaturation != null ? `SpO₂ ${record.oxygenSaturation}%` : null,
        record.temperatureC != null ? `Temp ${record.temperatureC}°C` : null,
        record.weightKg != null ? `Weight ${record.weightKg} kg` : null,
      ].filter(Boolean);
      return {
        sourceHref: "/vitals",
        sourceSummary: parts.length ? parts.join(" • ") : `Recorded ${record.recordedAt.toLocaleString()}`,
      };
    }
    case "MEDICATION_LOG": {
      const record = await db.medicationLog.findUnique({
        where: { id: args.sourceId },
        include: { medication: { select: { name: true, dosage: true } } },
      });
      if (!record) return { sourceHref: "/medications", sourceSummary: "Medication log unavailable" };
      return {
        sourceHref: "/medications",
        sourceSummary: `${record.medication.name} • ${record.status}${record.scheduleTime ? ` • ${record.scheduleTime}` : ""}`,
      };
    }
    case "SYMPTOM_ENTRY": {
      const record = await db.symptomEntry.findUnique({
        where: { id: args.sourceId },
        select: { title: true, severity: true, startedAt: true, resolved: true },
      });
      if (!record) return { sourceHref: "/symptoms", sourceSummary: "Symptom entry unavailable" };
      return {
        sourceHref: "/symptoms",
        sourceSummary: `${record.title} • ${record.severity}${record.resolved ? " • resolved" : ""}`,
      };
    }
    case "SYNC_JOB": {
      const record = await db.syncJob.findUnique({
        where: { id: args.sourceId },
        select: { source: true, status: true, platform: true },
      });
      if (!record) return { sourceHref: "/jobs", sourceSummary: "Sync job unavailable" };
      return {
        sourceHref: "/jobs",
        sourceSummary: `${record.source} • ${record.platform} • ${record.status}`,
      };
    }
    case "DEVICE_READING": {
      const record = await db.deviceReading.findUnique({
        where: { id: args.sourceId },
        select: {
          readingType: true,
          valueInt: true,
          valueFloat: true,
          systolic: true,
          diastolic: true,
          unit: true,
          capturedAt: true,
        },
      });
      if (!record) return { sourceHref: "/device-connection", sourceSummary: "Device reading unavailable" };
      let summary = `${record.readingType}`;
      if (record.systolic != null && record.diastolic != null) {
        summary += ` • ${record.systolic}/${record.diastolic}`;
      } else if (record.valueInt != null) {
        summary += ` • ${record.valueInt}${record.unit ? ` ${record.unit}` : ""}`;
      } else if (record.valueFloat != null) {
        summary += ` • ${record.valueFloat}${record.unit ? ` ${record.unit}` : ""}`;
      }
      return {
        sourceHref: "/device-connection",
        sourceSummary: summary,
      };
    }
    default:
      return { sourceHref: null, sourceSummary: describeAlertSource(args.sourceType) };
  }
}
