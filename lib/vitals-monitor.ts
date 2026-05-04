import { AlertSeverity, AlertSourceType, AlertStatus, ReadingSource } from "@prisma/client";
import { db } from "@/lib/db";

export type VitalMonitorTone = "neutral" | "info" | "success" | "warning" | "danger";
export type VitalMonitorPriority = "critical" | "high" | "medium" | "low";
export type VitalMetricKey = "bloodPressure" | "heartRate" | "oxygen" | "bloodSugar" | "temperature" | "weight";

export type VitalMetricCard = {
  key: VitalMetricKey;
  title: string;
  latest: string;
  previous: string | null;
  delta: string | null;
  capturedAt: Date | null;
  status: "normal" | "watch" | "danger" | "missing";
  detail: string;
};

export type VitalActionItem = {
  id: string;
  title: string;
  detail: string;
  priority: VitalMonitorPriority;
  href: string;
};

export type VitalTimelineItem = {
  id: string;
  label: string;
  detail: string;
  at: Date;
  source: ReadingSource;
  tone: VitalMonitorTone;
};

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: digits }).format(value);
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusTone(status: VitalMetricCard["status"]): VitalMonitorTone {
  if (status === "danger") return "danger";
  if (status === "watch") return "warning";
  if (status === "normal") return "success";
  return "neutral";
}

export function getVitalStatusTone(status: VitalMetricCard["status"]): VitalMonitorTone {
  return statusTone(status);
}

function priorityTone(priority: VitalMonitorPriority): VitalMonitorTone {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "medium") return "info";
  return "neutral";
}

export function getVitalPriorityTone(priority: VitalMonitorPriority): VitalMonitorTone {
  return priorityTone(priority);
}

function getBloodPressureStatus(systolic: number | null | undefined, diastolic: number | null | undefined): VitalMetricCard["status"] {
  if (!systolic || !diastolic) return "missing";
  if (systolic >= 180 || diastolic >= 120 || systolic < 90 || diastolic < 60) return "danger";
  if (systolic >= 140 || diastolic >= 90 || systolic < 100 || diastolic < 65) return "watch";
  return "normal";
}

function getHeartRateStatus(value: number | null | undefined): VitalMetricCard["status"] {
  if (!value) return "missing";
  if (value >= 130 || value < 45) return "danger";
  if (value >= 100 || value < 60) return "watch";
  return "normal";
}

function getOxygenStatus(value: number | null | undefined): VitalMetricCard["status"] {
  if (!value) return "missing";
  if (value < 90) return "danger";
  if (value < 95) return "watch";
  return "normal";
}

function getBloodSugarStatus(value: number | null | undefined): VitalMetricCard["status"] {
  if (value === null || value === undefined) return "missing";
  if (value >= 250 || value < 55) return "danger";
  if (value >= 180 || value < 70) return "watch";
  return "normal";
}

function getTemperatureStatus(value: number | null | undefined): VitalMetricCard["status"] {
  if (value === null || value === undefined) return "missing";
  if (value >= 39.5 || value < 35) return "danger";
  if (value >= 37.8 || value < 36) return "watch";
  return "normal";
}

function getWeightStatus(value: number | null | undefined): VitalMetricCard["status"] {
  if (value === null || value === undefined) return "missing";
  return "normal";
}

function numericDelta(latest: number | null | undefined, previous: number | null | undefined, suffix = "") {
  if (latest === null || latest === undefined || previous === null || previous === undefined) return null;
  const delta = latest - previous;
  if (delta === 0) return `0${suffix}`;
  return `${delta > 0 ? "+" : ""}${formatNumber(delta, 1)}${suffix}`;
}

function bloodPressureDelta(
  latest: { systolic: number | null; diastolic: number | null } | null,
  previous: { systolic: number | null; diastolic: number | null } | null
) {
  if (!latest?.systolic || !latest?.diastolic || !previous?.systolic || !previous?.diastolic) return null;
  const sysDelta = latest.systolic - previous.systolic;
  const diaDelta = latest.diastolic - previous.diastolic;
  return `${sysDelta >= 0 ? "+" : ""}${sysDelta}/${diaDelta >= 0 ? "+" : ""}${diaDelta}`;
}

export async function getVitalsMonitorData(userId: string) {
  const now = new Date();
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);
  const ninetyDaysAgo = daysAgo(90);

  const [records, recentAlerts, deviceConnections] = await Promise.all([
    db.vitalRecord.findMany({
      where: { userId, recordedAt: { gte: ninetyDaysAgo } },
      orderBy: { recordedAt: "desc" },
      take: 120,
    }),
    db.alertEvent.findMany({
      where: {
        userId,
        status: AlertStatus.OPEN,
        OR: [
          { sourceType: AlertSourceType.VITAL_RECORD },
          { title: { contains: "vital", mode: "insensitive" } },
          { message: { contains: "vital", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.deviceConnection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const recentRecords = records.filter((record) => record.recordedAt >= thirtyDaysAgo);
  const recordsLastSevenDays = records.filter((record) => record.recordedAt >= sevenDaysAgo);

  const latestWithBp = records.find((record) => record.systolic && record.diastolic) ?? null;
  const previousWithBp = records.filter((record) => record.systolic && record.diastolic)[1] ?? null;
  const latestHeartRate = records.find((record) => record.heartRate !== null) ?? null;
  const previousHeartRate = records.filter((record) => record.heartRate !== null)[1] ?? null;
  const latestOxygen = records.find((record) => record.oxygenSaturation !== null) ?? null;
  const previousOxygen = records.filter((record) => record.oxygenSaturation !== null)[1] ?? null;
  const latestBloodSugar = records.find((record) => record.bloodSugar !== null) ?? null;
  const previousBloodSugar = records.filter((record) => record.bloodSugar !== null)[1] ?? null;
  const latestTemperature = records.find((record) => record.temperatureC !== null) ?? null;
  const previousTemperature = records.filter((record) => record.temperatureC !== null)[1] ?? null;
  const latestWeight = records.find((record) => record.weightKg !== null) ?? null;
  const previousWeight = records.filter((record) => record.weightKg !== null)[1] ?? null;

  const metricCards: VitalMetricCard[] = [
    {
      key: "bloodPressure",
      title: "Blood pressure",
      latest: latestWithBp ? `${latestWithBp.systolic}/${latestWithBp.diastolic} mmHg` : "No reading",
      previous: previousWithBp ? `${previousWithBp.systolic}/${previousWithBp.diastolic} mmHg` : null,
      delta: bloodPressureDelta(latestWithBp, previousWithBp),
      capturedAt: latestWithBp?.recordedAt ?? null,
      status: getBloodPressureStatus(latestWithBp?.systolic, latestWithBp?.diastolic),
      detail: "Flags very high, low, and watch-zone readings for provider review.",
    },
    {
      key: "heartRate",
      title: "Heart rate",
      latest: latestHeartRate ? `${latestHeartRate.heartRate} bpm` : "No reading",
      previous: previousHeartRate ? `${previousHeartRate.heartRate} bpm` : null,
      delta: numericDelta(latestHeartRate?.heartRate, previousHeartRate?.heartRate, " bpm"),
      capturedAt: latestHeartRate?.recordedAt ?? null,
      status: getHeartRateStatus(latestHeartRate?.heartRate),
      detail: "Reviews elevated or unusually low pulse readings.",
    },
    {
      key: "oxygen",
      title: "Oxygen saturation",
      latest: latestOxygen ? `${latestOxygen.oxygenSaturation}% SpO2` : "No reading",
      previous: previousOxygen ? `${previousOxygen.oxygenSaturation}% SpO2` : null,
      delta: numericDelta(latestOxygen?.oxygenSaturation, previousOxygen?.oxygenSaturation, "%"),
      capturedAt: latestOxygen?.recordedAt ?? null,
      status: getOxygenStatus(latestOxygen?.oxygenSaturation),
      detail: "Highlights low SpO2 readings that may need urgent review.",
    },
    {
      key: "bloodSugar",
      title: "Blood sugar",
      latest: latestBloodSugar ? `${formatNumber(latestBloodSugar.bloodSugar, 1)} glucose` : "No reading",
      previous: previousBloodSugar ? `${formatNumber(previousBloodSugar.bloodSugar, 1)} glucose` : null,
      delta: numericDelta(latestBloodSugar?.bloodSugar, previousBloodSugar?.bloodSugar, ""),
      capturedAt: latestBloodSugar?.recordedAt ?? null,
      status: getBloodSugarStatus(latestBloodSugar?.bloodSugar),
      detail: "Marks very high, high, and low glucose readings for follow-up.",
    },
    {
      key: "temperature",
      title: "Temperature",
      latest: latestTemperature ? `${formatNumber(latestTemperature.temperatureC, 1)} °C` : "No reading",
      previous: previousTemperature ? `${formatNumber(previousTemperature.temperatureC, 1)} °C` : null,
      delta: numericDelta(latestTemperature?.temperatureC, previousTemperature?.temperatureC, " °C"),
      capturedAt: latestTemperature?.recordedAt ?? null,
      status: getTemperatureStatus(latestTemperature?.temperatureC),
      detail: "Tracks fever-range and unusually low temperature readings.",
    },
    {
      key: "weight",
      title: "Weight",
      latest: latestWeight ? `${formatNumber(latestWeight.weightKg, 1)} kg` : "No reading",
      previous: previousWeight ? `${formatNumber(previousWeight.weightKg, 1)} kg` : null,
      delta: numericDelta(latestWeight?.weightKg, previousWeight?.weightKg, " kg"),
      capturedAt: latestWeight?.recordedAt ?? null,
      status: getWeightStatus(latestWeight?.weightKg),
      detail: "Keeps recent weight context available for care-plan reviews.",
    },
  ];

  const dangerMetrics = metricCards.filter((metric) => metric.status === "danger").length;
  const watchMetrics = metricCards.filter((metric) => metric.status === "watch").length;
  const missingMetrics = metricCards.filter((metric) => metric.status === "missing").length;
  const deviceReadings = records.filter((record) => record.readingSource !== ReadingSource.MANUAL).length;
  const deviceCoverage = records.length ? Math.round((deviceReadings / records.length) * 100) : 0;
  const averagePerWeek = Math.round((recordsLastSevenDays.length / 7) * 10) / 10;

  const actions: VitalActionItem[] = [];

  metricCards.filter((metric) => metric.status === "danger").forEach((metric) => {
    actions.push({
      id: `danger-${metric.key}`,
      title: `${metric.title} needs urgent review`,
      detail: `${metric.latest} is outside the urgent review range. Confirm the reading and contact a provider if symptoms are present.`,
      priority: "critical",
      href: "/vitals",
    });
  });

  metricCards.filter((metric) => metric.status === "watch").forEach((metric) => {
    actions.push({
      id: `watch-${metric.key}`,
      title: `${metric.title} is in watch range`,
      detail: `${metric.latest} should be tracked and discussed if repeated or paired with symptoms.`,
      priority: "high",
      href: "/vitals",
    });
  });

  if (recordsLastSevenDays.length === 0) {
    actions.push({
      id: "freshness-gap",
      title: "No vitals recorded this week",
      detail: "Add a fresh reading so summaries, trends, and care-plan recommendations stay current.",
      priority: "medium",
      href: "/vitals",
    });
  }

  if (missingMetrics >= 3) {
    actions.push({
      id: "coverage-gap",
      title: "Vitals coverage is incomplete",
      detail: `${missingMetrics} key metric areas do not have recent readings yet. Add the values you track most often.`,
      priority: "medium",
      href: "/vitals",
    });
  }

  if (deviceConnections.length === 0) {
    actions.push({
      id: "device-gap",
      title: "No connected device source yet",
      detail: "Manual entries work, but connecting a supported device source improves freshness and continuity.",
      priority: "low",
      href: "/device-connection",
    });
  }

  recentAlerts.forEach((alert) => {
    actions.push({
      id: `alert-${alert.id}`,
      title: alert.title,
      detail: alert.message,
      priority: alert.severity === AlertSeverity.CRITICAL ? "critical" : alert.severity === AlertSeverity.HIGH ? "high" : "medium",
      href: `/alerts/${alert.id}`,
    });
  });

  const averages = {
    systolic: average(recentRecords.map((record) => record.systolic).filter((value): value is number => value !== null)),
    diastolic: average(recentRecords.map((record) => record.diastolic).filter((value): value is number => value !== null)),
    heartRate: average(recentRecords.map((record) => record.heartRate).filter((value): value is number => value !== null)),
    oxygen: average(recentRecords.map((record) => record.oxygenSaturation).filter((value): value is number => value !== null)),
    bloodSugar: average(recentRecords.map((record) => record.bloodSugar).filter((value): value is number => value !== null)),
    temperature: average(recentRecords.map((record) => record.temperatureC).filter((value): value is number => value !== null)),
    weight: average(recentRecords.map((record) => record.weightKg).filter((value): value is number => value !== null)),
  };

  const timeline: VitalTimelineItem[] = records.slice(0, 12).map((record) => {
    const parts = [
      record.systolic && record.diastolic ? `${record.systolic}/${record.diastolic} BP` : null,
      record.heartRate ? `${record.heartRate} bpm` : null,
      record.oxygenSaturation ? `${record.oxygenSaturation}% SpO2` : null,
      record.bloodSugar ? `${formatNumber(record.bloodSugar, 1)} glucose` : null,
      record.temperatureC ? `${formatNumber(record.temperatureC, 1)} °C` : null,
      record.weightKg ? `${formatNumber(record.weightKg, 1)} kg` : null,
    ].filter(Boolean);

    const hasDanger = getBloodPressureStatus(record.systolic, record.diastolic) === "danger" || getHeartRateStatus(record.heartRate) === "danger" || getOxygenStatus(record.oxygenSaturation) === "danger" || getBloodSugarStatus(record.bloodSugar) === "danger" || getTemperatureStatus(record.temperatureC) === "danger";
    const hasWatch = getBloodPressureStatus(record.systolic, record.diastolic) === "watch" || getHeartRateStatus(record.heartRate) === "watch" || getOxygenStatus(record.oxygenSaturation) === "watch" || getBloodSugarStatus(record.bloodSugar) === "watch" || getTemperatureStatus(record.temperatureC) === "watch";

    return {
      id: record.id,
      label: record.readingSource === ReadingSource.MANUAL ? "Manual reading" : `${record.readingSource.replaceAll("_", " ")} reading`,
      detail: parts.join(" • ") || record.notes || "Vitals entry recorded",
      at: record.recordedAt,
      source: record.readingSource,
      tone: hasDanger ? "danger" : hasWatch ? "warning" : "success",
    };
  });

  const readinessScore = Math.max(0, Math.min(100, 100 - dangerMetrics * 20 - watchMetrics * 10 - missingMetrics * 8 - (recordsLastSevenDays.length ? 0 : 15)));

  return {
    summary: {
      readinessScore,
      totalReadings: records.length,
      readingsLastSevenDays: recordsLastSevenDays.length,
      averagePerWeek,
      dangerMetrics,
      watchMetrics,
      missingMetrics,
      deviceCoverage,
      activeDeviceConnections: deviceConnections.filter((connection) => connection.status === "ACTIVE").length,
      openVitalAlerts: recentAlerts.length,
    },
    metricCards,
    actions: actions.slice(0, 10),
    averages,
    timeline,
    deviceConnections,
    generatedAt: now,
  };
}
