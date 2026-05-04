import { describe, expect, it, vi } from "vitest";
import { LabFlag, SymptomSeverity } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {},
}));

describe("health workflow helper tones", () => {
  it("maps lab flags to review tones", async () => {
    const { getLabFlagTone, getLabPriorityTone } = await import("@/lib/lab-review");

    expect(getLabFlagTone(LabFlag.NORMAL)).toBe("success");
    expect(getLabFlagTone(LabFlag.BORDERLINE)).toBe("warning");
    expect(getLabFlagTone(LabFlag.HIGH)).toBe("danger");
    expect(getLabFlagTone(LabFlag.LOW)).toBe("danger");

    expect(getLabPriorityTone("critical")).toBe("danger");
    expect(getLabPriorityTone("high")).toBe("warning");
    expect(getLabPriorityTone("medium")).toBe("info");
    expect(getLabPriorityTone("low")).toBe("neutral");
  });

  it("maps vital statuses and priorities to monitor tones", async () => {
    const { getVitalStatusTone, getVitalPriorityTone } = await import("@/lib/vitals-monitor");

    expect(getVitalStatusTone("danger")).toBe("danger");
    expect(getVitalStatusTone("watch")).toBe("warning");
    expect(getVitalStatusTone("normal")).toBe("success");
    expect(getVitalStatusTone("missing")).toBe("neutral");

    expect(getVitalPriorityTone("critical")).toBe("danger");
    expect(getVitalPriorityTone("high")).toBe("warning");
    expect(getVitalPriorityTone("medium")).toBe("info");
    expect(getVitalPriorityTone("low")).toBe("neutral");
  });

  it("maps symptom severity and priority to review tones", async () => {
    const { getSymptomSeverityTone, getSymptomPriorityTone } = await import("@/lib/symptom-review");

    expect(getSymptomSeverityTone(SymptomSeverity.SEVERE)).toBe("danger");
    expect(getSymptomSeverityTone(SymptomSeverity.MODERATE)).toBe("warning");
    expect(getSymptomSeverityTone(SymptomSeverity.MILD)).toBe("info");

    expect(getSymptomPriorityTone("critical")).toBe("danger");
    expect(getSymptomPriorityTone("high")).toBe("warning");
    expect(getSymptomPriorityTone("medium")).toBe("info");
    expect(getSymptomPriorityTone("low")).toBe("neutral");
  });
});
