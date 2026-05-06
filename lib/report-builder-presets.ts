export type ReportSectionKey =
  | "profile"
  | "medications"
  | "vitals"
  | "labs"
  | "symptoms"
  | "appointments"
  | "documents"
  | "alerts"
  | "careTeam"
  | "aiInsights"
  | "timeline";

export type ReportType = "patient" | "doctor" | "emergency" | "care" | "custom";

export type ReportPresetId =
  | "doctor-visit"
  | "emergency-handoff"
  | "care-team-weekly"
  | "medication-review"
  | "lab-follow-up";

export type ReportPresetDefinition = {
  id: ReportPresetId;
  label: string;
  description: string;
  reportType: ReportType;
  sections: ReportSectionKey[];
  rangeDays?: number;
  badge: string;
};

export type ReportBuilderControlInput = {
  preset?: string;
  reportType?: string;
  sections?: string;
  from?: string;
  to?: string;
};

export type ResolvedReportBuilderControls = {
  presetId?: ReportPresetId;
  reportType: ReportType;
  sections?: string;
  from: string;
  to: string;
};

export const reportBuilderPresets: ReportPresetDefinition[] = [
  {
    id: "doctor-visit",
    label: "Doctor visit packet",
    description: "Provider-ready summary with medications, vitals, labs, symptoms, appointments, documents, AI context, and timeline.",
    reportType: "doctor",
    sections: ["profile", "medications", "vitals", "labs", "symptoms", "appointments", "documents", "alerts", "aiInsights", "timeline"],
    rangeDays: 90,
    badge: "Provider handoff",
  },
  {
    id: "emergency-handoff",
    label: "Emergency handoff",
    description: "Fast critical snapshot focused on identity, allergies, medications, latest vitals, alerts, and emergency context.",
    reportType: "emergency",
    sections: ["profile", "medications", "vitals", "alerts"],
    badge: "Critical snapshot",
  },
  {
    id: "care-team-weekly",
    label: "Care-team weekly review",
    description: "Collaboration packet for caregivers with alerts, care access, appointments, symptoms, documents, and recent timeline activity.",
    reportType: "care",
    sections: ["profile", "medications", "vitals", "symptoms", "appointments", "documents", "alerts", "careTeam", "timeline"],
    rangeDays: 7,
    badge: "Care review",
  },
  {
    id: "medication-review",
    label: "Medication review",
    description: "Medication-focused packet for adherence checks, active prescriptions, safety alerts, and provider conversations.",
    reportType: "doctor",
    sections: ["profile", "medications", "vitals", "alerts", "documents", "timeline"],
    rangeDays: 30,
    badge: "Safety check",
  },
  {
    id: "lab-follow-up",
    label: "Lab follow-up",
    description: "Lab-focused packet with abnormal results, related vitals, documents, AI questions, and follow-up timeline.",
    reportType: "doctor",
    sections: ["profile", "labs", "vitals", "documents", "alerts", "aiInsights", "timeline"],
    rangeDays: 180,
    badge: "Results review",
  },
];

const reportTypeValues = new Set<ReportType>(["patient", "doctor", "emergency", "care", "custom"]);

export function asReportType(value: string | undefined): ReportType {
  return value && reportTypeValues.has(value as ReportType) ? (value as ReportType) : "patient";
}

export function getReportBuilderPreset(value: string | undefined) {
  return reportBuilderPresets.find((preset) => preset.id === value);
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function subtractDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() - days);
  return next;
}

function cleanDateInput(value: string | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : value;
}

export function sectionQuery(sections: ReportSectionKey[]) {
  return sections.join(",");
}

export function resolveReportBuilderControls(input: ReportBuilderControlInput = {}, baseDate = new Date()): ResolvedReportBuilderControls {
  const preset = getReportBuilderPreset(input.preset);
  const to = cleanDateInput(input.to) || (preset?.rangeDays ? formatDateInput(baseDate) : "");
  const from = cleanDateInput(input.from) || (preset?.rangeDays ? formatDateInput(subtractDays(baseDate, preset.rangeDays)) : "");

  return {
    presetId: preset?.id,
    reportType: asReportType(input.reportType || preset?.reportType),
    sections: input.sections || (preset ? sectionQuery(preset.sections) : undefined),
    from,
    to,
  };
}

export function buildReportBuilderHref(input: ReportBuilderControlInput = {}, baseDate = new Date()) {
  const resolved = resolveReportBuilderControls(input, baseDate);
  const params = new URLSearchParams();

  if (resolved.presetId) params.set("preset", resolved.presetId);
  params.set("type", resolved.reportType);
  if (resolved.sections) params.set("sections", resolved.sections);
  if (resolved.from) params.set("from", resolved.from);
  if (resolved.to) params.set("to", resolved.to);

  const query = params.toString();
  return `/report-builder${query ? `?${query}` : ""}`;
}

export function buildReportPrintHref(input: ReportBuilderControlInput = {}, baseDate = new Date()) {
  const href = buildReportBuilderHref(input, baseDate);
  return href.replace("/report-builder", "/report-builder/print");
}
