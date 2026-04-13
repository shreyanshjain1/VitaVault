import { db } from "@/lib/db";
import { getAlertSourceHref, getAlertSourceSummary } from "@/lib/alerts/source";

export async function getAlertList(args?: {
  userId?: string;
  status?: string;
  severity?: string;
  category?: string;
}) {
  const where = {
    ...(args?.userId ? { userId: args.userId } : {}),
    ...(args?.status && args.status !== "ALL" ? { status: args.status as any } : {}),
    ...(args?.severity && args.severity !== "ALL" ? { severity: args.severity as any } : {}),
    ...(args?.category && args.category !== "ALL" ? { category: args.category as any } : {}),
  };

  const alerts = await db.alertEvent.findMany({
    where,
    include: {
      rule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Promise.all(
    alerts.map(async (alert) => ({
      ...alert,
      sourceLabel: alert.sourceType,
      sourceHref: getAlertSourceHref(alert.sourceType, alert.sourceId),
      sourceSummary: await getAlertSourceSummary(alert.sourceType, alert.sourceId),
    }))
  );
}

export async function getAlertDetail(args: { userId: string; alertId: string }) {
  const alert = await db.alertEvent.findFirst({
    where: {
      id: args.alertId,
      userId: args.userId,
    },
    include: {
      rule: true,
      auditLogs: {
        include: {
          actorUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!alert) return null;

  return {
    ...alert,
    sourceHref: getAlertSourceHref(alert.sourceType, alert.sourceId),
    sourceSummary: await getAlertSourceSummary(alert.sourceType, alert.sourceId),
  };
}

export async function getAlertRules(userId?: string) {
  return db.alertRule.findMany({
    where: userId ? { userId } : undefined,
    orderBy: [{ enabled: "desc" }, { updatedAt: "desc" }],
  });
}
