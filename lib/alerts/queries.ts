import { AlertRuleCategory, AlertSeverity, AlertStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveAlertSource } from "@/lib/alerts/source";
import type { AlertDetail, AlertListItem } from "@/lib/alerts/types";

function includeForList() {
  return {
    rule: {
      select: {
        name: true,
      },
    },
  } satisfies Prisma.AlertEventInclude;
}

function includeForDetail() {
  return {
    rule: {
      select: {
        name: true,
      },
    },
    auditLogs: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
  } satisfies Prisma.AlertEventInclude;
}

export async function getAlertList(args: {
  userId: string;
  status?: string;
  severity?: string;
  category?: string;
}) {
  const where: Prisma.AlertEventWhereInput = {
    userId: args.userId,
    ...(args.status && args.status !== "ALL" ? { status: args.status as AlertStatus } : {}),
    ...(args.severity && args.severity !== "ALL" ? { severity: args.severity as AlertSeverity } : {}),
    ...(args.category && args.category !== "ALL" ? { category: args.category as AlertRuleCategory } : {}),
  };

  const rows = await db.alertEvent.findMany({
    where,
    include: includeForList(),
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const withSource: AlertListItem[] = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      ...(await resolveAlertSource({ sourceType: row.sourceType, sourceId: row.sourceId })),
    }))
  );

  return withSource;
}

export async function getAlertDetail(args: { userId: string; alertId: string }) {
  const row = await db.alertEvent.findFirst({
    where: {
      id: args.alertId,
      userId: args.userId,
    },
    include: includeForDetail(),
  });

  if (!row) return null;

  const detail: AlertDetail = {
    ...row,
    ...(await resolveAlertSource({ sourceType: row.sourceType, sourceId: row.sourceId })),
  };

  return detail;
}

export async function getAlertRules(args: { userId: string }) {
  return db.alertRule.findMany({
    where: { userId: args.userId },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: [{ enabled: "desc" }, { updatedAt: "desc" }],
  });
}
