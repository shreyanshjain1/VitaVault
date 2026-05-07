import { AppointmentStatus, LabFlag, ReminderState, SymptomSeverity } from "@prisma/client";
import { db } from "@/lib/db";
import { buildRecordHref } from "@/lib/record-focus";
import { careNoteWorkflowTone, summarizeCareNoteForWorkflow } from "@/lib/care-note-workflows";

export type TimelineTone = "info" | "neutral" | "success" | "warning" | "danger";

export type TimelineItemType =
  | "APPOINTMENT"
  | "LAB_RESULT"
  | "VITAL"
  | "SYMPTOM"
  | "VACCINATION"
  | "DOCUMENT"
  | "REMINDER"
  | "ALERT"
  | "CARE_NOTE";

export type TimelineRiskLevel = "routine" | "watch" | "urgent";

export type TimelineFilters = {
  type?: string;
  tone?: string;
  q?: string;
  from?: string;
  to?: string;
};

export type TimelineItem = {
  id: string;
  type: TimelineItemType;
  title: string;
  description: string;
  occurredAt: Date;
  href: string;
  tone: TimelineTone;
  riskLevel: TimelineRiskLevel;
  source: string;
  monthKey: string;
  monthLabel: string;
  searchText: string;
};

export type TimelineMonthGroup = {
  key: string;
  label: string;
  items: TimelineItem[];
  riskCount: number;
};

export type TimelineSummary = {
  totalItems: number;
  visibleItems: number;
  urgentItems: number;
  watchItems: number;
  documentItems: number;
  recordTypesCovered: number;
  newestItemAt: Date | null;
  oldestItemAt: Date | null;
};

export type TimelineWorkspaceData = {
  allItems: TimelineItem[];
  visibleItems: TimelineItem[];
  groups: TimelineMonthGroup[];
  summary: TimelineSummary;
  availableTypes: TimelineItemType[];
  availableTones: TimelineTone[];
  appliedFilters: Required<TimelineFilters>;
};

function getAppointmentTone(status: AppointmentStatus): TimelineTone {
  switch (status) {
    case AppointmentStatus.COMPLETED:
      return "success";
    case AppointmentStatus.CANCELLED:
      return "warning";
    default:
      return "info";
  }
}

function getLabTone(flag: LabFlag): TimelineTone {
  switch (flag) {
    case LabFlag.HIGH:
    case LabFlag.LOW:
      return "warning";
    case LabFlag.BORDERLINE:
      return "info";
    default:
      return "neutral";
  }
}

function getSymptomTone(severity: SymptomSeverity, resolved: boolean): TimelineTone {
  if (resolved) return "success";
  switch (severity) {
    case SymptomSeverity.SEVERE:
      return "danger";
    case SymptomSeverity.MODERATE:
      return "warning";
    default:
      return "info";
  }
}

function getReminderTone(state: ReminderState, completed: boolean): TimelineTone {
  if (completed || state === ReminderState.COMPLETED) return "success";
  if (state === ReminderState.MISSED || state === ReminderState.OVERDUE) return "warning";
  if (state === ReminderState.SKIPPED) return "neutral";
  return "info";
}

function getRiskLevel(tone: TimelineTone): TimelineRiskLevel {
  if (tone === "danger") return "urgent";
  if (tone === "warning") return "watch";
  return "routine";
}

function getMonthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(value);
}

function withTimelineMeta(item: Omit<TimelineItem, "riskLevel" | "source" | "monthKey" | "monthLabel" | "searchText"> & { source?: string }): TimelineItem {
  const riskLevel = getRiskLevel(item.tone);
  const source = item.source ?? item.type.replaceAll("_", " ");
  const monthKey = getMonthKey(item.occurredAt);
  const monthLabel = getMonthLabel(item.occurredAt);

  return {
    ...item,
    riskLevel,
    source,
    monthKey,
    monthLabel,
    searchText: [item.type, item.title, item.description, source, item.tone, riskLevel].join(" ").toLowerCase(),
  };
}

function normalizeFilterValue(value: string | undefined, fallback = "all") {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function parseDateFilter(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndDateFilter(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function applyTimelineFilters(items: TimelineItem[], filters: Required<TimelineFilters>) {
  const query = filters.q.trim().toLowerCase();
  const fromDate = parseDateFilter(filters.from);
  const toDate = parseEndDateFilter(filters.to);

  return items.filter((item) => {
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.tone !== "all" && item.tone !== filters.tone) return false;
    if (query && !item.searchText.includes(query)) return false;
    if (fromDate && item.occurredAt < fromDate) return false;
    if (toDate && item.occurredAt > toDate) return false;
    return true;
  });
}

function groupTimelineItems(items: TimelineItem[]): TimelineMonthGroup[] {
  const grouped = new Map<string, TimelineMonthGroup>();

  for (const item of items) {
    const existing = grouped.get(item.monthKey);
    if (existing) {
      existing.items.push(item);
      if (item.riskLevel !== "routine") existing.riskCount += 1;
    } else {
      grouped.set(item.monthKey, {
        key: item.monthKey,
        label: item.monthLabel,
        items: [item],
        riskCount: item.riskLevel !== "routine" ? 1 : 0,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.key.localeCompare(a.key));
}

export async function getTimelineItems(userId: string, limit = 160, filters?: TimelineFilters): Promise<TimelineItem[]> {
  const [appointments, labs, vitals, symptoms, vaccinations, documents, reminders, alerts, careNotes] = await Promise.all([
    db.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
      take: limit,
    }),
    db.labResult.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: limit,
    }),
    db.vitalRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: limit,
    }),
    db.symptomEntry.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
    }),
    db.vaccinationRecord.findMany({
      where: { userId },
      orderBy: { dateTaken: "desc" },
      take: limit,
    }),
    db.medicalDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.reminder.findMany({
      where: { userId },
      orderBy: { dueAt: "desc" },
      take: limit,
    }),
    db.alertEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.careNote.findMany({
      where: { ownerUserId: userId, archivedAt: null },
      include: { author: { select: { name: true, email: true } } },
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
  ]);

  const items: TimelineItem[] = [
    ...appointments.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "APPOINTMENT",
      title: item.doctorName || item.clinic || "Appointment",
      description: [item.purpose, item.clinic, item.status].filter(Boolean).join(" • "),
      occurredAt: item.scheduledAt,
      href: buildRecordHref("/appointments", item.id),
      tone: getAppointmentTone(item.status),
      source: "Appointment",
    })),
    ...labs.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "LAB_RESULT",
      title: item.testName,
      description: [item.resultSummary, item.referenceRange ? `Reference: ${item.referenceRange}` : null, item.flag].filter(Boolean).join(" • "),
      occurredAt: item.dateTaken,
      href: buildRecordHref("/labs", item.id),
      tone: getLabTone(item.flag),
      source: "Lab result",
    })),
    ...vitals.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "VITAL",
      title: "Vital record",
      description:
        [
          item.systolic && item.diastolic ? `BP ${item.systolic}/${item.diastolic}` : null,
          item.heartRate ? `HR ${item.heartRate}` : null,
          item.temperatureC ? `Temp ${item.temperatureC}°C` : null,
          item.bloodSugar ? `Sugar ${item.bloodSugar}` : null,
          item.oxygenSaturation ? `SpO2 ${item.oxygenSaturation}%` : null,
          item.weightKg ? `Weight ${item.weightKg}kg` : null,
          item.readingSource !== "MANUAL" ? `Source: ${item.readingSource}` : null,
        ]
          .filter(Boolean)
          .join(" • ") || "Vital record added",
      occurredAt: item.recordedAt,
      href: buildRecordHref("/vitals", item.id),
      tone: "info",
      source: "Vital record",
    })),
    ...symptoms.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "SYMPTOM",
      title: item.title,
      description: [item.severity, item.resolved ? "Resolved" : "Unresolved", item.bodyArea, item.duration, item.notes].filter(Boolean).join(" • "),
      occurredAt: item.startedAt,
      href: buildRecordHref("/symptoms", item.id),
      tone: getSymptomTone(item.severity, item.resolved),
      source: "Symptom",
    })),
    ...vaccinations.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "VACCINATION",
      title: item.vaccineName,
      description: [`Dose ${item.doseNumber}`, item.location, item.nextDueDate ? `Next due ${item.nextDueDate.toLocaleDateString()}` : null].filter(Boolean).join(" • "),
      occurredAt: item.dateTaken,
      href: buildRecordHref("/vaccinations", item.id),
      tone: "success",
      source: "Vaccination",
    })),
    ...documents.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "DOCUMENT",
      title: item.title,
      description: [item.type, item.fileName, item.linkedRecordType ? `Linked to ${item.linkedRecordType}` : "Unlinked", item.notes].filter(Boolean).join(" • "),
      occurredAt: item.createdAt,
      href: buildRecordHref("/documents", item.id),
      tone: item.linkedRecordType ? "success" : "neutral",
      source: "Document",
    })),
    ...reminders.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "REMINDER",
      title: item.title,
      description: [item.description, item.type.replaceAll("_", " "), item.state].filter(Boolean).join(" • "),
      occurredAt: item.dueAt,
      href: buildRecordHref("/reminders", item.id),
      tone: getReminderTone(item.state, item.completed),
      source: "Reminder",
    })),
    ...alerts.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "ALERT",
      title: item.title,
      description: [item.message, item.severity, item.status].filter(Boolean).join(" • "),
      occurredAt: item.createdAt,
      href: `/alerts/${item.id}`,
      tone:
        item.severity === "CRITICAL"
          ? "danger"
          : item.severity === "HIGH"
            ? "warning"
            : item.status === "RESOLVED"
              ? "success"
              : "info",
      source: "Alert",
    })),
    ...careNotes.map((item): TimelineItem => withTimelineMeta({
      id: item.id,
      type: "CARE_NOTE",
      title: item.title,
      description: summarizeCareNoteForWorkflow({
        title: item.title,
        body: item.body,
        category: item.category,
        priority: item.priority,
        visibility: item.visibility,
        pinned: item.pinned,
        authorName: item.author.name || item.author.email,
      }),
      occurredAt: item.createdAt,
      href: "/care-notes",
      tone: careNoteWorkflowTone(item.priority),
      source: "Care note",
    })),
  ];

  const sorted = items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, limit);

  if (!filters) return sorted;

  const appliedFilters = {
    type: normalizeFilterValue(filters.type),
    tone: normalizeFilterValue(filters.tone),
    q: filters.q?.trim() ?? "",
    from: filters.from?.trim() ?? "",
    to: filters.to?.trim() ?? "",
  };

  return applyTimelineFilters(sorted, appliedFilters);
}

export async function getTimelineWorkspaceData(userId: string, filters: TimelineFilters = {}): Promise<TimelineWorkspaceData> {
  const appliedFilters = {
    type: normalizeFilterValue(filters.type),
    tone: normalizeFilterValue(filters.tone),
    q: filters.q?.trim() ?? "",
    from: filters.from?.trim() ?? "",
    to: filters.to?.trim() ?? "",
  };
  const allItems = await getTimelineItems(userId, 220);
  const visibleItems = applyTimelineFilters(allItems, appliedFilters);
  const groups = groupTimelineItems(visibleItems);
  const availableTypes = Array.from(new Set(allItems.map((item) => item.type))).sort();
  const availableTones = Array.from(new Set(allItems.map((item) => item.tone))).sort();

  return {
    allItems,
    visibleItems,
    groups,
    availableTypes,
    availableTones,
    appliedFilters,
    summary: {
      totalItems: allItems.length,
      visibleItems: visibleItems.length,
      urgentItems: visibleItems.filter((item) => item.riskLevel === "urgent").length,
      watchItems: visibleItems.filter((item) => item.riskLevel === "watch").length,
      documentItems: visibleItems.filter((item) => item.type === "DOCUMENT").length,
      recordTypesCovered: availableTypes.length,
      newestItemAt: allItems[0]?.occurredAt ?? null,
      oldestItemAt: allItems.at(-1)?.occurredAt ?? null,
    },
  };
}
