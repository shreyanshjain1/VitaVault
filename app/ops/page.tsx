import { AlertTriangle, Database, HeartPulse, RefreshCcw, ShieldAlert, WifiOff } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
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
  if (["RETRYING", "PARTIAL", "DISCONNECTED", "OVERDUE", "MISSED"].includes(status)) return "warning";
  if (["ACTIVE", "RUNNING", "OPEN"].includes(status)) return "info";
  if (["COMPLETED", "SUCCEEDED", "ACTIVE_OK"].includes(status)) return "success";
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
  const user = await requireUser();
  const data = await getOpsHealthData(user.id!, user.role);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Operations"
          description="Monitor deployment readiness, operational failure signals, and unresolved clinical load from one admin-facing workspace."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
      </div>
    </AppShell>
  );
}
