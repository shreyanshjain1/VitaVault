import {
  AlertTriangle,
  Database,
  HeartPulse,
  Mail,
  RefreshCcw,
  ShieldAlert,
  UserPlus,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getOpsHealthData, type OpsTone } from "@/lib/ops-health";
import { requireRoutePolicy } from "@/lib/route-policy";

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
  if (["ACTIVE", "RUNNING", "OPEN"].includes(status)) return "info";
  if (["COMPLETED", "SUCCEEDED", "ACTIVE_OK", "RESOLVED", "SENT"].includes(status)) return "success";
  return "neutral";
}

function StatCard({ title, value, description, icon }: { title: string; value: number; description: string; icon: React.ReactNode }) {
  return (
    <Card>
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

export default async function OpsPage() {
  const user = await requireRoutePolicy("ops");
  const data = await getOpsHealthData(user.id, user.role);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Operations"
          description="Monitor deployment readiness, delivery health, and unresolved clinical workload from one business-facing workspace."
          action={(
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Job runs</Link>
              <Link href="/care-team" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Care Team</Link>
              <Link href="/exports" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Exports</Link>
            </div>
          )}
        />

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
          <StatCard title="Open alerts" value={data.summary.openAlerts} description="Alert events still waiting for review or triage." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Overdue reminders" value={data.summary.overdueReminders} description="Combined overdue and missed reminder workload." icon={<RefreshCcw className="h-5 w-5 text-sky-500" />} />
          <StatCard title="Severe symptoms" value={data.summary.severeSymptoms} description="Unresolved severe symptom entries needing visibility." icon={<HeartPulse className="h-5 w-5 text-rose-500" />} />
          <StatCard title="Abnormal labs" value={data.summary.abnormalLabs} description="Flagged high or low lab results requiring follow-up." icon={<ShieldAlert className="h-5 w-5 text-orange-500" />} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Failed job runs" value={data.summary.failedJobRuns} description="Failed or retrying BullMQ job run records." icon={<Database className="h-5 w-5 text-primary" />} />
          <StatCard title="Failed sync jobs" value={data.summary.failedSyncJobs} description="Device sync jobs that ended in failure." icon={<WifiOff className="h-5 w-5 text-rose-500" />} />
          <StatCard title="Stale connections" value={data.summary.staleConnections} description="Active device connections with no recent successful sync." icon={<WifiOff className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Active care access" value={data.summary.activeCareAccess} description="Currently active care-team access relationships." icon={<ShieldAlert className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Pending invites" value={data.summary.pendingInvites} description="Outstanding care-team invites still waiting to be accepted or revoked." icon={<UserPlus className="h-5 w-5 text-violet-500" />} />
          <StatCard title="Reminder emails (7d)" value={data.summary.emailedReminders7d} description="Email reminder sends recorded in the last 7 days across the current scope." icon={<Mail className="h-5 w-5 text-cyan-500" />} />
          <StatCard title="Resolved alerts (24h)" value={data.summary.resolvedAlerts24h} description="Alerts resolved during the last 24 hours, useful for workload throughput tracking." icon={<ShieldAlert className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent failed job runs</CardTitle>
              <CardDescription>Most recent failed or retrying queue executions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentFailedRuns.length ? data.recentFailedRuns.map((run) => (
                <div key={run.id} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{run.jobKind.replaceAll("_", " ")}</Badge>
                    <StatusPill tone={statusTone(run.status)}>{run.status}</StatusPill>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="font-medium">{run.jobName}</p>
                    <p className="text-sm text-muted-foreground">Queue: {run.queueName}</p>
                    <p className="text-sm text-muted-foreground">Actor: {run.user?.name || run.user?.email || "System"}</p>
                    <p className="text-sm text-muted-foreground">Device: {run.connection?.deviceLabel || run.connection?.clientDeviceId || "—"}</p>
                    <p className="text-sm text-muted-foreground">Created: {formatDateTime(run.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">Attempts: {run.attemptsMade} / {run.maxAttempts}</p>
                  </div>
                  {run.errorMessage ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                      {run.errorMessage}
                    </div>
                  ) : null}
                </div>
              )) : <div className="rounded-2xl border border-border/60 px-4 py-6 text-sm text-muted-foreground">No failed or retrying job runs right now.</div>}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent sync failures</CardTitle>
                <CardDescription>Failed device ingestion and sync attempts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentSyncFailures.length ? data.recentSyncFailures.map((job) => (
                  <div key={job.id} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{job.platform.replaceAll("_", " ")}</Badge>
                      <StatusPill tone={statusTone(job.status)}>{job.status}</StatusPill>
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="font-medium">{job.connection?.deviceLabel || job.connection?.clientDeviceId || "Unknown device"}</p>
                      <p className="text-sm text-muted-foreground">Source: {job.source.replaceAll("_", " ")}</p>
                      <p className="text-sm text-muted-foreground">Owner: {job.user?.name || job.user?.email || "System"}</p>
                      <p className="text-sm text-muted-foreground">Created: {formatDateTime(job.createdAt)}</p>
                    </div>
                    {job.errorMessage ? (
                      <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                        {job.errorMessage}
                      </div>
                    ) : null}
                  </div>
                )) : <div className="rounded-2xl border border-border/60 px-4 py-6 text-sm text-muted-foreground">No sync failures recorded recently.</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open alert snapshot</CardTitle>
                <CardDescription>Most recent open alert events across the current scope.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.openAlerts.length ? data.openAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{alert.category.replaceAll("_", " ")}</Badge>
                      <StatusPill tone={statusTone(alert.status)}>{alert.status}</StatusPill>
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">Severity: {alert.severity}</p>
                      <p className="text-sm text-muted-foreground">Owner: {alert.user?.name || alert.user?.email || "System"}</p>
                      <p className="text-sm text-muted-foreground">Created: {formatDateTime(alert.createdAt)}</p>
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-border/60 px-4 py-6 text-sm text-muted-foreground">No open alerts right now.</div>}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending care invite queue</CardTitle>
              <CardDescription>Recent invites still waiting for delivery follow-up, acceptance, or revocation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentPendingInvites.length ? data.recentPendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{invite.accessRole.replaceAll("_", " ")}</Badge>
                    <StatusPill tone={statusTone(invite.status)}>{invite.status}</StatusPill>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">Owner: {invite.owner.name || invite.owner.email || invite.owner.id}</p>
                    <p className="text-sm text-muted-foreground">Granted by: {invite.grantedBy.name || invite.grantedBy.email || invite.grantedBy.id}</p>
                    <p className="text-sm text-muted-foreground">Created: {formatDateTime(invite.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">Expires: {formatDateTime(invite.expiresAt)}</p>
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-border/60 px-4 py-6 text-sm text-muted-foreground">No pending invites right now.</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent reminder email deliveries</CardTitle>
              <CardDescription>Latest reminders sent through the email channel for patient follow-up visibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentReminderDeliveries.length ? data.recentReminderDeliveries.map((reminder) => (
                <div key={reminder.id} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{reminder.type.replaceAll("_", " ")}</Badge>
                    <StatusPill tone={statusTone(reminder.state)}>{reminder.state}</StatusPill>
                    <Badge>{reminder.channel}</Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">Owner: {reminder.user.name || reminder.user.email || reminder.user.id}</p>
                    <p className="text-sm text-muted-foreground">Due: {formatDateTime(reminder.dueAt)}</p>
                    <p className="text-sm text-muted-foreground">Sent: {formatDateTime(reminder.sentAt)}</p>
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-border/60 px-4 py-6 text-sm text-muted-foreground">No reminder emails have been sent yet in this scope.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
