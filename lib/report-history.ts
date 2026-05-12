import { SavedReportStatus } from "@prisma/client";
import { getReportBuilderPreset, type ReportSectionKey, type ReportType } from "@/lib/report-builder-presets";

export type SavedReportHistoryTone = "neutral" | "info" | "success" | "warning" | "danger";

export type SavedReportHistoryFilter = "active" | "all" | "draft" | "generated" | "review" | "shared" | "archived";

export type SavedReportHistoryFilterOption = {
  value: SavedReportHistoryFilter;
  label: string;
  description: string;
};

export type SavedReportHistoryItem = {
  id: string;
  title: string;
  description: string;
  reportType: ReportType | string;
  presetLabel?: string;
  status: SavedReportStatus;
  statusLabel: string;
  tone: SavedReportHistoryTone;
  packetHref: string;
  printHref: string;
  recordCount: number;
  readinessScore: number;
  rangeLabel: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date | null;
  isArchived: boolean;
};

export type SavedReportStats = {
  total: number;
  active: number;
  generated: number;
  review: number;
  shared: number;
  archived: number;
  averageReadiness: number;
};

export const savedReportHistoryFilterOptions: SavedReportHistoryFilterOption[] = [
  { value: "active", label: "Active", description: "Generated, review, shared, and draft packets that are still in use." },
  { value: "review", label: "Needs review", description: "Packets that should be checked before sharing." },
  { value: "shared", label: "Shared", description: "Packets already marked as sent or handed off." },
  { value: "archived", label: "Archived", description: "Older packets hidden from the default working view." },
  { value: "all", label: "All", description: "Every saved packet, including archived history." },
];

const savedReportHistoryFilterValues = new Set<SavedReportHistoryFilter>([
  "active",
  "all",
  "draft",
  "generated",
  "review",
  "shared",
  "archived",
]);

export function normalizeSavedReportHistoryFilter(value: string | undefined): SavedReportHistoryFilter {
  const normalized = value?.trim().toLowerCase();
  return normalized && savedReportHistoryFilterValues.has(normalized as SavedReportHistoryFilter) ? (normalized as SavedReportHistoryFilter) : "active";
}

export function savedReportStatusLabel(status: SavedReportStatus) {
  if (status === SavedReportStatus.DRAFT) return "Draft";
  if (status === SavedReportStatus.REVIEW) return "Needs review";
  if (status === SavedReportStatus.SHARED) return "Shared";
  if (status === SavedReportStatus.ARCHIVED) return "Archived";
  return "Generated";
}

export function savedReportStatusTone(status: SavedReportStatus): SavedReportHistoryTone {
  if (status === SavedReportStatus.SHARED) return "success";
  if (status === SavedReportStatus.REVIEW) return "warning";
  if (status === SavedReportStatus.ARCHIVED) return "neutral";
  if (status === SavedReportStatus.DRAFT) return "info";
  return "success";
}

export function savedReportStatusFromReadiness(readinessScore: number) {
  return readinessScore >= 75 ? SavedReportStatus.GENERATED : SavedReportStatus.REVIEW;
}

export function buildSavedReportHistoryWhere(userId: string, filter: SavedReportHistoryFilter) {
  if (filter === "all") return { userId };
  if (filter === "archived") return { userId, archivedAt: { not: null } };
  if (filter === "draft") return { userId, status: SavedReportStatus.DRAFT, archivedAt: null };
  if (filter === "generated") return { userId, status: SavedReportStatus.GENERATED, archivedAt: null };
  if (filter === "review") return { userId, status: SavedReportStatus.REVIEW, archivedAt: null };
  if (filter === "shared") return { userId, status: SavedReportStatus.SHARED, archivedAt: null };
  return { userId, archivedAt: null };
}

export function parseSavedReportSections(value: string | null | undefined): ReportSectionKey[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is ReportSectionKey => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function formatSavedReportRange(fromDate?: Date | null, toDate?: Date | null) {
  const formatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });
  if (!fromDate && !toDate) return "All available records";
  return `${fromDate ? formatter.format(fromDate) : "Beginning"} to ${toDate ? formatter.format(toDate) : "Today"}`;
}

export function buildSavedReportDescription(params: { sections: string[]; recordCount: number; readinessScore: number; rangeLabel: string }) {
  return `${params.sections.length} sections • ${params.recordCount} source records • ${params.readinessScore}% ready • ${params.rangeLabel}`;
}

export function mapSavedReportToHistoryItem(report: {
  id: string;
  title: string;
  description: string | null;
  reportType: string;
  presetId: string | null;
  sectionsJson: string;
  fromDate: Date | null;
  toDate: Date | null;
  status: SavedReportStatus;
  readinessScore: number;
  recordCount: number;
  packetHref: string;
  printHref: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date | null;
}): SavedReportHistoryItem {
  const sections = parseSavedReportSections(report.sectionsJson);
  const rangeLabel = formatSavedReportRange(report.fromDate, report.toDate);
  const preset = getReportBuilderPreset(report.presetId || undefined);
  const isArchived = Boolean(report.archivedAt) || report.status === SavedReportStatus.ARCHIVED;

  return {
    id: report.id,
    title: report.title,
    description: report.description || buildSavedReportDescription({ sections, recordCount: report.recordCount, readinessScore: report.readinessScore, rangeLabel }),
    reportType: report.reportType,
    presetLabel: preset?.label,
    status: report.status,
    statusLabel: savedReportStatusLabel(report.status),
    tone: savedReportStatusTone(report.status),
    packetHref: report.packetHref,
    printHref: report.printHref,
    recordCount: report.recordCount,
    readinessScore: report.readinessScore,
    rangeLabel,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    archivedAt: report.archivedAt,
    isArchived,
  };
}

export function summarizeSavedReportStats(reports: Array<{ status: SavedReportStatus; readinessScore: number; archivedAt?: Date | null }>): SavedReportStats {
  const total = reports.length;
  const byStatus = reports.reduce(
    (acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    },
    {} as Record<SavedReportStatus, number>,
  );

  const archived = reports.filter((report) => report.archivedAt || report.status === SavedReportStatus.ARCHIVED).length;

  return {
    total,
    active: Math.max(0, total - archived),
    generated: byStatus[SavedReportStatus.GENERATED] || 0,
    review: byStatus[SavedReportStatus.REVIEW] || 0,
    shared: byStatus[SavedReportStatus.SHARED] || 0,
    archived,
    averageReadiness: total > 0 ? Math.round(reports.reduce((sum, report) => sum + report.readinessScore, 0) / total) : 0,
  };
}
