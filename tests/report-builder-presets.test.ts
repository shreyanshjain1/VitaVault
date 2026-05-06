import { describe, expect, it } from "vitest";
import {
  buildReportBuilderHref,
  buildReportPrintHref,
  getReportBuilderPreset,
  reportBuilderPresets,
  resolveReportBuilderControls,
} from "@/lib/report-builder-presets";

describe("report builder presets", () => {
  it("keeps every preset tied to at least one report section", () => {
    expect(reportBuilderPresets.length).toBeGreaterThanOrEqual(5);
    expect(reportBuilderPresets.every((preset) => preset.sections.length > 0)).toBe(true);
  });

  it("resolves a doctor visit preset into a dated provider packet", () => {
    const resolved = resolveReportBuilderControls({ preset: "doctor-visit" }, new Date("2026-05-06T00:00:00.000Z"));

    expect(resolved.presetId).toBe("doctor-visit");
    expect(resolved.reportType).toBe("doctor");
    expect(resolved.sections).toContain("medications");
    expect(resolved.sections).toContain("timeline");
    expect(resolved.from).toBe("2026-02-05");
    expect(resolved.to).toBe("2026-05-06");
  });

  it("allows explicit controls to override preset dates and report type", () => {
    const resolved = resolveReportBuilderControls(
      { preset: "care-team-weekly", reportType: "custom", sections: "profile,alerts", from: "2026-04-01", to: "2026-04-30" },
      new Date("2026-05-06T00:00:00.000Z"),
    );

    expect(resolved.presetId).toBe("care-team-weekly");
    expect(resolved.reportType).toBe("custom");
    expect(resolved.sections).toBe("profile,alerts");
    expect(resolved.from).toBe("2026-04-01");
    expect(resolved.to).toBe("2026-04-30");
  });

  it("builds report and print links from preset controls", () => {
    const baseDate = new Date("2026-05-06T00:00:00.000Z");
    const reportHref = buildReportBuilderHref({ preset: "lab-follow-up" }, baseDate);
    const printHref = buildReportPrintHref({ preset: "lab-follow-up" }, baseDate);

    expect(reportHref).toContain("/report-builder?");
    expect(reportHref).toContain("preset=lab-follow-up");
    expect(reportHref).toContain("type=doctor");
    expect(printHref).toContain("/report-builder/print?");
    expect(printHref).toContain("preset=lab-follow-up");
  });

  it("ignores unknown preset ids safely", () => {
    expect(getReportBuilderPreset("unknown-preset")).toBeUndefined();
    expect(resolveReportBuilderControls({ preset: "unknown-preset" }).reportType).toBe("patient");
  });
});
