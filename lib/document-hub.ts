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

export type DocumentHubFilterState = {
  q: string;
  type: DocumentType | "ALL";
  link: "ALL" | "LINKED" | "UNLINKED";
  quality: "ALL" | "NEEDS_NOTES" | "NEEDS_LINK" | "READY";
};

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
  | "fileName"
  | "mimeType"
  | "sizeBytes"
  | "notes"
  | "linkedRecordType"
  | "linkedRecordId"
  | "createdAt"
>;

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
    const hasLink = Boolean(document.linkedRecordType && document.linkedRecordId);
    const hasNotes = Boolean(document.notes?.trim());

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

export function buildDocumentHub(documents: HubDocument[]) {
  const total = documents.length;
  const linkedCount = documents.filter((document) => document.linkedRecordType && document.linkedRecordId).length;
  const unlinkedCount = total - linkedCount;
  const notesCount = documents.filter((document) => document.notes?.trim()).length;
  const totalSizeBytes = documents.reduce((sum, document) => sum + document.sizeBytes, 0);
  const readyCount = documents.filter(
    (document) => document.notes?.trim() && document.linkedRecordType && document.linkedRecordId
  ).length;

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
  };
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
