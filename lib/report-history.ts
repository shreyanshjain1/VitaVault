import { SavedReportStatus } from "@prisma/client";
import { getReportBuilderPreset, type ReportSectionKey, type ReportType } from "@/lib/report-builder-presets";

export type SavedReportHistoryTone = "neutral" | "info" | "success" | "warning" | "danger";

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
};

export type SavedReportStats = {
  total: number;
  generated: number;
  review: number;
  shared: number;
  archived: number;
  averageReadiness: number;
};

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
}): SavedReportHistoryItem {
  const sections = parseSavedReportSections(report.sectionsJson);
  const rangeLabel = formatSavedReportRange(report.fromDate, report.toDate);
  const preset = getReportBuilderPreset(report.presetId || undefined);

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
  };
}

export function summarizeSavedReportStats(reports: Array<{ status: SavedReportStatus; readinessScore: number }>): SavedReportStats {
  const total = reports.length;
  const byStatus = reports.reduce(
    (acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    },
    {} as Record<SavedReportStatus, number>,
  );

  return {
    total,
    generated: byStatus[SavedReportStatus.GENERATED] || 0,
    review: byStatus[SavedReportStatus.REVIEW] || 0,
    shared: byStatus[SavedReportStatus.SHARED] || 0,
    archived: byStatus[SavedReportStatus.ARCHIVED] || 0,
    averageReadiness: total > 0 ? Math.round(reports.reduce((sum, report) => sum + report.readinessScore, 0) / total) : 0,
  };
}
