import {
  AppointmentStatus,
  LabFlag,
  MedicationLogStatus,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";

export type TrendTone = "neutral" | "info" | "success" | "warning" | "danger";
export type TrendDirection = "up" | "down" | "flat" | "new";

export type VitalTrendMetric = {
  key: string;
  label: string;
  unit: string;
  latest: number | null;
  previous: number | null;
  delta: number | null;
  direction: TrendDirection;
  tone: TrendTone;
  message: string;
};

export type TrendInsight = {
  title: string;
  detail: string;
  tone: TrendTone;
};

export type HealthTrendsData = Awaited<ReturnType<typeof getHealthTrendsData>>;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWindow(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

function roundNumber(value: number | null | undefined, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function average(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  if (clean.length === 0) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function directionFromDelta(delta: number | null): TrendDirection {
  if (delta === null) return "new";
  if (Math.abs(delta) < 0.1) return "flat";
  return delta > 0 ? "up" : "down";
}

function metricTone(key: string, latest: number | null): TrendTone {
  if (latest === null) return "neutral";

  if (key === "bloodPressure") {
    return latest >= 140 ? "danger" : latest >= 130 ? "warning" : "success";
  }

  if (key === "heartRate") {
    return latest < 50 || latest > 110 ? "warning" : "success";
  }

  if (key === "oxygenSaturation") {
    return latest < 92 ? "danger" : latest < 95 ? "warning" : "success";
  }

  if (key === "bloodSugar") {
    return latest >= 200 ? "danger" : latest >= 140 ? "warning" : "success";
  }

  if (key === "temperatureC") {
    return latest >= 38 ? "danger" : latest >= 37.5 ? "warning" : "success";
  }

  return "info";
}

function metricMessage(key: string, latest: number | null, delta: number | null) {
  if (latest === null) return "No readings yet for this signal.";
  const direction = directionFromDelta(delta);
  const movement = direction === "new" ? "first reading captured" : direction === "flat" ? "stable" : direction === "up" ? "trending up" : "trending down";

  if (key === "bloodPressure") return `Latest systolic reading is ${latest}. The recent average is ${movement}.`;
  if (key === "heartRate") return `Latest heart rate is ${latest} bpm and is ${movement}.`;
  if (key === "oxygenSaturation") return `Latest oxygen saturation is ${latest}% and is ${movement}.`;
  if (key === "bloodSugar") return `Latest blood sugar is ${latest} and is ${movement}.`;
  if (key === "temperatureC") return `Latest temperature is ${latest}°C and is ${movement}.`;
  if (key === "weightKg") return `Latest weight is ${latest} kg and is ${movement}.`;
  return `Latest value is ${latest} and is ${movement}.`;
}

function makeVitalMetric({
  key,
  label,
  unit,
  values,
}: {
  key: string;
  label: string;
  unit: string;
  values: Array<number | null | undefined>;
}): VitalTrendMetric {
  const clean = values.filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  const latest = roundNumber(clean[0] ?? null);
  const previous = roundNumber(clean[1] ?? null);
  const delta = latest !== null && previous !== null ? roundNumber(latest - previous) : null;

  return {
    key,
    label,
    unit,
    latest,
    previous,
    delta,
    direction: directionFromDelta(delta),
    tone: metricTone(key, latest),
    message: metricMessage(key, latest, delta),
  };
}

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export async function getHealthTrendsData(userId: string) {
  const thirtyDaysAgo = startOfWindow(30);
  const ninetyDaysAgo = startOfWindow(90);
  const now = new Date();

  const [vitals, labs, symptoms, medicationLogs, upcomingAppointments] = await Promise.all([
    db.vitalRecord.findMany({
      where: { userId, recordedAt: { gte: ninetyDaysAgo } },
      orderBy: { recordedAt: "desc" },
      take: 80,
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
        readingSource: true,
      },
    }),
    db.labResult.findMany({
      where: { userId, dateTaken: { gte: ninetyDaysAgo } },
      orderBy: { dateTaken: "desc" },
      take: 50,
      select: {
        id: true,
        testName: true,
        dateTaken: true,
        flag: true,
        resultSummary: true,
        referenceRange: true,
      },
    }),
    db.symptomEntry.findMany({
      where: { userId, startedAt: { gte: ninetyDaysAgo } },
      orderBy: { startedAt: "desc" },
      take: 60,
      select: {
        id: true,
        title: true,
        severity: true,
        startedAt: true,
        resolved: true,
        bodyArea: true,
      },
    }),
    db.medicationLog.findMany({
      where: { userId, loggedAt: { gte: thirtyDaysAgo } },
      orderBy: { loggedAt: "desc" },
      take: 120,
      select: {
        id: true,
        loggedAt: true,
        status: true,
        scheduleTime: true,
        medication: { select: { id: true, name: true, dosage: true } },
      },
    }),
    db.appointment.findMany({
      where: { userId, scheduledAt: { gte: now }, status: AppointmentStatus.UPCOMING },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: {
        id: true,
        doctorName: true,
        clinic: true,
        purpose: true,
        scheduledAt: true,
        status: true,
      },
    }),
  ]);

  const vitalMetrics = [
    makeVitalMetric({ key: "bloodPressure", label: "Blood pressure", unit: "systolic", values: vitals.map((item) => item.systolic) }),
    makeVitalMetric({ key: "heartRate", label: "Heart rate", unit: "bpm", values: vitals.map((item) => item.heartRate) }),
    makeVitalMetric({ key: "oxygenSaturation", label: "Oxygen saturation", unit: "%", values: vitals.map((item) => item.oxygenSaturation) }),
    makeVitalMetric({ key: "bloodSugar", label: "Blood sugar", unit: "mg/dL", values: vitals.map((item) => item.bloodSugar) }),
    makeVitalMetric({ key: "temperatureC", label: "Temperature", unit: "°C", values: vitals.map((item) => item.temperatureC) }),
    makeVitalMetric({ key: "weightKg", label: "Weight", unit: "kg", values: vitals.map((item) => item.weightKg) }),
  ];

  const abnormalLabs = labs.filter((lab) => lab.flag !== LabFlag.NORMAL);
  const severeSymptoms = symptoms.filter((symptom) => symptom.severity === SymptomSeverity.SEVERE && !symptom.resolved);
  const unresolvedSymptoms = symptoms.filter((symptom) => !symptom.resolved);
  const takenLogs = medicationLogs.filter((log) => log.status === MedicationLogStatus.TAKEN).length;
  const missedLogs = medicationLogs.filter((log) => log.status === MedicationLogStatus.MISSED).length;
  const skippedLogs = medicationLogs.filter((log) => log.status === MedicationLogStatus.SKIPPED).length;
  const adherenceRate = percentage(takenLogs, medicationLogs.length);

  const latestVitals = vitals[0] ?? null;
  const recentVitals = vitals.filter((vital) => vital.recordedAt >= thirtyDaysAgo);
  const dataCoverageScore = Math.min(
    100,
    Math.round(
      (vitals.length ? 25 : 0) +
        (labs.length ? 20 : 0) +
        (symptoms.length ? 20 : 0) +
        (medicationLogs.length ? 20 : 0) +
        (upcomingAppointments.length ? 15 : 0)
    )
  );

  const riskScore = Math.min(
    100,
    abnormalLabs.length * 12 + severeSymptoms.length * 18 + missedLogs * 6 + vitalMetrics.filter((metric) => metric.tone === "danger").length * 20 + vitalMetrics.filter((metric) => metric.tone === "warning").length * 10
  );

  const insights: TrendInsight[] = [];

  if (vitals.length === 0) {
    insights.push({ title: "No vital trend baseline yet", detail: "Add a few vital readings to unlock trend direction, averages, and out-of-range signals.", tone: "warning" });
  }

  if (abnormalLabs.length > 0) {
    insights.push({ title: "Abnormal lab results need review", detail: `${abnormalLabs.length} lab result${abnormalLabs.length === 1 ? "" : "s"} in the last 90 days are flagged outside normal range.`, tone: "danger" });
  }

  if (severeSymptoms.length > 0) {
    insights.push({ title: "Severe unresolved symptoms", detail: `${severeSymptoms.length} severe unresolved symptom${severeSymptoms.length === 1 ? "" : "s"} should be brought into the next care review.`, tone: "danger" });
  }

  if (medicationLogs.length > 0 && adherenceRate < 80) {
    insights.push({ title: "Medication adherence below target", detail: `The 30-day logged adherence rate is ${adherenceRate}%. Review missed/skipped logs and reminder timing.`, tone: "warning" });
  }

  if (upcomingAppointments.length === 0) {
    insights.push({ title: "No upcoming care visit scheduled", detail: "There are no upcoming appointments in the current trend window. Add follow-up visits to keep the care plan active.", tone: "info" });
  }

  if (insights.length === 0) {
    insights.push({ title: "Trend posture looks stable", detail: "No major trend risk was detected from recent vitals, labs, symptoms, and medication logs.", tone: "success" });
  }

  const recentTimeline = [
    ...vitals.slice(0, 6).map((item) => ({
      id: `vital-${item.id}`,
      type: "Vital" as const,
      title: item.systolic && item.diastolic ? `BP ${item.systolic}/${item.diastolic}` : "Vital reading",
      detail: [
        item.heartRate ? `${item.heartRate} bpm` : null,
        item.oxygenSaturation ? `${item.oxygenSaturation}% SpO₂` : null,
        item.readingSource !== "MANUAL" ? item.readingSource : null,
      ].filter(Boolean).join(" • ") || "Manual vital record",
      at: item.recordedAt,
      tone: "info" as TrendTone,
    })),
    ...labs.slice(0, 6).map((item) => ({
      id: `lab-${item.id}`,
      type: "Lab" as const,
      title: item.testName,
      detail: `${item.flag} • ${item.resultSummary}`,
      at: item.dateTaken,
      tone: item.flag === LabFlag.NORMAL ? "success" as TrendTone : "warning" as TrendTone,
    })),
    ...symptoms.slice(0, 6).map((item) => ({
      id: `symptom-${item.id}`,
      type: "Symptom" as const,
      title: item.title,
      detail: `${item.severity}${item.resolved ? " • resolved" : " • unresolved"}`,
      at: item.startedAt,
      tone: item.severity === SymptomSeverity.SEVERE && !item.resolved ? "danger" as TrendTone : "warning" as TrendTone,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 12);

  return {
    summary: {
      dataCoverageScore,
      riskScore,
      vitalReadings: vitals.length,
      recentVitalReadings: recentVitals.length,
      labResults: labs.length,
      abnormalLabs: abnormalLabs.length,
      symptoms: symptoms.length,
      unresolvedSymptoms: unresolvedSymptoms.length,
      severeSymptoms: severeSymptoms.length,
      medicationLogs: medicationLogs.length,
      adherenceRate,
      upcomingAppointments: upcomingAppointments.length,
    },
    vitalMetrics,
    latestVitals,
    vitalAverages: {
      systolic: roundNumber(average(recentVitals.map((item) => item.systolic)), 0),
      diastolic: roundNumber(average(recentVitals.map((item) => item.diastolic)), 0),
      heartRate: roundNumber(average(recentVitals.map((item) => item.heartRate)), 0),
      oxygenSaturation: roundNumber(average(recentVitals.map((item) => item.oxygenSaturation)), 0),
      bloodSugar: roundNumber(average(recentVitals.map((item) => item.bloodSugar)), 1),
      temperatureC: roundNumber(average(recentVitals.map((item) => item.temperatureC)), 1),
      weightKg: roundNumber(average(recentVitals.map((item) => item.weightKg)), 1),
    },
    labs: {
      latest: labs.slice(0, 6),
      abnormal: abnormalLabs.slice(0, 6),
      normalCount: labs.filter((lab) => lab.flag === LabFlag.NORMAL).length,
      borderlineCount: labs.filter((lab) => lab.flag === LabFlag.BORDERLINE).length,
      highCount: labs.filter((lab) => lab.flag === LabFlag.HIGH).length,
      lowCount: labs.filter((lab) => lab.flag === LabFlag.LOW).length,
    },
    symptoms: {
      latest: symptoms.slice(0, 6),
      unresolved: unresolvedSymptoms.slice(0, 6),
      mildCount: symptoms.filter((symptom) => symptom.severity === SymptomSeverity.MILD).length,
      moderateCount: symptoms.filter((symptom) => symptom.severity === SymptomSeverity.MODERATE).length,
      severeCount: symptoms.filter((symptom) => symptom.severity === SymptomSeverity.SEVERE).length,
    },
    medications: {
      logs: medicationLogs.slice(0, 8),
      takenLogs,
      missedLogs,
      skippedLogs,
      adherenceRate,
    },
    upcomingAppointments,
    insights,
    recentTimeline,
  };
}
