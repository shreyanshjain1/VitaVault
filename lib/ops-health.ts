import {
  AlertStatus,
  CareAccessStatus,
  DeviceConnectionStatus,
  JobRunStatus,
  LabFlag,
  ReminderChannel,
  ReminderState,
  SyncJobStatus,
  SymptomSeverity,
} from "@prisma/client";
import { db } from "@/lib/db";
import { APP_ROLES } from "@/lib/domain/enums";

type SupportedRole = string | null | undefined;

export type OpsTone = "neutral" | "info" | "success" | "warning" | "danger";

export type OpsEnvItem = {
  label: string;
  key: string;
  available: boolean;
  tone: OpsTone;
  detail: string;
};

export type OpsRunbookItem = {
  title: string;
  detail: string;
  href: string;
  tone: OpsTone;
};

export type OpsWorkloadItem = {
  key: string;
  label: string;
  value: number;
  tone: OpsTone;
  detail: string;
};

export type OpsHealthData = {
  envReadiness: OpsEnvItem[];
  readinessScore: number;
  runbook: OpsRunbookItem[];
  workload: OpsWorkloadItem[];
  summary: {
    openAlerts: number;
    overdueReminders: number;
    severeSymptoms: number;
    abnormalLabs: number;
    failedJobRuns: number;
    failedSyncJobs: number;
    staleConnections: number;
    activeCareAccess: number;
    pendingInvites: number;
    emailedReminders7d: number;
    resolvedAlerts24h: number;
  };
  recentFailedRuns: Array<{
    id: string;
    jobName: string;
    jobKind: string;
    queueName: string;
    status: JobRunStatus;
    errorMessage: string | null;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    attemptsMade: number;
    maxAttempts: number;
    user: { id: string; name: string | null; email: string | null } | null;
    connection: { id: string; deviceLabel: string | null; clientDeviceId: string } | null;
  }>;
  recentSyncFailures: Array<{
    id: string;
    status: SyncJobStatus;
    source: string;
    platform: string;
    errorMessage: string | null;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    user: { id: string; name: string | null; email: string | null };
    connection: { id: string; deviceLabel: string | null; clientDeviceId: string } | null;
  }>;
  openAlerts: Array<{
    id: string;
    title: string;
    status: AlertStatus;
    severity: string;
    category: string;
    createdAt: Date;
    user: { id: string; name: string | null; email: string | null };
  }>;
  recentPendingInvites: Array<{
    id: string;
    email: string;
    accessRole: string;
    status: CareAccessStatus;
    expiresAt: Date;
    createdAt: Date;
    owner: { id: string; name: string | null; email: string | null };
    grantedBy: { id: string; name: string | null; email: string | null };
  }>;
  recentReminderDeliveries: Array<{
    id: string;
    title: string;
    type: string;
    state: ReminderState;
    channel: ReminderChannel;
    dueAt: Date;
    sentAt: Date | null;
    user: { id: string; name: string | null; email: string | null };
  }>;
};

function isAdmin(role: SupportedRole) {
  return role === APP_ROLES.ADMIN;
}

function scopedWhere<T extends Record<string, unknown>>(role: SupportedRole, userId: string, where: T): T & { userId?: string } {
  if (isAdmin(role)) return where;
  return { ...where, userId };
}

function envTone(available: boolean, recommended = false): OpsTone {
  if (available) return "success";
  return recommended ? "warning" : "danger";
}

function workloadTone(value: number, dangerAt: number, warningAt = 1): OpsTone {
  if (value >= dangerAt) return "danger";
  if (value >= warningAt) return "warning";
  return "success";
}

export async function getOpsHealthData(userId: string, role: SupportedRole): Promise<OpsHealthData> {
  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
  const reminderEmailCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const resolvedAlertCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24);

  const [
    openAlerts,
    overdueReminders,
    severeSymptoms,
    abnormalLabs,
    failedJobRuns,
    failedSyncJobs,
    staleConnections,
    activeCareAccess,
    pendingInvites,
    emailedReminders7d,
    resolvedAlerts24h,
    recentFailedRuns,
    recentSyncFailures,
    recentOpenAlerts,
    recentPendingInvites,
    recentReminderDeliveries,
  ] = await Promise.all([
    db.alertEvent.count({ where: scopedWhere(role, userId, { status: AlertStatus.OPEN }) }),
    db.reminder.count({ where: scopedWhere(role, userId, { state: { in: [ReminderState.OVERDUE, ReminderState.MISSED] } }) }),
    db.symptomEntry.count({ where: scopedWhere(role, userId, { severity: SymptomSeverity.SEVERE, resolved: false }) }),
    db.labResult.count({ where: scopedWhere(role, userId, { flag: { in: [LabFlag.HIGH, LabFlag.LOW] } }) }),
    db.jobRun.count({ where: scopedWhere(role, userId, { status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } }) }),
    db.syncJob.count({ where: scopedWhere(role, userId, { status: SyncJobStatus.FAILED }) }),
    db.deviceConnection.count({
      where: scopedWhere(role, userId, {
        status: DeviceConnectionStatus.ACTIVE,
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleCutoff } }],
      }),
    }),
    isAdmin(role)
      ? db.careAccess.count({ where: { status: CareAccessStatus.ACTIVE } })
      : db.careAccess.count({ where: { ownerUserId: userId, status: CareAccessStatus.ACTIVE } }),
    isAdmin(role)
      ? db.careInvite.count({ where: { status: CareAccessStatus.PENDING } })
      : db.careInvite.count({ where: { ownerUserId: userId, status: CareAccessStatus.PENDING } }),
    db.reminder.count({ where: scopedWhere(role, userId, { channel: ReminderChannel.EMAIL, sentAt: { gte: reminderEmailCutoff } }) }),
    db.alertEvent.count({ where: scopedWhere(role, userId, { status: AlertStatus.RESOLVED, resolvedAt: { gte: resolvedAlertCutoff } }) }),
    db.jobRun.findMany({
      where: scopedWhere(role, userId, { status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } }),
      include: {
        user: { select: { id: true, name: true, email: true } },
        connection: { select: { id: true, deviceLabel: true, clientDeviceId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.syncJob.findMany({
      where: scopedWhere(role, userId, { status: SyncJobStatus.FAILED }),
      include: {
        user: { select: { id: true, name: true, email: true } },
        connection: { select: { id: true, deviceLabel: true, clientDeviceId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.alertEvent.findMany({
      where: scopedWhere(role, userId, { status: AlertStatus.OPEN }),
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    isAdmin(role)
      ? db.careInvite.findMany({
          where: { status: CareAccessStatus.PENDING },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            grantedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : db.careInvite.findMany({
          where: { ownerUserId: userId, status: CareAccessStatus.PENDING },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            grantedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
    db.reminder.findMany({
      where: scopedWhere(role, userId, { channel: ReminderChannel.EMAIL, sentAt: { not: null } }),
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { sentAt: "desc" },
      take: 6,
    }),
  ]);

  const envReadiness: OpsEnvItem[] = [
    {
      label: "Database",
      key: "DATABASE_URL",
      available: Boolean(process.env.DATABASE_URL),
      tone: envTone(Boolean(process.env.DATABASE_URL)),
      detail: process.env.DATABASE_URL ? "Configured for Prisma access." : "Missing required database connection string.",
    },
    {
      label: "Auth secret",
      key: "AUTH_SECRET",
      available: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
      tone: envTone(Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)),
      detail: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET ? "Session signing secret is set." : "Missing required auth secret.",
    },
    {
      label: "Redis",
      key: "REDIS_URL",
      available: Boolean(process.env.REDIS_URL),
      tone: envTone(Boolean(process.env.REDIS_URL), true),
      detail: process.env.REDIS_URL ? "Configured for BullMQ and job processing." : "Missing Redis URL. Jobs will run in degraded mode.",
    },
    {
      label: "Outbound email",
      key: "RESEND_API_KEY",
      available: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      tone: envTone(Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL), true),
      detail: process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
        ? "Invite, reminder, and digest email delivery is enabled."
        : "Optional. Manual invite links still work, but outbound email is not configured.",
    },
    {
      label: "Internal API",
      key: "INTERNAL_API_SECRET",
      available: Boolean(process.env.INTERNAL_API_SECRET),
      tone: envTone(Boolean(process.env.INTERNAL_API_SECRET), true),
      detail: process.env.INTERNAL_API_SECRET ? "Internal automation calls can be authenticated." : "Recommended for protected internal jobs and cron-style calls.",
    },
    {
      label: "Host trust",
      key: "AUTH_TRUST_HOST",
      available: Boolean(process.env.AUTH_TRUST_HOST),
      tone: envTone(Boolean(process.env.AUTH_TRUST_HOST), true),
      detail: process.env.AUTH_TRUST_HOST ? "Configured for hosted auth callbacks." : "Recommended for hosted environments.",
    },
    {
      label: "OpenAI",
      key: "OPENAI_API_KEY",
      available: Boolean(process.env.OPENAI_API_KEY),
      tone: envTone(Boolean(process.env.OPENAI_API_KEY), true),
      detail: process.env.OPENAI_API_KEY ? "AI insight generation is enabled." : "Optional. AI features stay disabled without it.",
    },
  ];

  const requiredItems = envReadiness.filter((item) => item.key === "DATABASE_URL" || item.key === "AUTH_SECRET");
  const recommendedItems = envReadiness.filter((item) => item.key !== "DATABASE_URL" && item.key !== "AUTH_SECRET");
  const requiredScore = requiredItems.filter((item) => item.available).length * 25;
  const recommendedScore = recommendedItems.filter((item) => item.available).length * 10;
  const readinessScore = Math.min(100, requiredScore + recommendedScore);

  const workload: OpsWorkloadItem[] = [
    {
      key: "clinical-review",
      label: "Clinical review load",
      value: openAlerts + severeSymptoms + abnormalLabs,
      tone: workloadTone(openAlerts + severeSymptoms + abnormalLabs, 10, 1),
      detail: "Open alerts plus severe symptoms and abnormal lab flags.",
    },
    {
      key: "reminder-pressure",
      label: "Reminder pressure",
      value: overdueReminders,
      tone: workloadTone(overdueReminders, 10, 1),
      detail: "Overdue or missed reminders that need follow-up.",
    },
    {
      key: "worker-reliability",
      label: "Worker reliability",
      value: failedJobRuns + failedSyncJobs,
      tone: workloadTone(failedJobRuns + failedSyncJobs, 5, 1),
      detail: "Failed queue runs and failed device sync jobs.",
    },
    {
      key: "sharing-backlog",
      label: "Care sharing backlog",
      value: pendingInvites,
      tone: workloadTone(pendingInvites, 8, 1),
      detail: "Pending care-team invitations still waiting for acceptance.",
    },
    {
      key: "device-freshness",
      label: "Device freshness",
      value: staleConnections,
      tone: workloadTone(staleConnections, 5, 1),
      detail: "Active device connections that have not synced recently.",
    },
  ];

  const runbook: OpsRunbookItem[] = [
    {
      title: failedJobRuns || failedSyncJobs ? "Review failed worker activity" : "Worker layer looks stable",
      detail: failedJobRuns || failedSyncJobs ? "Open the jobs dashboard and inspect recent errors, attempts, and queue state." : "No failed job or sync records are currently in scope.",
      href: "/jobs",
      tone: failedJobRuns || failedSyncJobs ? "warning" : "success",
    },
    {
      title: openAlerts ? "Triage open clinical alerts" : "No open alert backlog",
      detail: openAlerts ? "Review alert events and resolve or acknowledge the highest severity items first." : "Clinical alert queue is currently clear for this scope.",
      href: "/alerts",
      tone: openAlerts ? "warning" : "success",
    },
    {
      title: pendingInvites ? "Follow up pending care invites" : "Care access queue is clear",
      detail: pendingInvites ? "Check pending care-team invites and resend or revoke stale links as needed." : "No pending invite pressure for this scope.",
      href: "/care-team",
      tone: pendingInvites ? "info" : "success",
    },
    {
      title: readinessScore < 70 ? "Complete deployment configuration" : "Deployment readiness is strong",
      detail: readinessScore < 70 ? "Set required and recommended environment variables before using this as a live deployment." : "Required environment configuration is present, with recommended services mostly covered.",
      href: "/security",
      tone: readinessScore < 70 ? "warning" : "success",
    },
  ];

  return {
    envReadiness,
    readinessScore,
    runbook,
    workload,
    summary: {
      openAlerts,
      overdueReminders,
      severeSymptoms,
      abnormalLabs,
      failedJobRuns,
      failedSyncJobs,
      staleConnections,
      activeCareAccess,
      pendingInvites,
      emailedReminders7d,
      resolvedAlerts24h,
    },
    recentFailedRuns,
    recentSyncFailures,
    openAlerts: recentOpenAlerts,
    recentPendingInvites,
    recentReminderDeliveries,
  };
}
