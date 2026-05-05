import type { CareNoteCategory, CareNotePriority, CareNoteVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOwnerAccess } from "@/lib/access";

export type CareNoteWorkspaceData = Awaited<ReturnType<typeof getCareNoteWorkspaceData>>;

export const careNoteCategoryLabels: Record<CareNoteCategory, string> = {
  GENERAL: "General",
  MEDICATION: "Medication",
  LAB: "Lab",
  SYMPTOM: "Symptom",
  APPOINTMENT: "Appointment",
  CARE_PLAN: "Care plan",
  FAMILY: "Family",
  ADMINISTRATIVE: "Administrative",
};

export const careNotePriorityLabels: Record<CareNotePriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const careNoteVisibilityLabels: Record<CareNoteVisibility, string> = {
  PRIVATE: "Private",
  CARE_TEAM: "Care team",
  PROVIDERS: "Providers",
};

export function careNotePriorityTone(priority: CareNotePriority) {
  if (priority === "URGENT") return "danger" as const;
  if (priority === "HIGH") return "warning" as const;
  if (priority === "LOW") return "neutral" as const;
  return "info" as const;
}

export function careNoteVisibilityDescription(visibility: CareNoteVisibility) {
  if (visibility === "PRIVATE") return "Only the patient owner and note author can see this note.";
  if (visibility === "PROVIDERS") return "Visible to doctors and lab staff with active shared access.";
  return "Visible to the active shared care team.";
}

function displayName(user: { name: string | null; email: string | null; healthProfile?: { fullName: string | null } | null }) {
  return user.healthProfile?.fullName || user.name || user.email || "Unnamed person";
}

export async function getNoteAccessContext(actorUserId: string, ownerUserId: string) {
  return requireOwnerAccess(actorUserId, ownerUserId, "notes");
}

export async function getCareNoteWorkspaceData(actorUserId: string) {
  const [ownedUser, sharedAccesses] = await Promise.all([
    db.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, name: true, email: true, healthProfile: { select: { fullName: true } } },
    }),
    db.careAccess.findMany({
      where: {
        memberUserId: actorUserId,
        status: "ACTIVE",
        canViewRecords: true,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, healthProfile: { select: { fullName: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const ownerIds = [actorUserId, ...sharedAccesses.map((item) => item.ownerUserId)];

  const notes = await db.careNote.findMany({
    where: {
      ownerUserId: { in: ownerIds },
      archivedAt: null,
      OR: [
        { ownerUserId: actorUserId },
        { authorUserId: actorUserId },
        { visibility: "CARE_TEAM" },
        { visibility: "PROVIDERS" },
      ],
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      owner: { select: { id: true, name: true, email: true, healthProfile: { select: { fullName: true } } } },
    },
    orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  const pinnedNotes = notes.filter((note) => note.pinned);
  const urgentNotes = notes.filter((note) => note.priority === "URGENT" || note.priority === "HIGH");
  const authoredByMe = notes.filter((note) => note.authorUserId === actorUserId);

  const categoryBreakdown = Object.entries(careNoteCategoryLabels).map(([key, label]) => ({
    category: key as CareNoteCategory,
    label,
    count: notes.filter((note) => note.category === key).length,
  }));

  const patientOptions = [
    ...(ownedUser
      ? [{ ownerUserId: ownedUser.id, label: `${displayName(ownedUser)} (my record)`, canAddNotes: true }]
      : []),
    ...sharedAccesses.map((access) => ({
      ownerUserId: access.ownerUserId,
      label: displayName(access.owner),
      canAddNotes: access.canAddNotes,
      accessRole: access.accessRole,
    })),
  ];

  return {
    notes,
    pinnedNotes,
    urgentNotes,
    authoredByMe,
    categoryBreakdown,
    patientOptions,
    metrics: {
      total: notes.length,
      pinned: pinnedNotes.length,
      urgent: urgentNotes.length,
      authoredByMe: authoredByMe.length,
      sharedPatients: sharedAccesses.length,
    },
  };
}

export async function getSharedPatientCareNotes(args: {
  actorUserId: string;
  ownerUserId: string;
  canViewProviderOnly?: boolean;
}) {
  const access = await requireOwnerAccess(args.actorUserId, args.ownerUserId, "view");
  const visibilityFilter = access.isOwner
    ? undefined
    : args.canViewProviderOnly
      ? { in: ["CARE_TEAM", "PROVIDERS"] as CareNoteVisibility[] }
      : "CARE_TEAM";

  const notes = await db.careNote.findMany({
    where: {
      ownerUserId: args.ownerUserId,
      archivedAt: null,
      ...(visibilityFilter ? { visibility: visibilityFilter } : {}),
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 12,
  });

  return notes;
}
