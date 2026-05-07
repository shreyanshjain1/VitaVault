import { describe, expect, it } from "vitest";
import { buildDataQualityCenterData, type DataQualityInput } from "@/lib/data-quality";

const now = new Date("2026-05-07T08:00:00.000Z");
const healthyInput: DataQualityInput = {
  now,
  profile: { fullName: "Demo Patient", dateOfBirth: new Date("1988-01-01T00:00:00.000Z"), sex: "FEMALE", bloodType: "O+", heightCm: 165, weightKg: 67, emergencyContactName: "Care Partner", emergencyContactPhone: "+63 900 000 0000", chronicConditions: "Type 2 diabetes", allergiesSummary: "No known drug allergies" },
  activeMedications: 3,
  medicationsWithoutSchedules: 0,
  medicationLogs30d: 24,
  missedMedicationLogs30d: 0,
  appointments: 3,
  upcomingAppointments: 1,
  doctors: 2,
  labs: 4,
  abnormalLabs: 0,
  latestLabDate: new Date("2026-04-20T00:00:00.000Z"),
  vitals: 12,
  latestVitalDate: new Date("2026-05-06T00:00:00.000Z"),
  symptoms: 2,
  severeOpenSymptoms: 0,
  vaccinations: 2,
  overdueReminders: 0,
  openAlerts: 0,
  highRiskAlerts: 0,
  documents: 5,
  linkedDocuments: 4,
  careTeamMembers: 2,
  activeCareNotes: 3,
  urgentCareNotes: 0,
  activeDeviceConnections: 2,
  staleDeviceConnections: 0,
  errorDeviceConnections: 0,
  recentDeviceReadings: 20,
  failedSyncJobs: 0,
};

describe("data quality center", () => {
  it("returns a healthy score when major quality checks are satisfied", () => {
    const data = buildDataQualityCenterData(healthyInput);
    expect(data.summary.score).toBeGreaterThanOrEqual(85);
    expect(data.summary.criticalItems).toBe(0);
    expect(data.topActions).toHaveLength(0);
    expect(data.sections).toHaveLength(6);
  });

  it("prioritizes profile, safety, device, and export cleanup gaps", () => {
    const data = buildDataQualityCenterData({ ...healthyInput, profile: null, activeMedications: 0, medicationLogs30d: 0, latestVitalDate: new Date("2026-03-01T00:00:00.000Z"), abnormalLabs: 2, severeOpenSymptoms: 1, openAlerts: 3, highRiskAlerts: 1, documents: 3, linkedDocuments: 0, activeDeviceConnections: 1, staleDeviceConnections: 1, errorDeviceConnections: 1, recentDeviceReadings: 0, failedSyncJobs: 2, careTeamMembers: 0, urgentCareNotes: 1 });
    expect(data.summary.score).toBeLessThan(70);
    expect(data.summary.criticalItems).toBeGreaterThanOrEqual(3);
    expect(data.topActions[0]?.severity).toBe("critical");
    expect(data.sections.find((section) => section.id === "devices")?.items.map((item) => item.id)).toContain("device-errors");
    expect(data.sections.find((section) => section.id === "reports")?.items.map((item) => item.id)).toContain("documents-unlinked");
  });

  it("keeps section scores bounded from 0 to 100", () => {
    const data = buildDataQualityCenterData({ ...healthyInput, profile: null, activeMedications: 0, medicationsWithoutSchedules: 5, abnormalLabs: 5, severeOpenSymptoms: 4, overdueReminders: 8, highRiskAlerts: 4, errorDeviceConnections: 3, staleDeviceConnections: 3, failedSyncJobs: 3, urgentCareNotes: 3 });
    for (const section of data.sections) {
      expect(section.score).toBeGreaterThanOrEqual(0);
      expect(section.score).toBeLessThanOrEqual(100);
    }
  });
});
