import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BellRing,
  ClipboardCheck,
  Cpu,
  Gauge,
  HeartPulse,
  Mail,
  RefreshCcw,
  WifiOff,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getOpsHealthData, type OpsTone } from "@/lib/ops-health";
import { requireUser } from "@/lib/session";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function toneLabel(tone: OpsTone) {
  if (tone === "success") return "Healthy";
  if (tone === "danger") return "Attention";
  if (tone === "warning") return "Watch";
  if (tone === "info") return "Info";
  return "Neutral";
}

function statusTone(status: string): OpsTone {
  if (["FAILED", "ERROR", "REVOKED"].includes(status)) return "danger";
  if (["RETRYING", "PARTIAL", "DISCONNECTED", "OVERDUE", "MISSED", "PENDING"].includes(status)) return "warning";
  if (["ACTIVE", "RUNNING", "OPEN", "QUEUED"].includes(status)) return "info";
  if (["COMPLETED", "SUCCEEDED", "ACTIVE_OK", "RESOLVED", "SENT"].includes(status)) return "success";
  return "neutral";
}

function StatCard({ title, value, description, icon, tone = "neutral" }: { title: string; value: number | string; description: string; icon: ReactNode; tone?: OpsTone }) {
  const cardClass =
    tone === "danger"
      ? "border-rose-200/80 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20"
      : tone === "warning"
        ? "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
        : tone === "success"
          ? "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : tone === "info"
            ? "border-sky-200/80 bg-sky-50/70 dark:border-sky-900/40 dark:bg-sky-950/20"
            : "";

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-2">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export default async function OpsPage() {
  const user = await requireUser();
  const data = await getOpsHealthData(user.id!, user.role);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Operations Command Center"
          description="Monitor deployment readiness, worker health, care workload, delivery signals, and unresolved clinical pressure from one business-facing workspace."
          action={(
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Job runs</Link>
              <Link href="/audit-log" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Audit log</Link>
              <Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Admin</Link>
              <Link href="/security" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Security</Link>
            </div>
          )}
        />

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Badge>Operational readiness</Badge>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Deployment readiness score: {data.readinessScore}%</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  This score checks required runtime configuration plus recommended production services like Redis, internal job auth, outbound email, trusted host handling, and AI keys.
                </p>
              </div>
              <ProgressBar value={data.readinessScore} />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Open alerts</div>
                  <div className="mt-1 text-2xl font-semibold">{data.summary.openAlerts}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Failed worker items</div>
                  <div className="mt-1 text-2xl font-semibold">{data.summary.failedJobRuns + data.summary.failedSyncJobs}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Active care access</div>
                  <div className="mt-1 text-2xl font-semibold">{data.summary.activeCareAccess}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2 font-medium"><ClipboardCheck className="h-4 w-4 text-primary" /> Recommended runbook</div>
              <div className="mt-4 space-y-3">
                {data.runbook.map((item) => (
                  <Link key={item.title} href={item.href} className="block rounded-2xl border border-border/60 p-3 transition hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{item.title}</div>
                      <StatusPill tone={item.tone}>{toneLabel(item.tone)}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {data.envReadiness.map((item) => (
            <Card key={item.key}>
              <CardHeader className="pb-3">
                <CardDescription>{item.label}</CardDescription>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{item.key}</CardTitle>
                  <StatusPill tone={item.tone}>{toneLabel(item.tone)}</StatusPill>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Open alerts" value={data.summary.openAlerts} description="Alert events still waiting for review or triage." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} tone={data.summary.openAlerts ? "warning" : "success"} />
          <StatCard title="Overdue reminders" value={data.summary.overdueReminders} description="Combined overdue or missed reminder workload." icon={<BellRing className="h-5 w-5 text-orange-500" />} tone={data.summary.overdueReminders ? "warning" : "success"} />
          <StatCard title="Severe symptoms" value={data.summary.severeSymptoms} description="Unresolved severe symptom entries that need attention." icon={<HeartPulse className="h-5 w-5 text-rose-500" />} tone={data.summary.severeSymptoms ? "danger" : "success"} />
          <StatCard title="Abnormal labs" value={data.summary.abnormalLabs} description="Lab results currently flagged high or low." icon={<Activity className="h-5 w-5 text-violet-500" />} tone={data.summary.abnormalLabs ? "warning" : "success"} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Failed job runs" value={data.summary.failedJobRuns} description="Persisted worker runs in failed or retrying state." icon={<Cpu className="h-5 w-5 text-red-500" />} tone={data.summary.failedJobRuns ? "danger" : "success"} />
          <StatCard title="Failed sync jobs" value={data.summary.failedSyncJobs} description="Device sync jobs that could not complete." icon={<RefreshCcw className="h-5 w-5 text-red-500" />} tone={data.summary.failedSyncJobs ? "warning" : "success"} />
          <StatCard title="Stale connections" value={data.summary.staleConnections} description="Active device links that have not synced recently." icon={<WifiOff className="h-5 w-5 text-slate-500" />} tone={data.summary.staleConnections ? "warning" : "success"} />
          <StatCard title="Email reminders sent" value={data.summary.emailedReminders7d} description="Email reminders sent within the last seven days." icon={<Mail className="h-5 w-5 text-sky-500" />} tone="info" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workload risk board</CardTitle>
            <CardDescription>Fast operational triage across clinical, worker, sharing, and device areas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {data.workload.map((item) => (
              <div key={item.key} className="rounded-2xl border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{item.label}</div>
                  <StatusPill tone={item.tone}>{item.value}</StatusPill>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent failed job runs</CardTitle>
              <CardDescription>Worker failures and retrying jobs that need operational review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentFailedRuns.length ? (
                data.recentFailedRuns.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-border/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={statusTone(run.status)}>{run.status}</StatusPill>
                      <Badge>{run.queueName}</Badge>
                      <Badge>{run.jobKind.replaceAll("_", " ")}</Badge>
                    </div>
                    <div className="mt-3 font-medium">{run.jobName}</div>
                    <div className="text-sm text-muted-foreground">Attempts {run.attemptsMade} / {run.maxAttempts}</div>
                    <div className="text-sm text-muted-foreground">User: {run.user?.name || run.user?.email || run.user?.id || "System"}</div>
                    <div className="text-sm text-muted-foreground">Created: {formatDateTime(run.createdAt)}</div>
                    {run.errorMessage ? <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">{run.errorMessage}</div> : null}
                  </div>
                ))
              ) : (
                <EmptyState title="No failed job runs" description="Failed and retrying worker runs will appear here." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent sync failures</CardTitle>
              <CardDescription>Connected-device ingestion failures and source context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentSyncFailures.length ? (
                data.recentSyncFailures.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-border/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={statusTone(job.status)}>{job.status}</StatusPill>
                      <Badge>{job.source}</Badge>
                      <Badge>{job.platform}</Badge>
                    </div>
                    <div className="mt-3 font-medium">{job.connection?.deviceLabel || job.connection?.clientDeviceId || "Device sync"}</div>
                    <div className="text-sm text-muted-foreground">User: {job.user.name || job.user.email || job.user.id}</div>
                    <div className="text-sm text-muted-foreground">Created: {formatDateTime(job.createdAt)}</div>
                    {job.errorMessage ? <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">{job.errorMessage}</div> : null}
                  </div>
                ))
              ) : (
                <EmptyState title="No sync failures" description="Failed device ingestion jobs will appear here." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Open alert queue</CardTitle>
              <CardDescription>Newest unresolved alert events in this scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.openAlerts.length ? data.openAlerts.map((alert) => (
                <Link key={alert.id} href={`/alerts/${alert.id}`} className="block rounded-2xl border border-border/60 p-3 transition hover:bg-muted/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={statusTone(alert.status)}>{alert.status}</StatusPill>
                    <Badge>{alert.severity}</Badge>
                    <Badge>{alert.category}</Badge>
                  </div>
                  <div className="mt-3 font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.user.name || alert.user.email || alert.user.id}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</div>
                </Link>
              )) : <EmptyState title="No open alerts" description="Open alert events will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending invites</CardTitle>
              <CardDescription>Care-team invitations still awaiting action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentPendingInvites.length ? data.recentPendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-border/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={statusTone(invite.status)}>{invite.status}</StatusPill>
                    <Badge>{invite.accessRole}</Badge>
                  </div>
                  <div className="mt-3 font-medium">{invite.email}</div>
                  <div className="text-sm text-muted-foreground">Owner: {invite.owner.name || invite.owner.email || invite.owner.id}</div>
                  <div className="text-xs text-muted-foreground">Expires: {formatDateTime(invite.expiresAt)}</div>
                </div>
              )) : <EmptyState title="No pending invites" description="Pending care-team invites will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminder delivery signal</CardTitle>
              <CardDescription>Recent email reminder delivery activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentReminderDeliveries.length ? data.recentReminderDeliveries.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl border border-border/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={statusTone(reminder.state)}>{reminder.state}</StatusPill>
                    <Badge>{reminder.channel}</Badge>
                    <Badge>{reminder.type}</Badge>
                  </div>
                  <div className="mt-3 font-medium">{reminder.title}</div>
                  <div className="text-sm text-muted-foreground">User: {reminder.user.name || reminder.user.email || reminder.user.id}</div>
                  <div className="text-xs text-muted-foreground">Sent: {formatDateTime(reminder.sentAt)}</div>
                </div>
              )) : <EmptyState title="No reminder deliveries" description="Sent email reminders will appear here." />}
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 font-medium"><Gauge className="h-4 w-4 text-primary" /> Patch 11 operations polish</div>
              <p className="mt-1 text-sm text-muted-foreground">This workspace now tells a clearer production story: configuration readiness, queue reliability, device sync freshness, clinical backlog, care-sharing pressure, and delivery signal.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90">Open jobs</Link>
              <Link href="/security" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Security center</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
