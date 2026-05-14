import { describe, expect, it } from "vitest";
import {
  buildDocumentHub,
  buildDocumentReviewCards,
  buildDocumentReviewChecklist,
  filterDocumentsForHub,
  formatDocumentAgeLabel,
  getDocumentNextStep,
  getDocumentReviewState,
  getDocumentReviewStateLabel,
  getDocumentReviewStateTone,
  parseDocumentHubFilters,
} from "@/lib/document-hub";

const now = new Date("2026-05-14T00:00:00.000Z");

function documentFixture(overrides: Partial<Parameters<typeof getDocumentReviewState>[0]> = {}) {
  return {
    id: "doc-1",
    title: "CBC Lab Result",
    type: "LAB_RESULT" as const,
    filePath: "private:cbc.pdf",
    fileName: "cbc.pdf",
    mimeType: "application/pdf",
    sizeBytes: 128_000,
    notes: "Reviewed before the cardiology visit.",
    linkedRecordType: "LAB_RESULT" as const,
    linkedRecordId: "lab-1",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("document intelligence helpers", () => {
  it("classifies review-ready documents", () => {
    const document = documentFixture();

    expect(getDocumentReviewState(document, now)).toBe("ready");
    expect(getDocumentReviewStateLabel("ready")).toBe("Review-ready");
    expect(getDocumentReviewStateTone("ready")).toBe("success");
    expect(buildDocumentReviewChecklist(document, "ready")).toEqual([
      "Ready for visit prep, care-team review, and export packets.",
    ]);
  });

  it("flags documents missing linked context or reviewer notes", () => {
    const needsLink = documentFixture({ linkedRecordType: null, linkedRecordId: null });
    const needsNotes = documentFixture({ notes: "" });

    expect(getDocumentReviewState(needsLink, now)).toBe("needs-link");
    expect(getDocumentNextStep(needsLink, "needs-link")).toContain("Link it");
    expect(buildDocumentReviewChecklist(needsLink, "needs-link")).toContain(
      "Link this file to an appointment, lab result, or doctor."
    );

    expect(getDocumentReviewState(needsNotes, now)).toBe("needs-notes");
    expect(buildDocumentReviewChecklist(needsNotes, "needs-notes")).toContain(
      "Add reviewer notes for provider or caregiver context."
    );
  });

  it("flags stale and missing-source documents for review", () => {
    const stale = documentFixture({
      type: "SCAN",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const missingFile = documentFixture({ filePath: "", sizeBytes: 0 });

    expect(getDocumentReviewState(stale, now)).toBe("stale-review");
    expect(getDocumentReviewStateTone("stale-review")).toBe("info");
    expect(buildDocumentReviewChecklist(stale, "stale-review")).toContain(
      "Confirm whether this document is still current before export or visit prep."
    );

    expect(getDocumentReviewState(missingFile, now)).toBe("missing-file");
    expect(getDocumentReviewStateTone("missing-file")).toBe("danger");
  });

  it("builds prioritized review cards and intelligence summary counts", () => {
    const cards = buildDocumentReviewCards(
      [
        documentFixture({ id: "ready" }),
        documentFixture({ id: "no-link", linkedRecordType: null, linkedRecordId: null }),
        documentFixture({ id: "missing", filePath: "", sizeBytes: 0 }),
        documentFixture({ id: "stale", type: "SCAN", createdAt: new Date("2024-05-01T00:00:00.000Z") }),
      ],
      now
    );

    expect(cards[0]).toMatchObject({ id: "missing", state: "missing-file", tone: "danger" });
    expect(cards.map((card) => card.state)).toEqual(["missing-file", "stale-review", "needs-link", "ready"]);

    const hub = buildDocumentHub(
      [
        documentFixture({ id: "ready" }),
        documentFixture({ id: "no-link", linkedRecordType: null, linkedRecordId: null }),
        documentFixture({ id: "missing", filePath: "", sizeBytes: 0 }),
        documentFixture({ id: "stale", type: "SCAN", createdAt: new Date("2024-05-01T00:00:00.000Z") }),
      ],
      now
    );

    expect(hub.intelligenceSummary).toMatchObject({
      total: 4,
      reviewQueue: 3,
      highPriority: 2,
      missingFile: 1,
      needsLink: 1,
      staleReview: 1,
      ready: 1,
      readinessLabel: "Needs attention",
    });
  });

  it("keeps hub filters and age labels stable", () => {
    const filters = parseDocumentHubFilters({ type: "LAB_RESULT", link: "UNLINKED", quality: "NEEDS_LINK", q: "cbc" });
    const documents = [
      documentFixture({ id: "linked" }),
      documentFixture({ id: "unlinked", linkedRecordType: null, linkedRecordId: null }),
    ];

    expect(filterDocumentsForHub(documents, filters).map((document) => document.id)).toEqual(["unlinked"]);
    expect(formatDocumentAgeLabel(new Date("2026-05-13T00:00:00.000Z"), now)).toBe("Uploaded yesterday");
    expect(formatDocumentAgeLabel(new Date("2025-05-14T00:00:00.000Z"), now)).toBe("Uploaded about 1 year ago");
  });
});
