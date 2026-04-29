import {
  AlertSeverity,
  AlertStatus,
  AppRole,
  CareAccessStatus,
  DeviceConnectionStatus,
  JobRunStatus,
  ReminderState,
  SyncJobStatus,
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

export type AdminRiskItem = {
  key: string;
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  detail: string;
};

export async function getAdminWorkspaceData() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
  const staleSyncCutoff = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3);

  const [
    totalUsers,
    verifiedUsers,
    adminUsers,
    pendingInvites,
    activeCareAccess,
    openAlerts,
    criticalOpenAlerts,
    failedJobs,
    failedSyncJobs,
    staleDeviceConnections,
    activeMobileSessions,
    deactivatedUsers,
    recentUsers,
    userRoster,
    recentInvites,
    recentJobRuns,
    accessAuditLogs,
    alertAuditLogs,
    reminderAuditLogs,
    patientUsers,
    caregiverUsers,
    doctorUsers,
    labStaffUsers,
    overdueReminders,
    pendingVerificationUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { role: AppRole.ADMIN } }),
    db.careInvite.count({ where: { status: CareAccessStatus.PENDING } }),
    db.careAccess.count({ where: { status: CareAccessStatus.ACTIVE } }),
    db.alertEvent.count({ where: { status: AlertStatus.OPEN } }),
    db.alertEvent.count({ where: { status: AlertStatus.OPEN, severity: { in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] } } }),
    db.jobRun.count({ where: { status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } } }),
    db.syncJob.count({ where: { status: SyncJobStatus.FAILED } }),
    db.deviceConnection.count({
      where: {
        status: DeviceConnectionStatus.ACTIVE,
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleSyncCutoff } }],
      },
    }),
    db.mobileSessionToken.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
    db.user.count({ where: { deactivatedAt: { not: null } } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true, deactivatedAt: true,
      },
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
        deactivatedAt: true,
        deactivatedReason: true,
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
        id: true, email: true, accessRole: true, status: true, expiresAt: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        grantedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    db.jobRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, jobKind: true, jobName: true, queueName: true, status: true, createdAt: true, errorMessage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.accessAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, action: true, targetType: true, targetId: true, metadataJson: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    db.alertAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, action: true, note: true, createdAt: true,
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
        id: true, action: true, note: true, createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
        reminder: { select: { id: true, title: true, state: true } },
      },
    }),
    db.user.count({ where: { role: AppRole.PATIENT } }),
    db.user.count({ where: { role: AppRole.CAREGIVER } }),
    db.user.count({ where: { role: AppRole.DOCTOR } }),
    db.user.count({ where: { role: AppRole.LAB_STAFF } }),
    db.reminder.count({ where: { state: { in: [ReminderState.OVERDUE, ReminderState.MISSED] } } }),
    db.user.count({ where: { emailVerified: null, deactivatedAt: null } }),
  ]);

  const verificationRate = totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

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

  const operationalRisks: AdminRiskItem[] = [
    {
      key: "critical-alerts",
      label: "High-priority alerts",
      value: criticalOpenAlerts,
      tone: criticalOpenAlerts > 0 ? "danger" : "success",
      detail: criticalOpenAlerts > 0 ? "Critical or high-severity alerts need follow-up." : "No high-priority open alerts.",
    },
    {
      key: "failed-jobs",
      label: "Failed / retrying jobs",
      value: failedJobs,
      tone: failedJobs > 0 ? "warning" : "success",
      detail: failedJobs > 0 ? "Review worker logs and queue health." : "No failed or retrying job runs.",
    },
    {
      key: "sync-failures",
      label: "Failed sync jobs",
      value: failedSyncJobs,
      tone: failedSyncJobs > 0 ? "warning" : "success",
      detail: failedSyncJobs > 0 ? "Device ingestion has failed sync records." : "No failed device sync jobs.",
    },
    {
      key: "stale-devices",
      label: "Stale device links",
      value: staleDeviceConnections,
      tone: staleDeviceConnections > 0 ? "warning" : "success",
      detail: staleDeviceConnections > 0 ? "Some active connections have not synced recently." : "Active devices are not stale.",
    },
    {
      key: "pending-verification",
      label: "Pending verification",
      value: pendingVerificationUsers,
      tone: pendingVerificationUsers > 0 ? "info" : "success",
      detail: pendingVerificationUsers > 0 ? "Users may need verification nudges." : "All active users are verified.",
    },
    {
      key: "overdue-reminders",
      label: "Overdue reminders",
      value: overdueReminders,
      tone: overdueReminders > 0 ? "warning" : "success",
      detail: overdueReminders > 0 ? "Reminder workflow has overdue or missed items." : "No overdue reminder pressure.",
    },
  ];

  return {
    summary: {
      totalUsers,
      verifiedUsers,
      adminUsers,
      pendingInvites,
      activeCareAccess,
      openAlerts,
      criticalOpenAlerts,
      failedJobs,
      failedSyncJobs,
      staleDeviceConnections,
      activeMobileSessions,
      deactivatedUsers,
    },
    roleBreakdown: [
      { role: "Patients", value: patientUsers, tone: "info" as const },
      { role: "Caregivers", value: caregiverUsers, tone: "warning" as const },
      { role: "Doctors", value: doctorUsers, tone: "success" as const },
      { role: "Lab staff", value: labStaffUsers, tone: "neutral" as const },
      { role: "Admins", value: adminUsers, tone: "danger" as const },
    ],
    operationalRisks,
    recentUsers,
    userRoster,
    recentInvites,
    recentJobRuns,
    auditFeed,
  };
}
