import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const findManyMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
    },
    medication: {
      findMany: findManyMock,
    },
  },
}));

describe("exports route", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    findManyMock.mockReset();
    findUniqueMock.mockReset();
    findUniqueMock.mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      deactivatedAt: null,
    });
  });

  it("returns 404 json for an unknown export type", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });

    const { GET } = await import("@/app/exports/[type]/route");
    const response = await GET(new Request("http://localhost/exports/nope"), {
      params: Promise.resolve({ type: "nope" }),
    } as never);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Unknown export type.");
  });

  it("returns medication data as CSV for the current user", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findManyMock.mockResolvedValue([
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        instructions: "After meals",
        schedules: [{ timeOfDay: "08:00" }, { timeOfDay: "20:00" }],
        startDate: new Date("2026-04-20T08:00:00.000Z"),
        endDate: null,
        status: "",
        active: false,
        doctor: null,
        createdAt: new Date("2026-04-20T08:00:00.000Z"),
      },
    ]);

    const { GET } = await import("@/app/exports/[type]/route");
    const response = await GET(new Request("http://localhost/exports/medications"), {
      params: Promise.resolve({ type: "medications" }),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("medications-");
    const csv = await response.text();
    expect(csv).toContain("Name,Dosage,Frequency,Instructions,Times");
    expect(csv).toContain("Metformin");
    expect(csv).toContain("08:00, 20:00");
  });
});
