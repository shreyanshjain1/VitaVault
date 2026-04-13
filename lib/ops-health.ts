import {
  AlertStatus,
  DeviceConnectionStatus,
  JobRunStatus,
  LabFlag,
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

export type OpsHealthData = {
  envReadiness: OpsEnvItem[];
  summary: {
    openAlerts: number;
    overdueReminders: number;
    severeSymptoms: number;
    abnormalLabs: number;
    failedJobRuns: number;
    failedSyncJobs: number;
    staleConnections: number;
    activeCareAccess: number;
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

export async function getOpsHealthData(userId: string, role: SupportedRole): Promise<OpsHealthData> {
  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);

  const [
    openAlerts,
    overdueReminders,
    severeSymptoms,
    abnormalLabs,
    failedJobRuns,
    failedSyncJobs,
    staleConnections,
    activeCareAccess,
    recentFailedRuns,
    recentSyncFailures,
    recentOpenAlerts,
  ] = await Promise.all([
    db.alertEvent.count({
      where: scopedWhere(role, userId, { status: AlertStatus.OPEN }),
    }),
    db.reminder.count({
      where: scopedWhere(role, userId, {
        state: { in: [ReminderState.OVERDUE, ReminderState.MISSED] },
      }),
    }),
    db.symptomEntry.count({
      where: scopedWhere(role, userId, {
        severity: SymptomSeverity.SEVERE,
        resolved: false,
      }),
    }),
    db.labResult.count({
      where: scopedWhere(role, userId, {
        flag: { in: [LabFlag.HIGH, LabFlag.LOW] },
      }),
    }),
    db.jobRun.count({
      where: scopedWhere(role, userId, {
        status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] },
      }),
    }),
    db.syncJob.count({
      where: scopedWhere(role, userId, { status: SyncJobStatus.FAILED }),
    }),
    db.deviceConnection.count({
      where: scopedWhere(role, userId, {
        status: DeviceConnectionStatus.ACTIVE,
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleCutoff } }],
      }),
    }),
    isAdmin(role)
      ? db.careAccess.count({ where: { status: "ACTIVE" as any } })
      : db.careAccess.count({ where: { ownerUserId: userId, status: "ACTIVE" as any } }),
    db.jobRun.findMany({
      where: scopedWhere(role, userId, {
        status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] },
      }),
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
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
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
      available: Boolean(process.env.AUTH_SECRET),
      tone: envTone(Boolean(process.env.AUTH_SECRET)),
      detail: process.env.AUTH_SECRET ? "Session signing secret is set." : "Missing required auth secret.",
    },
    {
      label: "Redis",
      key: "REDIS_URL",
      available: Boolean(process.env.REDIS_URL),
      tone: envTone(Boolean(process.env.REDIS_URL)),
      detail: process.env.REDIS_URL ? "Configured for BullMQ and job processing." : "Missing Redis URL. Jobs will run in degraded mode.",
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

  return {
    envReadiness,
    summary: {
      openAlerts,
      overdueReminders,
      severeSymptoms,
      abnormalLabs,
      failedJobRuns,
      failedSyncJobs,
      staleConnections,
      activeCareAccess,
    },
    recentFailedRuns,
    recentSyncFailures,
    openAlerts: recentOpenAlerts,
  };
}
