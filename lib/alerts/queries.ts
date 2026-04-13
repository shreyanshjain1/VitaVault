import { db } from "@/lib/db";
import type { AlertDetail, AlertListItem } from "@/lib/alerts/types";

type AlertListFilters = {
  ownerUserId: string;
  status?: string;
  severity?: string;
  category?: string;
};

export async function getAlertList(filters: AlertListFilters): Promise<AlertListItem[]> {
  return db.alertEvent.findMany({
    where: {
      userId: filters.ownerUserId,
      ...(filters.status && filters.status !== "ALL" ? { status: filters.status as never } : {}),
      ...(filters.severity && filters.severity !== "ALL" ? { severity: filters.severity as never } : {}),
      ...(filters.category && filters.category !== "ALL" ? { category: filters.category as never } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      rule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getAlertDetail(args: {
  alertId: string;
  ownerUserId: string;
}): Promise<AlertDetail | null> {
  return db.alertEvent.findFirst({
    where: {
      id: args.alertId,
      userId: args.ownerUserId,
    },
    include: {
      rule: {
        select: {
          id: true,
          name: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          note: true,
          metadataJson: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getAlertRules(ownerUserId: string) {
  return db.alertRule.findMany({
    where: {
      userId: ownerUserId,
    },
    orderBy: [{ enabled: "desc" }, { severity: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      metricKey: true,
      enabled: true,
      severity: true,
      visibleToCareTeam: true,
      cooldownMinutes: true,
      lookbackHours: true,
      thresholdOperator: true,
      thresholdValue: true,
      thresholdValueSecondary: true,
      symptomSeverity: true,
      medicationMissedCount: true,
      syncStaleHours: true,
      createdAt: true,
      _count: {
        select: {
          events: true,
        },
      },
    },
  });
}
