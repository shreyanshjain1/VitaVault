import { describe, expect, it } from "vitest";
import { SavedReportStatus } from "@prisma/client";
import {
  buildSavedReportDescription,
  formatSavedReportRange,
  mapSavedReportToHistoryItem,
  parseSavedReportSections,
  savedReportStatusFromReadiness,
  savedReportStatusLabel,
  savedReportStatusTone,
  summarizeSavedReportStats,
} from "@/lib/report-history";

describe("report history helpers", () => {
  it("maps readiness scores to persisted report status", () => {
    expect(savedReportStatusFromReadiness(92)).toBe(SavedReportStatus.GENERATED);
    expect(savedReportStatusFromReadiness(74)).toBe(SavedReportStatus.REVIEW);
  });

  it("formats report status labels and tones", () => {
    expect(savedReportStatusLabel(SavedReportStatus.SHARED)).toBe("Shared");
    expect(savedReportStatusTone(SavedReportStatus.REVIEW)).toBe("warning");
    expect(savedReportStatusTone(SavedReportStatus.GENERATED)).toBe("success");
  });

  it("safely parses stored section JSON", () => {
    expect(parseSavedReportSections('["profile","labs"]')).toEqual(["profile", "labs"]);
    expect(parseSavedReportSections("not-json")).toEqual([]);
  });

  it("summarizes saved report stats", () => {
    const stats = summarizeSavedReportStats([
      { status: SavedReportStatus.GENERATED, readinessScore: 90 },
      { status: SavedReportStatus.REVIEW, readinessScore: 60 },
      { status: SavedReportStatus.SHARED, readinessScore: 80 },
    ]);

    expect(stats.total).toBe(3);
    expect(stats.generated).toBe(1);
    expect(stats.review).toBe(1);
    expect(stats.shared).toBe(1);
    expect(stats.averageReadiness).toBe(77);
  });

  it("maps database records to history cards", () => {
    const createdAt = new Date("2026-05-01T08:00:00.000Z");
    const item = mapSavedReportToHistoryItem({
      id: "report_1",
      title: "Doctor visit packet",
      description: null,
      reportType: "doctor",
      presetId: "doctor-visit",
      sectionsJson: '["profile","medications","labs"]',
      fromDate: new Date("2026-04-01T00:00:00.000Z"),
      toDate: new Date("2026-05-01T00:00:00.000Z"),
      status: SavedReportStatus.GENERATED,
      readinessScore: 86,
      recordCount: 12,
      packetHref: "/report-builder?type=doctor",
      printHref: "/report-builder/print?type=doctor",
      createdAt,
      updatedAt: createdAt,
    });

    expect(item.presetLabel).toBe("Doctor visit packet");
    expect(item.description).toContain("3 sections");
    expect(item.statusLabel).toBe("Generated");
    expect(item.printHref).toContain("/report-builder/print");
  });

  it("builds stable description and open-ended ranges", () => {
    expect(formatSavedReportRange(undefined, undefined)).toBe("All available records");
    expect(buildSavedReportDescription({ sections: ["profile", "labs"], recordCount: 4, readinessScore: 75, rangeLabel: "All available records" })).toBe("2 sections • 4 source records • 75% ready • All available records");
  });
});
