import { type DocumentType, type MedicalDocument } from "@prisma/client";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PRESCRIPTION: "Prescription",
  LAB_RESULT: "Lab Result",
  DISCHARGE_SUMMARY: "Discharge Summary",
  CERTIFICATE: "Consult Note / Certificate",
  SCAN: "Imaging / Scan",
  OTHER: "Other",
};

const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  "PRESCRIPTION",
  "LAB_RESULT",
  "SCAN",
  "DISCHARGE_SUMMARY",
  "CERTIFICATE",
  "OTHER",
];

const STALE_DOCUMENT_DAYS = 180;

export type DocumentHubFilterState = {
  q: string;
  type: DocumentType | "ALL";
  link: "ALL" | "LINKED" | "UNLINKED";
  quality: "ALL" | "NEEDS_NOTES" | "NEEDS_LINK" | "READY";
};

export type DocumentReviewState =
  | "ready"
  | "needs-link"
  | "needs-notes"
  | "stale-review"
  | "missing-file"
  | "needs-review";

export type DocumentReviewTone = "neutral" | "info" | "success" | "warning" | "danger";

export const DOCUMENT_FILTERS = {
  quality: [
    { value: "ALL", label: "All readiness states" },
    { value: "READY", label: "Ready / linked with notes" },
    { value: "NEEDS_LINK", label: "Needs linked record" },
    { value: "NEEDS_NOTES", label: "Needs notes" },
  ] satisfies Array<{ value: DocumentHubFilterState["quality"]; label: string }>,
};

type HubDocument = Pick<
  MedicalDocument,
  | "id"
  | "title"
  | "type"
  | "filePath"
  | "fileName"
  | "mimeType"
  | "sizeBytes"
  | "notes"
  | "linkedRecordType"
  | "linkedRecordId"
  | "createdAt"
>;

export type DocumentReviewCard = {
  id: string;
  title: string;
  type: DocumentType;
  typeLabel: string;
  fileName: string;
  state: DocumentReviewState;
  stateLabel: string;
  tone: DocumentReviewTone;
  reason: string;
  nextStep: string;
  checklist: string[];
  isLinked: boolean;
  hasNotes: boolean;
  hasFile: boolean;
  ageDays: number;
  ageLabel: string;
};

export function parseDocumentHubFilters(
  params: Record<string, string | string[] | undefined>
): DocumentHubFilterState {
  const q = valueOf(params.q);
  const type = parseDocumentType(valueOf(params.type));
  const link = parseOneOf(valueOf(params.link), ["ALL", "LINKED", "UNLINKED"] as const, "ALL");
  const quality = parseOneOf(
    valueOf(params.quality),
    ["ALL", "NEEDS_NOTES", "NEEDS_LINK", "READY"] as const,
    "ALL"
  );

  return { q, type, link, quality };
}

export function filterDocumentsForHub<T extends HubDocument>(
  documents: T[],
  filters: DocumentHubFilterState
): T[] {
  const q = filters.q.toLowerCase();

  return documents.filter((document) => {
    const hasLink = hasDocumentLink(document);
    const hasNotes = hasDocumentNotes(document);

    if (filters.type !== "ALL" && document.type !== filters.type) return false;
    if (filters.link === "LINKED" && !hasLink) return false;
    if (filters.link === "UNLINKED" && hasLink) return false;
    if (filters.quality === "READY" && (!hasLink || !hasNotes)) return false;
    if (filters.quality === "NEEDS_LINK" && hasLink) return false;
    if (filters.quality === "NEEDS_NOTES" && hasNotes) return false;

    if (!q) return true;

    const haystack = [
      document.title,
      document.fileName,
      document.mimeType,
      document.notes ?? "",
      DOCUMENT_TYPE_LABELS[document.type],
      document.linkedRecordType ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function buildDocumentHub(documents: HubDocument[], now = new Date()) {
  const total = documents.length;
  const linkedCount = documents.filter((document) => hasDocumentLink(document)).length;
  const unlinkedCount = total - linkedCount;
  const notesCount = documents.filter((document) => hasDocumentNotes(document)).length;
  const totalSizeBytes = documents.reduce((sum, document) => sum + document.sizeBytes, 0);
  const readyCount = documents.filter((document) => isDocumentReviewReady(document)).length;
  const reviewCards = buildDocumentReviewCards(documents, now);
  const intelligenceSummary = buildDocumentIntelligenceSummary(reviewCards);

  const linkCoverage = percentage(linkedCount, total);
  const notesCoverage = percentage(notesCount, total);
  const readinessScore = percentage(readyCount, total);

  const typeBreakdown = DOCUMENT_TYPE_ORDER.map((type) => ({
    type,
    label: DOCUMENT_TYPE_LABELS[type],
    count: documents.filter((document) => document.type === type).length,
  }));

  const reviewItems = [
    {
      title: "Linked clinical context",
      description:
        unlinkedCount === 0
          ? "Every document is connected to a source record."
          : `${unlinkedCount} document${unlinkedCount === 1 ? "" : "s"} should be linked to an appointment, lab, or doctor.`,
      status: unlinkedCount === 0 ? "Ready" : "Needs review",
      tone: unlinkedCount === 0 ? "success" : "warning",
    },
    {
      title: "Reviewer notes",
      description:
        notesCount === total
          ? "Every document has notes for future context."
          : `${Math.max(total - notesCount, 0)} document${total - notesCount === 1 ? "" : "s"} still need notes.`,
      status: notesCount === total ? "Ready" : "Needs notes",
      tone: notesCount === total ? "success" : "warning",
    },
    {
      title: "Protected source files",
      description:
        total === 0
          ? "Upload a document to start the protected library."
          : "Uploaded files remain available through protected document download routes.",
      status: total === 0 ? "Waiting" : "Protected",
      tone: total === 0 ? "neutral" : "success",
    },
  ] as const;

  return {
    total,
    linkedCount,
    unlinkedCount,
    notesCount,
    readyCount,
    linkCoverage,
    notesCoverage,
    readinessScore,
    readinessLabel: readinessScore >= 80 ? "Review-ready" : readinessScore >= 40 ? "Improving" : "Needs cleanup",
    totalSizeLabel: formatBytes(totalSizeBytes),
    typeBreakdown,
    reviewItems,
    reviewCards,
    intelligenceSummary,
  };
}

export function buildDocumentReviewCards(documents: HubDocument[], now = new Date()): DocumentReviewCard[] {
  return documents
    .map((document) => {
      const state = getDocumentReviewState(document, now);
      return {
        id: document.id,
        title: document.title,
        type: document.type,
        typeLabel: DOCUMENT_TYPE_LABELS[document.type],
        fileName: document.fileName,
        state,
        stateLabel: getDocumentReviewStateLabel(state),
        tone: getDocumentReviewStateTone(state),
        reason: getDocumentReviewReason(document, state, now),
        nextStep: getDocumentNextStep(document, state),
        checklist: buildDocumentReviewChecklist(document, state),
        isLinked: hasDocumentLink(document),
        hasNotes: hasDocumentNotes(document),
        hasFile: hasDocumentSourceFile(document),
        ageDays: getDocumentAgeDays(document, now),
        ageLabel: formatDocumentAgeLabel(document.createdAt, now),
      };
    })
    .sort((a, b) => documentReviewPriority(b.state) - documentReviewPriority(a.state) || b.ageDays - a.ageDays);
}

export function buildDocumentIntelligenceSummary(cards: DocumentReviewCard[]) {
  const reviewQueue = cards.filter((card) => card.state !== "ready").length;
  const missingFile = cards.filter((card) => card.state === "missing-file").length;
  const needsLink = cards.filter((card) => card.state === "needs-link").length;
  const needsNotes = cards.filter((card) => card.state === "needs-notes").length;
  const staleReview = cards.filter((card) => card.state === "stale-review").length;
  const ready = cards.filter((card) => card.state === "ready").length;
  const highPriority = cards.filter((card) => card.tone === "danger" || card.state === "stale-review").length;

  return {
    total: cards.length,
    reviewQueue,
    highPriority,
    missingFile,
    needsLink,
    needsNotes,
    staleReview,
    ready,
    readinessLabel: reviewQueue === 0 ? "Review-ready" : highPriority > 0 ? "Needs attention" : "Needs cleanup",
  };
}

export function getDocumentReviewState(document: HubDocument, now = new Date()): DocumentReviewState {
  const hasFile = hasDocumentSourceFile(document);
  const hasLink = hasDocumentLink(document);
  const hasNotes = hasDocumentNotes(document);
  const ageDays = getDocumentAgeDays(document, now);

  if (!hasFile) return "missing-file";
  if (!hasLink && !hasNotes) return ageDays >= STALE_DOCUMENT_DAYS ? "stale-review" : "needs-review";
  if (!hasLink) return "needs-link";
  if (!hasNotes) return "needs-notes";
  if (ageDays >= STALE_DOCUMENT_DAYS && document.type !== "PRESCRIPTION") return "stale-review";
  return "ready";
}

export function getDocumentReviewStateLabel(state: DocumentReviewState) {
  switch (state) {
    case "ready":
      return "Review-ready";
    case "needs-link":
      return "Needs linked record";
    case "needs-notes":
      return "Needs reviewer notes";
    case "stale-review":
      return "Stale review";
    case "missing-file":
      return "Missing source file";
    case "needs-review":
      return "Needs review";
  }
}

export function getDocumentReviewStateTone(state: DocumentReviewState): DocumentReviewTone {
  switch (state) {
    case "ready":
      return "success";
    case "needs-link":
    case "needs-notes":
      return "warning";
    case "stale-review":
      return "info";
    case "missing-file":
      return "danger";
    case "needs-review":
      return "warning";
  }
}

export function getDocumentReviewReason(document: HubDocument, state: DocumentReviewState, now = new Date()) {
  switch (state) {
    case "ready":
      return "This file has source storage, reviewer notes, and linked clinical context.";
    case "needs-link":
      return "The file has notes but is not connected to an appointment, lab result, or doctor record yet.";
    case "needs-notes":
      return "The file is linked to a clinical record but still needs notes explaining why it matters.";
    case "stale-review":
      return `This file is ${formatDocumentAgeLabel(document.createdAt, now).toLowerCase()} and should be rechecked before visits or exports.`;
    case "missing-file":
      return "The document metadata exists, but the secure source file path or file size is missing.";
    case "needs-review":
      return "The file needs both reviewer notes and a linked clinical context before it is handoff-ready.";
  }
}

export function getDocumentNextStep(document: HubDocument, state: DocumentReviewState) {
  switch (state) {
    case "ready":
      return "Keep this document available for visit prep, care-team review, and export packets.";
    case "needs-link":
      return "Link it to the matching appointment, lab result, or doctor profile.";
    case "needs-notes":
      return "Add a short note describing the result, instruction, or reason it should be reviewed.";
    case "stale-review":
      return document.type === "LAB_RESULT"
        ? "Confirm whether this result is still relevant or superseded by a newer lab."
        : "Recheck the document and update notes before sharing it.";
    case "missing-file":
      return "Re-upload the source file or remove the incomplete record if it was created by mistake.";
    case "needs-review":
      return "Add notes and connect this file to its most relevant clinical record.";
  }
}

export function buildDocumentReviewChecklist(document: HubDocument, state: DocumentReviewState) {
  const checklist: string[] = [];

  if (!hasDocumentSourceFile(document)) {
    checklist.push("Restore or re-upload the protected source file.");
  }

  if (!hasDocumentLink(document)) {
    checklist.push("Link this file to an appointment, lab result, or doctor.");
  }

  if (!hasDocumentNotes(document)) {
    checklist.push("Add reviewer notes for provider or caregiver context.");
  }

  if (state === "stale-review") {
    checklist.push("Confirm whether this document is still current before export or visit prep.");
  }

  if (!checklist.length) {
    checklist.push("Ready for visit prep, care-team review, and export packets.");
  }

  return checklist;
}

export function formatDocumentAgeLabel(createdAt: Date, now = new Date()) {
  const days = Math.max(0, getAgeDays(createdAt, now));
  if (days === 0) return "Uploaded today";
  if (days === 1) return "Uploaded yesterday";
  if (days < 30) return `Uploaded ${days} days ago`;
  const months = Math.max(1, Math.round(days / 30));
  if (months < 12) return `Uploaded about ${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.max(1, Math.round(days / 365));
  return `Uploaded about ${years} year${years === 1 ? "" : "s"} ago`;
}

function hasDocumentLink(document: HubDocument) {
  return Boolean(document.linkedRecordType && document.linkedRecordId);
}

function hasDocumentNotes(document: HubDocument) {
  return Boolean(document.notes?.trim());
}

function hasDocumentSourceFile(document: HubDocument) {
  return Boolean(document.filePath?.trim() && document.fileName?.trim() && document.sizeBytes > 0);
}

function isDocumentReviewReady(document: HubDocument) {
  return hasDocumentSourceFile(document) && hasDocumentNotes(document) && hasDocumentLink(document);
}

function getDocumentAgeDays(document: HubDocument, now: Date) {
  return getAgeDays(document.createdAt, now);
}

function getAgeDays(createdAt: Date, now: Date) {
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}

function documentReviewPriority(state: DocumentReviewState) {
  switch (state) {
    case "missing-file":
      return 6;
    case "stale-review":
      return 5;
    case "needs-review":
      return 4;
    case "needs-link":
      return 3;
    case "needs-notes":
      return 2;
    case "ready":
      return 1;
  }
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function parseDocumentType(value: string): DocumentHubFilterState["type"] {
  return DOCUMENT_TYPE_ORDER.includes(value as DocumentType) ? (value as DocumentType) : "ALL";
}

function parseOneOf<const T extends readonly string[]>(value: string, allowed: T, fallback: T[number]): T[number] {
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
