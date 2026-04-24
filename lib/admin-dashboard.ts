import {
  AlertStatus,
  AppRole,
  CareAccessStatus,
  JobRunStatus,
  ReminderState,
} from "@prisma/client";
import { db } from "@/lib/db";

export type AdminAuditFeedItem = {
  id: string;
  source: "ACCESS" | "ALERT" | "REMINDER";
  action: string;
  createdAt: Date;
  ownerLabel: string;
  actorLabel: string;
  targetLabel: string;
  note: string | null;
};

export async function getAdminWorkspaceData() {
  const now = new Date();

  const [
    totalUsers,
    verifiedUsers,
    adminUsers,
    pendingInvites,
    activeCareAccess,
    openAlerts,
    failedJobs,
    activeMobileSessions,
    recentUsers,
    userRoster,
    recentInvites,
    recentJobRuns,
    accessAuditLogs,
    alertAuditLogs,
    reminderAuditLogs,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { role: AppRole.ADMIN } }),
    db.careInvite.count({ where: { status: CareAccessStatus.PENDING } }),
    db.careAccess.count({ where: { status: CareAccessStatus.ACTIVE } }),
    db.alertEvent.count({ where: { status: AlertStatus.OPEN } }),
    db.jobRun.count({ where: { status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } } }),
    db.mobileSessionToken.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    }),
    db.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            reminders: true,
            alertEvents: true,
            documents: true,
            mobileSessionTokens: true,
          },
        },
      },
    }),
    db.careInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        accessRole: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        grantedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    db.jobRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        jobKind: true,
        jobName: true,
        queueName: true,
        status: true,
        createdAt: true,
        errorMessage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.accessAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        metadataJson: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    db.alertAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        note: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
        alert: { select: { id: true, title: true } },
        rule: { select: { id: true, name: true } },
      },
    }),
    db.reminderAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        note: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
        reminder: { select: { id: true, title: true, state: true } },
      },
    }),
  ]);

  const auditFeed: AdminAuditFeedItem[] = [
    ...accessAuditLogs.map((log) => ({
      id: `access-${log.id}`,
      source: "ACCESS" as const,
      action: log.action,
      createdAt: log.createdAt,
      ownerLabel: log.owner.name || log.owner.email || log.owner.id,
      actorLabel: log.actor?.name || log.actor?.email || "System",
      targetLabel: [log.targetType, log.targetId].filter(Boolean).join(" • ") || "Account access",
      note: log.metadataJson,
    })),
    ...alertAuditLogs.map((log) => ({
      id: `alert-${log.id}`,
      source: "ALERT" as const,
      action: log.action,
      createdAt: log.createdAt,
      ownerLabel: log.user.name || log.user.email || log.user.id,
      actorLabel: log.actor?.name || log.actor?.email || "System",
      targetLabel: log.alert?.title || log.rule?.name || "Alert workflow",
      note: log.note,
    })),
    ...reminderAuditLogs.map((log) => ({
      id: `reminder-${log.id}`,
      source: "REMINDER" as const,
      action: log.action,
      createdAt: log.createdAt,
      ownerLabel: log.user.name || log.user.email || log.user.id,
      actorLabel: log.actor?.name || log.actor?.email || "System",
      targetLabel: log.reminder?.title || `Reminder ${log.reminder?.state || ReminderState.DUE}`,
      note: log.note,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 16);

  return {
    summary: {
      totalUsers,
      verifiedUsers,
      adminUsers,
      pendingInvites,
      activeCareAccess,
      openAlerts,
      failedJobs,
      activeMobileSessions,
    },
    recentUsers,
    userRoster,
    recentInvites,
    recentJobRuns,
    auditFeed,
  };
}
