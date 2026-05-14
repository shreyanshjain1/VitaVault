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
  reviewQueue: number;
  criticalQueue: number;
  monitorQueue: number;
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

export type AuditReviewState = "critical" | "review" | "monitor" | "healthy";

export type AuditEventRiskSignal = {
  state: AuditReviewState;
  label: string;
  tone: "danger" | "warning" | "info" | "success" | "neutral";
  actionLabel: string;
  nextStep: string;
};

export type AuditReviewSummary = {
  critical: number;
  review: number;
  monitor: number;
  healthy: number;
  reviewQueue: number;
};

function labelUser(
  user:
    | { name: string | null; email: string | null; id: string }
    | null
    | undefined,
) {
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

function severityFromAlert(
  severity: AlertSeverity,
  status: AlertStatus,
): SecurityAuditEvent["severity"] {
  if (status === AlertStatus.RESOLVED || status === AlertStatus.DISMISSED)
    return "success";
  if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH)
    return "danger";
  if (severity === AlertSeverity.MEDIUM) return "warning";
  return "info";
}

function severityFromJob(status: JobRunStatus): SecurityAuditEvent["severity"] {
  if (status === JobRunStatus.FAILED) return "danger";
  if (status === JobRunStatus.RETRYING || status === JobRunStatus.CANCELLED)
    return "warning";
  if (status === JobRunStatus.COMPLETED) return "success";
  return "info";
}

function severityFromReminder(
  state: ReminderState,
): SecurityAuditEvent["severity"] {
  if (state === ReminderState.MISSED || state === ReminderState.OVERDUE)
    return "warning";
  if (state === ReminderState.COMPLETED) return "success";
  return "info";
}

export function getAuditEventRiskSignal(
  event: Pick<
    SecurityAuditEvent,
    "source" | "title" | "note" | "severity" | "metadata"
  >,
): AuditEventRiskSignal {
  const searchable =
    `${event.title} ${event.note} ${event.metadata}`.toLowerCase();

  if (event.severity === "danger") {
    return {
      state: "critical",
      label: "Critical review",
      tone: "danger",
      actionLabel:
        event.source === "job"
          ? "Inspect failed run"
          : event.source === "alert"
            ? "Review alert"
            : "Investigate event",
      nextStep:
        "Open the related workflow and confirm whether the event has been resolved or needs escalation.",
    };
  }

  if (
    event.severity === "warning" ||
    searchable.includes("revok") ||
    searchable.includes("failed") ||
    searchable.includes("retry") ||
    searchable.includes("overdue") ||
    searchable.includes("missed")
  ) {
    return {
      state: "review",
      label: "Needs review",
      tone: "warning",
      actionLabel:
        event.source === "session"
          ? "Review session"
          : event.source === "reminder"
            ? "Review reminder"
            : "Review event",
      nextStep:
        "Check whether this warning is expected, documented, and no longer exposing patient data or workflow risk.",
    };
  }

  if (event.source === "session" || event.source === "access") {
    return {
      state: "monitor",
      label: "Monitor",
      tone: "info",
      actionLabel:
        event.source === "session" ? "Monitor token" : "Confirm access",
      nextStep:
        "Keep this event in the audit trail and re-check it during the next security review.",
    };
  }

  return {
    state: "healthy",
    label: "Logged",
    tone: "success",
    actionLabel: "No action needed",
    nextStep:
      "This event is informational and does not currently require follow-up.",
  };
}

export function buildAuditReviewSummary(
  events: Array<
    Pick<
      SecurityAuditEvent,
      "source" | "title" | "note" | "severity" | "metadata"
    >
  >,
): AuditReviewSummary {
  const counts: AuditReviewSummary = {
    critical: 0,
    review: 0,
    monitor: 0,
    healthy: 0,
    reviewQueue: 0,
  };

  for (const event of events) {
    const signal = getAuditEventRiskSignal(event);
    counts[signal.state] += 1;
    if (signal.state === "critical" || signal.state === "review") {
      counts.reviewQueue += 1;
    }
  }

  return counts;
}

export function buildAuditReviewChecklist(summary: SecurityAuditSummary) {
  return [
    {
      id: "critical-events",
      label: "Critical audit events reviewed",
      passed: summary.criticalQueue === 0,
      tone:
        summary.criticalQueue === 0
          ? ("success" as const)
          : ("danger" as const),
      detail:
        summary.criticalQueue === 0
          ? "No critical events are currently in the visible review queue."
          : `${summary.criticalQueue} critical event${summary.criticalQueue === 1 ? "" : "s"} need immediate review.`,
    },
    {
      id: "warnings",
      label: "Warnings acknowledged",
      passed: summary.warningEvents === 0,
      tone:
        summary.warningEvents === 0
          ? ("success" as const)
          : ("warning" as const),
      detail:
        summary.warningEvents === 0
          ? "No warning events are visible under the current filters."
          : `${summary.warningEvents} warning event${summary.warningEvents === 1 ? "" : "s"} should be checked.`,
    },
    {
      id: "jobs",
      label: "Worker failures cleared",
      passed: summary.failedJobs === 0,
      tone:
        summary.failedJobs === 0 ? ("success" as const) : ("danger" as const),
      detail:
        summary.failedJobs === 0
          ? "No failed or retrying jobs are currently counted."
          : `${summary.failedJobs} failed or retrying job${summary.failedJobs === 1 ? "" : "s"} need inspection.`,
    },
    {
      id: "alerts",
      label: "Open alerts triaged",
      passed: summary.openAlerts === 0,
      tone:
        summary.openAlerts === 0 ? ("success" as const) : ("warning" as const),
      detail:
        summary.openAlerts === 0
          ? "No unresolved alert events are currently counted."
          : `${summary.openAlerts} open alert${summary.openAlerts === 1 ? "" : "s"} should be triaged.`,
    },
  ];
}

export function parseAuditFilters(
  params: Record<string, string | string[] | undefined>,
): AuditLogFilters {
  const source = String(params.source ?? "all");
  const severity = String(params.severity ?? "all");
  const q = String(params.q ?? "").trim();

  return {
    source: ["all", "access", "alert", "reminder", "job", "session"].includes(
      source,
    )
      ? (source as AuditSource)
      : "all",
    severity: ["all", "info", "warning", "danger", "success"].includes(severity)
      ? (severity as AuditSeverity)
      : "all",
    q,
  };
}

export async function getSecurityAuditCenterData(
  user: {
    id: string;
    role: AppRole;
  },
  filters: AuditLogFilters,
) {
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
        alert: {
          select: { id: true, title: true, severity: true, status: true },
        },
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
        reminder: {
          select: { id: true, title: true, state: true, dueAt: true },
        },
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
      orderBy: [
        { revokedAt: "asc" },
        { lastUsedAt: "desc" },
        { createdAt: "desc" },
      ],
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
      where: isAdmin
        ? { revokedAt: null, expiresAt: { gt: now } }
        : { userId: user.id, revokedAt: null, expiresAt: { gt: now } },
    }),
    db.jobRun.count({
      where: isAdmin
        ? { status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] } }
        : {
            userId: user.id,
            status: { in: [JobRunStatus.FAILED, JobRunStatus.RETRYING] },
          },
    }),
    db.alertEvent.count({
      where: isAdmin
        ? { status: AlertStatus.OPEN }
        : { userId: user.id, status: AlertStatus.OPEN },
    }),
  ]);

  const events: SecurityAuditEvent[] = [
    ...accessLogs.map((log) => ({
      id: `access-${log.id}`,
      source: "access" as const,
      title: log.action,
      actor: labelUser(log.actor),
      owner: labelUser(log.owner),
      target:
        [log.targetType, log.targetId].filter(Boolean).join(" • ") ||
        "Care access",
      note: log.metadataJson || "Care-team access audit entry.",
      severity:
        log.action.toLowerCase().includes("revok") ||
        log.action.toLowerCase().includes("remove")
          ? ("warning" as const)
          : ("info" as const),
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
        : log.rule?.severity === AlertSeverity.CRITICAL ||
            log.rule?.severity === AlertSeverity.HIGH
          ? ("danger" as const)
          : ("info" as const),
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
      note:
        log.note ||
        (log.reminder?.dueAt
          ? `Due ${log.reminder.dueAt.toLocaleString()}`
          : "Reminder audit entry."),
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
      note:
        job.errorMessage || `Attempts ${job.attemptsMade}/${job.maxAttempts}`,
      severity: severityFromJob(job.status),
      createdAt: job.createdAt,
      metadata: normalizeText({
        queueName: job.queueName,
        jobName: job.jobName,
        jobKind: job.jobKind,
      }),
    })),
    ...mobileSessions.map((session) => {
      const isRevoked = Boolean(session.revokedAt);
      const isExpired = session.expiresAt < now;
      return {
        id: `session-${session.id}`,
        source: "session" as const,
        title: isRevoked
          ? "Mobile session revoked"
          : isExpired
            ? "Mobile session expired"
            : "Mobile session active",
        actor: labelUser(session.user),
        owner: labelUser(session.user),
        target: session.name || `Session ${session.id.slice(0, 10)}`,
        note: `Created ${session.createdAt.toLocaleString()} · Last used ${session.lastUsedAt?.toLocaleString() || "never"}`,
        severity: isRevoked
          ? ("warning" as const)
          : isExpired
            ? ("info" as const)
            : ("success" as const),
        createdAt: session.revokedAt || session.lastUsedAt || session.createdAt,
        metadata: normalizeText({
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
        }),
      };
    }),
  ]
    .filter(
      (event) => filters.source === "all" || event.source === filters.source,
    )
    .filter(
      (event) =>
        filters.severity === "all" || event.severity === filters.severity,
    )
    .filter((event) => includesQuery(event, filters.q))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 120);

  const auditReviewSummary = buildAuditReviewSummary(events);

  const summary: SecurityAuditSummary = {
    totalEvents: events.length,
    dangerEvents: events.filter((event) => event.severity === "danger").length,
    warningEvents: events.filter((event) => event.severity === "warning")
      .length,
    activeMobileSessions,
    failedJobs,
    openAlerts,
    reviewQueue: auditReviewSummary.reviewQueue,
    criticalQueue: auditReviewSummary.critical,
    monitorQueue: auditReviewSummary.monitor,
  };

  return {
    filters,
    isAdmin,
    summary,
    events,
  };
}
