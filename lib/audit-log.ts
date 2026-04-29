import {
  AlertSeverity,
  AlertStatus,
  AppRole,
  JobRunStatus,
  ReminderState,
} from "@prisma/client";
import { db } from "@/lib/db";

type AuditSource = "all" | "access" | "alert" | "reminder" | "job" | "session";
type AuditSeverity = "all" | "info" | "warning" | "danger" | "success";

export type AuditLogFilters = {
  source: AuditSource;
  severity: AuditSeverity;
  q: string;
};

export type SecurityAuditSummary = {
  totalEvents: number;
  dangerEvents: number;
  warningEvents: number;
  activeMobileSessions: number;
  failedJobs: number;
  openAlerts: number;
};

export type SecurityAuditEvent = {
  id: string;
  source: Exclude<AuditSource, "all">;
  title: string;
  actor: string;
  owner: string;
  target: string;
  note: string;
  severity: Exclude<AuditSeverity, "all">;
  createdAt: Date;
  metadata: string;
};

function labelUser(user: { name: string | null; email: string | null; id: string } | null | undefined) {
  if (!user) return "System";
  return user.name || user.email || user.id;
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function includesQuery(event: SecurityAuditEvent, q: string) {
  if (!q) return true;
  const haystack = [
    event.source,
    event.title,
    event.actor,
    event.owner,
    event.target,
    event.note,
    event.metadata,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q.toLowerCase());
}

function severityFromAlert(severity: AlertSeverity, status: AlertStatus): SecurityAuditEvent["severity"] {
  if (status === AlertStatus.RESOLVED || status === AlertStatus.DISMISSED) return "success";
  if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) return "danger";
  if (severity === AlertSeverity.MEDIUM) return "warning";
  return "info";
}

function severityFromJob(status: JobRunStatus): SecurityAuditEvent["severity"] {
  if (status === JobRunStatus.FAILED) return "danger";
  if (status === JobRunStatus.RETRYING || status === JobRunStatus.CANCELLED) return "warning";
  if (status === JobRunStatus.COMPLETED) return "success";
  return "info";
}

function severityFromReminder(state: ReminderState): SecurityAuditEvent["severity"] {
  if (state === ReminderState.MISSED || state === ReminderState.OVERDUE) return "warning";
  if (state === ReminderState.COMPLETED) return "success";
  return "info";
}

export function parseAuditFilters(params: Record<string, string | string[] | undefined>): AuditLogFilters {
  const source = String(params.source ?? "all");
  const severity = String(params.severity ?? "all");
  const q = String(params.q ?? "").trim();

  return {
    source: ["all", "access", "alert", "reminder", "job", "session"].includes(source)
      ? (source as AuditSource)
      : "all",
    severity: ["all", "info", "warning", "danger", "success"].includes(severity)
      ? (severity as AuditSeverity)
      : "all",
    q,
  };
}

export async function getSecurityAuditCenterData(user: {
  id: string;
  role: AppRole;
}, filters: AuditLogFilters) {
  const now = new Date();
  const isAdmin = user.role === AppRole.ADMIN;
  const ownerWhere = isAdmin ? {} : { userId: user.id };
  const accessWhere = isAdmin ? {} : { ownerUserId: user.id };

  const [
    accessLogs,
    alertAuditLogs,
    reminderAuditLogs,
    jobRuns,
    mobileSessions,
    activeMobileSessions,
    failedJobs,
    openAlerts,
  ] = await Promise.all([
    db.accessAuditLog.findMany({
      where: accessWhere,
      orderBy: { createdAt: "desc" },
      take: 80,
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
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        action: true,
        note: true,
        metadataJson: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
        alert: { select: { id: true, title: true, severity: true, status: true } },
        rule: { select: { id: true, name: true, severity: true } },
      },
    }),
    db.reminderAuditLog.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        action: true,
        note: true,
        metadataJson: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        actor: { select: { id: true, name: true, email: true } },
        reminder: { select: { id: true, title: true, state: true, dueAt: true } },
      },
    }),
    db.jobRun.findMany({
      where: isAdmin ? {} : { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        queueName: true,
        jobName: true,
        jobKind: true,
        status: true,
        errorMessage: true,
        attemptsMade: true,
        maxAttempts: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.mobileSessionToken.findMany({
      where: isAdmin ? {} : { userId: user.id },
      orderBy: [{ revokedAt: "asc" }, { lastUsedAt: "desc" }, { createdAt: "desc" }],
      take: 80,
      select: {
        id: true,
        name: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.mobileSessionToken.count({
      where: isAdmin ? { revokedAt: null, expiresAt: { gt: now } } : { userId: user.id, revokedAt: null, expiresAt: { gt: now } },
    }),
    db.jobRun.count({
      where: isAdmin
        ? { status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } }
        : { userId: user.id, status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } },
    }),
    db.alertEvent.count({
      where: isAdmin ? { status: AlertStatus.OPEN } : { userId: user.id, status: AlertStatus.OPEN },
    }),
  ]);

  const events: SecurityAuditEvent[] = [
    ...accessLogs.map((log) => ({
      id: `access-${log.id}`,
      source: "access" as const,
      title: log.action,
      actor: labelUser(log.actor),
      owner: labelUser(log.owner),
      target: [log.targetType, log.targetId].filter(Boolean).join(" • ") || "Care access",
      note: log.metadataJson || "Care-team access audit entry.",
      severity: log.action.toLowerCase().includes("revok") || log.action.toLowerCase().includes("remove") ? "warning" as const : "info" as const,
      createdAt: log.createdAt,
      metadata: log.metadataJson || "",
    })),
    ...alertAuditLogs.map((log) => ({
      id: `alert-${log.id}`,
      source: "alert" as const,
      title: log.action,
      actor: labelUser(log.actor),
      owner: labelUser(log.user),
      target: log.alert?.title || log.rule?.name || "Alert workflow",
      note: log.note || log.metadataJson || "Alert rule or event audit entry.",
      severity: log.alert
        ? severityFromAlert(log.alert.severity, log.alert.status)
        : log.rule?.severity === AlertSeverity.CRITICAL || log.rule?.severity === AlertSeverity.HIGH
          ? "danger" as const
          : "info" as const,
      createdAt: log.createdAt,
      metadata: log.metadataJson || "",
    })),
    ...reminderAuditLogs.map((log) => ({
      id: `reminder-${log.id}`,
      source: "reminder" as const,
      title: log.action,
      actor: labelUser(log.actor),
      owner: labelUser(log.user),
      target: log.reminder?.title || "Reminder workflow",
      note: log.note || (log.reminder?.dueAt ? `Due ${log.reminder.dueAt.toLocaleString()}` : "Reminder audit entry."),
      severity: severityFromReminder(log.reminder?.state || ReminderState.DUE),
      createdAt: log.createdAt,
      metadata: log.metadataJson || "",
    })),
    ...jobRuns.map((job) => ({
      id: `job-${job.id}`,
      source: "job" as const,
      title: `${job.jobKind} · ${job.status}`,
      actor: "Worker",
      owner: labelUser(job.user),
      target: `${job.queueName} / ${job.jobName}`,
      note: job.errorMessage || `Attempts ${job.attemptsMade}/${job.maxAttempts}`,
      severity: severityFromJob(job.status),
      createdAt: job.createdAt,
      metadata: normalizeText({ queueName: job.queueName, jobName: job.jobName, jobKind: job.jobKind }),
    })),
    ...mobileSessions.map((session) => {
      const isRevoked = Boolean(session.revokedAt);
      const isExpired = session.expiresAt < now;
      return {
        id: `session-${session.id}`,
        source: "session" as const,
        title: isRevoked ? "Mobile session revoked" : isExpired ? "Mobile session expired" : "Mobile session active",
        actor: labelUser(session.user),
        owner: labelUser(session.user),
        target: session.name || `Session ${session.id.slice(0, 10)}`,
        note: `Created ${session.createdAt.toLocaleString()} · Last used ${session.lastUsedAt?.toLocaleString() || "never"}`,
        severity: isRevoked ? "warning" as const : isExpired ? "info" as const : "success" as const,
        createdAt: session.revokedAt || session.lastUsedAt || session.createdAt,
        metadata: normalizeText({ expiresAt: session.expiresAt, revokedAt: session.revokedAt }),
      };
    }),
  ]
    .filter((event) => filters.source === "all" || event.source === filters.source)
    .filter((event) => filters.severity === "all" || event.severity === filters.severity)
    .filter((event) => includesQuery(event, filters.q))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 120);

  const summary: SecurityAuditSummary = {
    totalEvents: events.length,
    dangerEvents: events.filter((event) => event.severity === "danger").length,
    warningEvents: events.filter((event) => event.severity === "warning").length,
    activeMobileSessions,
    failedJobs,
    openAlerts,
  };

  return {
    filters,
    isAdmin,
    summary,
    events,
  };
}
