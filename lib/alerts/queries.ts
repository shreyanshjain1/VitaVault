import { AlertStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type AlertListFilters = {
  ownerUserId: string;
  actorUserId: string;
  isOwner: boolean;
  status?: AlertStatus | "ALL";
  severity?: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: "ALL" | "VITAL_THRESHOLD" | "MEDICATION_ADHERENCE" | "SYMPTOM_SEVERITY" | "SYNC_HEALTH";
  includeHidden?: boolean;
};

export async function getAlertList(filters: AlertListFilters) {
  const where: Prisma.AlertEventWhereInput = {
    userId: filters.ownerUserId,
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.severity && filters.severity !== "ALL"
      ? { severity: filters.severity }
      : {}),
    ...(filters.category && filters.category !== "ALL"
      ? { category: filters.category }
      : {}),
  };

  if (!filters.isOwner && !filters.includeHidden) {
    where.visibleToCareTeam = true;
  }

  return db.alertEvent.findMany({
    where,
    include: {
      rule: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAlertDetail(args: {
  ownerUserId: string;
  isOwner: boolean;
  alertId: string;
}) {
  const alert = await db.alertEvent.findFirst({
    where: {
      id: args.alertId,
      userId: args.ownerUserId,
      ...(args.isOwner ? {} : { visibleToCareTeam: true }),
    },
    include: {
      rule: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return alert;
}

export async function getAlertRules(ownerUserId: string) {
  return db.alertRule.findMany({
    where: { userId: ownerUserId },
    orderBy: [{ enabled: "desc" }, { severity: "desc" }, { updatedAt: "desc" }],
  });
}
