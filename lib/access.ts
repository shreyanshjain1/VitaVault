import { CareAccessRole } from "@prisma/client";
import { db } from "@/lib/db";

export type AccessPermission =
  | "view"
  | "edit"
  | "notes"
  | "export"
  | "ai"
  | "alerts";

export type OwnerAccessContext = {
  ownerUserId: string;
  isOwner: boolean;
  accessRole: CareAccessRole | "OWNER";
  canViewRecords: boolean;
  canEditRecords: boolean;
  canAddNotes: boolean;
  canExport: boolean;
  canGenerateAIInsights: boolean;
};

export async function requireOwnerAccess(
  actorUserId: string,
  ownerUserId: string,
  permission: AccessPermission = "view"
): Promise<OwnerAccessContext> {
  if (!actorUserId || !ownerUserId) {
    throw new Error("Invalid access context.");
  }

  if (actorUserId === ownerUserId) {
    return {
      ownerUserId,
      isOwner: true,
      accessRole: "OWNER",
      canViewRecords: true,
      canEditRecords: true,
      canAddNotes: true,
      canExport: true,
      canGenerateAIInsights: true,
    };
  }

  const grant = await db.careAccess.findFirst({
    where: {
      ownerUserId,
      memberUserId: actorUserId,
      status: "ACTIVE",
    },
  });

  if (!grant) {
    throw new Error("Access denied.");
  }

  const allowed =
    permission === "view" || permission === "alerts"
      ? grant.canViewRecords
      : permission === "edit"
      ? grant.canEditRecords
      : permission === "notes"
      ? grant.canAddNotes
      : permission === "export"
      ? grant.canExport
      : grant.canGenerateAIInsights;

  if (!allowed) {
    throw new Error("You do not have permission for this action.");
  }

  return {
    ownerUserId,
    isOwner: false,
    accessRole: grant.accessRole,
    canViewRecords: grant.canViewRecords,
    canEditRecords: grant.canEditRecords,
    canAddNotes: grant.canAddNotes,
    canExport: grant.canExport,
    canGenerateAIInsights: grant.canGenerateAIInsights,
  };
}

export async function logAccessAudit(args: {
  ownerUserId: string;
  actorUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await db.accessAuditLog.create({
    data: {
      ownerUserId: args.ownerUserId,
      actorUserId: args.actorUserId ?? null,
      action: args.action,
      targetType: args.targetType ?? null,
      targetId: args.targetId ?? null,
      metadataJson: args.metadata ? JSON.stringify(args.metadata) : null,
    },
  });
}

export async function getSharedPatientCards(memberUserId: string) {
  return db.careAccess.findMany({
    where: {
      memberUserId,
      status: "ACTIVE",
      canViewRecords: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          healthProfile: {
            select: {
              fullName: true,
              bloodType: true,
              allergiesSummary: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
            },
          },
          ownedAiInsights: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}
