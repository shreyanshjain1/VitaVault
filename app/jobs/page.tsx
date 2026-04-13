import { Activity, Cpu, RefreshCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { JobDispatchPanel } from "@/components/job-dispatch-panel";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { APP_ROLES } from "@/lib/domain/enums";
import { getJobsDashboardData } from "@/lib/jobs/dashboard";
import { requireUser } from "@/lib/session";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function runTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "RETRYING") return "warning";
  if (status === "ACTIVE") return "info";
  return "neutral";
}

export default async function JobsDashboardPage() {
  const user = await requireUser();

  const [dashboard, deviceConnections] = await Promise.all([
    getJobsDashboardData(),
    db.deviceConnection.findMany({
      where:
        user.role === APP_ROLES.ADMIN
          ? undefined
          : {
              userId: user.id,
            },
      select: {
        id: true,
        deviceLabel: true,
        source: true,
        status: true,
        clientDeviceId: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 12,
    }),
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Background Jobs"
          description="Redis + BullMQ operational layer for alert checks, reminder generation, daily summaries, and device sync processing."
        />

        {!dashboard.jobsAvailable ? (
          <Card className="border border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Cpu className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
                <div>
                  <p className="font-medium">Jobs dashboard is in degraded mode</p>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.unavailableReason ?? "Queue-backed metrics are temporarily unavailable."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {user.role !== APP_ROLES.ADMIN ? (
          <Card className="border border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Cpu className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Scoped dashboard view</p>
                  <p className="text-sm text-muted-foreground">
                    This account is not an admin, so the operational view is best treated as a personal activity panel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.queueCounts.map((queue) => (
            <Card key={queue.label}>
              <CardHeader className="pb-3">
                <CardDescription>{queue.label}</CardDescription>
                <CardTitle className="text-base">Queue health</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-border/60 p-3">
                  <div className="text-muted-foreground">Waiting</div>
                  <div className="mt-1 text-lg font-semibold">{queue.counts.waiting ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <div className="text-muted-foreground">Active</div>
                  <div className="mt-1 text-lg font-semibold">{queue.counts.active ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <div className="text-muted-foreground">Completed</div>
                  <div className="mt-1 text-lg font-semibold">{queue.counts.completed ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="mt-1 text-lg font-semibold">{queue.counts.failed ?? 0}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <JobDispatchPanel
            deviceConnections={deviceConnections.map((connection) => ({
              id: connection.id,
              label: connection.deviceLabel || connection.clientDeviceId,
              source: connection.source,
              status: connection.status,
            }))}
            jobsAvailable={dashboard.jobsAvailable}
            unavailableReason={dashboard.unavailableReason}
          />

          <Card>
            <CardHeader>
              <CardTitle>Operational notes</CardTitle>
              <CardDescription>What this iteration proves inside the repo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <Cpu className="mt-0.5 h-4 w-4 text-primary" />
                <div>Separate worker runtime inside the same app repo.</div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <RefreshCcw className="mt-0.5 h-4 w-4 text-primary" />
                <div>Retry-aware BullMQ queues with persisted database job-run records.</div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <Activity className="mt-0.5 h-4 w-4 text-primary" />
                <div>Device sync jobs mirror supported readings into vitals in an idempotent way.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent job runs</CardTitle>
            <CardDescription>
              Most recent persisted queue runs, attempts, results, and worker logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.recentRuns.length ? (
              dashboard.recentRuns.map((run) => (
                <div key={run.id} className="rounded-3xl border border-border/60 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{run.jobKind.replaceAll("_", " ")}</Badge>
                        <StatusPill tone={runTone(run.status)}>{run.status}</StatusPill>
                      </div>

                      <div>
                        <div className="font-medium">{run.jobName}</div>
                        <div className="text-sm text-muted-foreground">Queue: {run.queueName}</div>
                      </div>

                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <div>Attempts: {run.attemptsMade} / {run.maxAttempts}</div>
                        <div>Created: {formatDateTime(run.createdAt)}</div>
                        <div>Started: {formatDateTime(run.startedAt)}</div>
                        <div>Finished: {formatDateTime(run.finishedAt)}</div>
                        {run.user ? <div>User: {run.user.name || run.user.email || run.user.id}</div> : null}
                        <div>Connection ID: {run.connectionId ?? "—"}</div>
                        <div>Sync Job ID: {run.syncJobId ?? "—"}</div>
                      </div>

                      {run.errorMessage ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                          {run.errorMessage}
                        </div>
                      ) : null}
                    </div>

                    <div className="w-full max-w-xl space-y-2">
                      <div className="text-sm font-medium">Recent logs</div>
                      {run.logs.length ? (
                        run.logs.map((log) => (
                          <div key={log.id} className="rounded-2xl border border-border/60 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{log.level}</span>
                              <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                            </div>
                            <div className="mt-1 text-muted-foreground">{log.message}</div>
                            {log.contextJson ? (
                              <pre className="mt-2 overflow-x-auto rounded-xl bg-muted/50 p-2 text-xs text-muted-foreground">
                                {log.contextJson}
                              </pre>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-border/60 px-3 py-2 text-sm text-muted-foreground">
                          No logs for this run yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
                No job runs found yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
