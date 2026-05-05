import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const healthProfileFindUniqueMock = vi.fn();
const countMock = vi.fn();

vi.mock("@/lib/session", () => ({
  requireUser: requireUserMock,
}));

vi.mock("@/lib/export-definitions", () => ({
  exportDefinitions: [
    { type: "medications", label: "Medications" },
    { type: "labs", label: "Labs" },
    { type: "vitals", label: "Vitals" },
  ],
}));

vi.mock("@/lib/db", () => ({
  db: {
    healthProfile: { findUnique: healthProfileFindUniqueMock },
    medication: { count: countMock },
    medicationLog: { count: countMock },
    appointment: { count: countMock },
    labResult: { count: countMock },
    vitalRecord: { count: countMock },
    symptomEntry: { count: countMock },
    vaccinationRecord: { count: countMock },
    medicalDocument: { count: countMock },
    reminder: { count: countMock },
    alertEvent: { count: countMock },
    doctor: { count: countMock },
  },
}));

describe("export center data", () => {
  beforeEach(() => {
    vi.resetModules();
    requireUserMock.mockReset();
    healthProfileFindUniqueMock.mockReset();
    countMock.mockReset();

    requireUserMock.mockResolvedValue({ id: "user_1", role: "PATIENT" });
  });

  it("builds readiness, packet, and pre-export action signals", async () => {
    healthProfileFindUniqueMock.mockResolvedValue({
      fullName: "Demo Patient",
      dateOfBirth: new Date("1998-01-01T00:00:00.000Z"),
      emergencyContactName: "Demo Contact",
      emergencyContactPhone: "+639000000000",
    });

    countMock
      .mockResolvedValueOnce(2) // medications
      .mockResolvedValueOnce(10) // medication logs 30d
      .mockResolvedValueOnce(2) // missed/skipped medication logs 30d
      .mockResolvedValueOnce(3) // appointments
      .mockResolvedValueOnce(1) // upcoming appointments
      .mockResolvedValueOnce(4) // labs
      .mockResolvedValueOnce(2) // abnormal labs
      .mockResolvedValueOnce(5) // vitals
      .mockResolvedValueOnce(3) // symptoms
      .mockResolvedValueOnce(1) // severe open symptoms
      .mockResolvedValueOnce(2) // vaccinations
      .mockResolvedValueOnce(4) // documents
      .mockResolvedValueOnce(2) // linked documents
      .mockResolvedValueOnce(6) // reminders
      .mockResolvedValueOnce(1) // active reminders
      .mockResolvedValueOnce(3) // open alerts
      .mockResolvedValueOnce(1) // high-risk alerts
      .mockResolvedValueOnce(2); // doctors

    const { getExportCenterData } = await import("@/lib/export-center");
    const data = await getExportCenterData();

    expect(data.summary.readinessScore).toBe(100);
    expect(data.summary.csvExportTypes).toBe(3);
    expect(data.summary.reportPackets).toBe(4);
    expect(data.summary.documentLinkRate).toBe(50);
    expect(data.summary.medicationAdherenceRate).toBe(80);
    expect(data.csvCoverage.map((item) => item.label)).toEqual(["Core records", "Monitoring data", "Coordination"]);
    expect(data.packets.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Patient summary packet", "Doctor visit packet", "Emergency health card", "Care plan review workspace"]),
    );
    expect(data.actionItems.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Improve document link coverage", "Review high-risk open alerts", "Add lab review context", "Review severe unresolved symptoms"]),
    );
  });

  it("falls back to a healthy export action when no review items exist", async () => {
    healthProfileFindUniqueMock.mockResolvedValue({
      fullName: "Demo Patient",
      dateOfBirth: new Date("1998-01-01T00:00:00.000Z"),
      emergencyContactName: "Demo Contact",
      emergencyContactPhone: "+639000000000",
    });

    countMock
      .mockResolvedValueOnce(1) // medications
      .mockResolvedValueOnce(4) // medication logs 30d
      .mockResolvedValueOnce(0) // missed/skipped medication logs 30d
      .mockResolvedValueOnce(1) // appointments
      .mockResolvedValueOnce(1) // upcoming appointments
      .mockResolvedValueOnce(1) // labs
      .mockResolvedValueOnce(0) // abnormal labs
      .mockResolvedValueOnce(1) // vitals
      .mockResolvedValueOnce(0) // symptoms
      .mockResolvedValueOnce(0) // severe open symptoms
      .mockResolvedValueOnce(1) // vaccinations
      .mockResolvedValueOnce(2) // documents
      .mockResolvedValueOnce(2) // linked documents
      .mockResolvedValueOnce(1) // reminders
      .mockResolvedValueOnce(0) // active reminders
      .mockResolvedValueOnce(0) // open alerts
      .mockResolvedValueOnce(0) // high-risk alerts
      .mockResolvedValueOnce(1); // doctors

    const { getExportCenterData } = await import("@/lib/export-center");
    const data = await getExportCenterData();

    expect(data.summary.documentLinkRate).toBe(100);
    expect(data.summary.medicationAdherenceRate).toBe(100);
    expect(data.actionItems).toHaveLength(1);
    expect(data.actionItems[0]?.title).toBe("Export readiness looks healthy");
  });
});
