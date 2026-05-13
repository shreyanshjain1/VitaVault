import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@prisma/client", () => ({
  AlertSeverity: {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  AlertStatus: {
    OPEN: "OPEN",
  },
  AppointmentStatus: {
    UPCOMING: "UPCOMING",
  },
  LabFlag: {
    NORMAL: "NORMAL",
    BORDERLINE: "BORDERLINE",
    HIGH: "HIGH",
    LOW: "LOW",
  },
  MedicationStatus: {
    ACTIVE: "ACTIVE",
  },
  ReminderState: {
    DUE: "DUE",
    OVERDUE: "OVERDUE",
    SENT: "SENT",
  },
}));

describe("visit prep readiness helpers", () => {
  const now = new Date("2026-05-13T08:00:00.000Z");
  const appointmentAt = new Date("2026-05-20T08:00:00.000Z");

  it("formats visit countdown labels", async () => {
    const { formatVisitCountdown } = await import("@/lib/visit-prep");

    expect(formatVisitCountdown(null, now)).toBe("No visit scheduled");
    expect(formatVisitCountdown(now, now)).toBe("Today");
    expect(
      formatVisitCountdown(new Date("2026-05-14T08:00:00.000Z"), now),
    ).toBe("Tomorrow");
    expect(formatVisitCountdown(appointmentAt, now)).toBe("In 7 days");
    expect(
      formatVisitCountdown(new Date("2026-05-10T08:00:00.000Z"), now),
    ).toBe("3 days ago");
  });

  it("classifies visit readiness into reviewer-friendly states", async () => {
    const { getVisitReadinessSignal } = await import("@/lib/visit-prep");

    expect(
      getVisitReadinessSignal({
        readinessScore: 90,
        criticalTasks: 0,
        highTasks: 0,
        hasNextAppointment: true,
      }).state,
    ).toBe("ready");

    expect(
      getVisitReadinessSignal({
        readinessScore: 72,
        criticalTasks: 0,
        highTasks: 1,
        hasNextAppointment: true,
      }).state,
    ).toBe("needs-review");

    expect(
      getVisitReadinessSignal({
        readinessScore: 42,
        criticalTasks: 1,
        highTasks: 0,
        hasNextAppointment: true,
      }).state,
    ).toBe("blocked");

    expect(
      getVisitReadinessSignal({
        readinessScore: 80,
        criticalTasks: 0,
        highTasks: 0,
        hasNextAppointment: false,
      }).state,
    ).toBe("no-visit");
  });

  it("groups timeline items around the appointment window", async () => {
    const { getVisitTimelineBucket } = await import("@/lib/visit-prep");

    expect(
      getVisitTimelineBucket(
        new Date("2026-05-20T10:00:00.000Z"),
        appointmentAt,
        now,
      ),
    ).toBe("visit-window");
    expect(
      getVisitTimelineBucket(
        new Date("2026-05-15T08:00:00.000Z"),
        appointmentAt,
        now,
      ),
    ).toBe("before-visit");
    expect(
      getVisitTimelineBucket(
        new Date("2026-05-25T08:00:00.000Z"),
        appointmentAt,
        now,
      ),
    ).toBe("after-visit");
    expect(
      getVisitTimelineBucket(
        new Date("2026-04-01T08:00:00.000Z"),
        appointmentAt,
        now,
      ),
    ).toBe("recent-context");
  });

  it("adds proximity and action labels that explain timeline relevance", async () => {
    const { formatTimelineProximity, getVisitPrepActionLabel } =
      await import("@/lib/visit-prep");

    expect(
      formatTimelineProximity(
        new Date("2026-05-19T08:00:00.000Z"),
        appointmentAt,
        now,
      ),
    ).toBe("1 day before visit");
    expect(
      formatTimelineProximity(
        new Date("2026-05-23T08:00:00.000Z"),
        appointmentAt,
        now,
      ),
    ).toBe("3 days after visit");
    expect(getVisitPrepActionLabel("lab")).toBe("Review result");
    expect(getVisitPrepActionLabel("document")).toBe("Attach to visit packet");
  });

  it("builds ordered non-empty timeline groups", async () => {
    const { buildVisitTimelineGroups } = await import("@/lib/visit-prep");
    const items = [
      {
        id: "lab-1",
        title: "CBC",
        detail: "Flagged result",
        at: new Date("2026-05-15T08:00:00.000Z"),
        source: "lab" as const,
        href: "/labs",
        bucket: "before-visit" as const,
        proximityLabel: "5 days before visit",
        actionLabel: "Review result",
      },
      {
        id: "appointment-1",
        title: "Cardiology follow-up",
        detail: "Dr. Santos",
        at: appointmentAt,
        source: "appointment" as const,
        href: "/appointments",
        bucket: "visit-window" as const,
        proximityLabel: "Visit day",
        actionLabel: "Confirm visit details",
      },
    ];

    const groups = buildVisitTimelineGroups(items);

    expect(groups.map((group) => group.bucket)).toEqual([
      "visit-window",
      "before-visit",
    ]);
    expect(groups[0]?.items[0]?.actionLabel).toBe("Confirm visit details");
  });
});
