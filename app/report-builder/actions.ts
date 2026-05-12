"use server";

import { revalidatePath } from "next/cache";
import { SavedReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { buildReportBuilderHref, buildReportPrintHref, getReportBuilderData, sectionQuery } from "@/lib/report-builder";
import { savedReportStatusFromReadiness } from "@/lib/report-history";
import { requireUser } from "@/lib/session";

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parseDateInput(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeTitle(value: string, fallback: string) {
  const title = value.trim();
  return title.length > 0 ? title.slice(0, 140) : fallback;
}

function revalidateReportPages() {
  revalidatePath("/report-builder");
  revalidatePath("/report-builder/print");
  revalidatePath("/exports");
  revalidatePath("/audit-log");
}

async function writeReportAudit(params: { ownerUserId: string; actorUserId: string; action: string; reportId: string; metadata?: Record<string, unknown> }) {
  await db.accessAuditLog.create({
    data: {
      ownerUserId: params.ownerUserId,
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: "SAVED_REPORT",
      targetId: params.reportId,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

async function getOwnedSavedReport(reportId: string, userId: string) {
  if (!reportId) throw new Error("Saved report id is required.");
  const report = await db.savedReport.findFirst({
    where: { id: reportId, userId },
    select: { id: true, title: true, status: true, archivedAt: true, reportType: true, presetId: true, readinessScore: true },
  });
  if (!report) throw new Error("Saved report not found.");
  return report;
}

export async function saveReportPacketAction(formData: FormData) {
  const user = await requireUser();
  const preset = formString(formData, "preset") || undefined;
  const reportType = formString(formData, "reportType") || undefined;
  const sections = formString(formData, "sections") || undefined;
  const from = formString(formData, "from") || undefined;
  const to = formString(formData, "to") || undefined;
  const data = await getReportBuilderData({ preset, reportType, sections, from, to });
  const selectedSections = sectionQuery(data.selectedSections);
  const packetHref = buildReportBuilderHref({ preset: data.selectedPreset?.id, reportType: data.reportType, sections: selectedSections, from: data.range.from, to: data.range.to });
  const printHref = buildReportPrintHref({ preset: data.selectedPreset?.id, reportType: data.reportType, sections: selectedSections, from: data.range.from, to: data.range.to });
  const fallbackTitle = data.selectedPreset ? `${data.selectedPreset.label} - ${new Date().toISOString().slice(0, 10)}` : `${data.reportTitle} - ${new Date().toISOString().slice(0, 10)}`;
  const status = savedReportStatusFromReadiness(data.summary.readinessScore);

  const savedReport = await db.savedReport.create({
    data: {
      userId: user.id!,
      title: safeTitle(formString(formData, "title"), fallbackTitle),
      description: `${data.selectedSections.length} sections • ${data.summary.totalRecords} source records • ${data.summary.readinessScore}% ready • ${data.range.label}`,
      reportType: data.reportType,
      presetId: data.selectedPreset?.id || null,
      sectionsJson: JSON.stringify(data.selectedSections),
      fromDate: parseDateInput(data.range.from),
      toDate: parseDateInput(data.range.to),
      status,
      readinessScore: data.summary.readinessScore,
      recordCount: data.summary.totalRecords,
      highRiskAlerts: data.summary.highRiskAlerts,
      abnormalLabs: data.summary.abnormalLabs,
      unresolvedSymptoms: data.summary.unresolvedSymptoms,
      careNotesCount: data.summary.careNotes,
      documentLinkRate: data.summary.documentLinkRate,
      packetHref,
      printHref,
      sourceSummaryJson: JSON.stringify({
        selectedSections: data.selectedSections,
        actionItems: data.actionItems.map((item) => ({ title: item.title, priority: item.priority, href: item.href })),
        latestTimeline: data.timeline.slice(0, 5).map((item) => ({ type: item.type, title: item.title, risk: item.risk, occurredAt: item.occurredAt.toISOString() })),
      }),
    },
    select: { id: true, status: true, reportType: true, presetId: true, readinessScore: true, recordCount: true },
  });

  await writeReportAudit({
    ownerUserId: user.id!,
    actorUserId: user.id!,
    action: "SAVED_REPORT_CREATED",
    reportId: savedReport.id,
    metadata: { status: savedReport.status, reportType: savedReport.reportType, presetId: savedReport.presetId, readinessScore: savedReport.readinessScore, recordCount: savedReport.recordCount },
  });

  revalidateReportPages();
}

export async function markSavedReportReviewAction(formData: FormData) {
  const user = await requireUser();
  const report = await getOwnedSavedReport(formString(formData, "reportId"), user.id!);
  if (report.archivedAt) throw new Error("Archived reports cannot be moved back to review until restored.");
  await db.savedReport.update({ where: { id: report.id }, data: { status: SavedReportStatus.REVIEW } });
  await writeReportAudit({ ownerUserId: user.id!, actorUserId: user.id!, action: "SAVED_REPORT_MARKED_REVIEW", reportId: report.id, metadata: { previousStatus: report.status } });
  revalidateReportPages();
}

export async function markSavedReportSharedAction(formData: FormData) {
  const user = await requireUser();
  const report = await getOwnedSavedReport(formString(formData, "reportId"), user.id!);
  if (report.archivedAt) throw new Error("Archived reports cannot be marked as shared.");
  await db.savedReport.update({ where: { id: report.id }, data: { status: SavedReportStatus.SHARED } });
  await writeReportAudit({ ownerUserId: user.id!, actorUserId: user.id!, action: "SAVED_REPORT_MARKED_SHARED", reportId: report.id, metadata: { previousStatus: report.status } });
  revalidateReportPages();
}

export async function archiveSavedReportAction(formData: FormData) {
  const user = await requireUser();
  const report = await getOwnedSavedReport(formString(formData, "reportId"), user.id!);
  await db.savedReport.update({ where: { id: report.id }, data: { status: SavedReportStatus.ARCHIVED, archivedAt: new Date() } });
  await writeReportAudit({ ownerUserId: user.id!, actorUserId: user.id!, action: "SAVED_REPORT_ARCHIVED", reportId: report.id, metadata: { previousStatus: report.status } });
  revalidateReportPages();
}

export async function restoreSavedReportAction(formData: FormData) {
  const user = await requireUser();
  const report = await getOwnedSavedReport(formString(formData, "reportId"), user.id!);
  const restoredStatus = savedReportStatusFromReadiness(report.readinessScore);
  await db.savedReport.update({ where: { id: report.id }, data: { status: restoredStatus, archivedAt: null } });
  await writeReportAudit({ ownerUserId: user.id!, actorUserId: user.id!, action: "SAVED_REPORT_RESTORED", reportId: report.id, metadata: { previousStatus: report.status, restoredStatus } });
  revalidateReportPages();
}
