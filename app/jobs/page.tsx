import { Activity, AlertTriangle, Cpu, RefreshCcw } from "lucide-react";
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

export default async function JobsDashboardPage() {
  const user = await requireUser();

  const [dashboard, deviceConnections] = await Promise.all([
    getJobsDashboardData({
      id: user.id,
      role: user.role,
    }),
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
      <div className="space-y-6">
        <PageHeader
          title="Background Jobs"
          description="Redis + BullMQ operational layer for alert checks, reminder generation, daily summaries, and device sync processing."
          action={
            <StatusPill tone={dashboard.redisHealthy ? "success" : "danger"}>
              {dashboard.redisHealthy ? "Redis connected" : "Redis unavailable"}
            </StatusPill>
          }
        />

        {user.role !== APP_ROLES.ADMIN ? (
          <Card className="border border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Scoped dashboard view</p>
                  <p className="text-sm text-muted-foreground">
                    This account is not an admin, so recent job runs are filtered to this user’s activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.queues.map((queue) => (
            <Card key={queue.queueName}>
              <CardHeader className="pb-3">
                <CardDescription>{queue.label}</CardDescription>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">{queue.queueName}</span>
                  <Badge className={queue.healthy ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}>
                    {queue.healthy ? "healthy" : "error"}
                  </Badge>
                </CardTitle>
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
                {queue.error ? (
                  <div className="col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
                    {queue.error}
                  </div>
                ) : null}
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
          />

          <Card>
            <CardHeader>
              <CardTitle>Operational notes</CardTitle>
              <CardDescription>
                What this iteration proves inside the repo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <Cpu className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Separate worker runtime inside the same monorepo-style app folder.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <RefreshCcw className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Retry-aware BullMQ queues with persistent database job-run audit records.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <Activity className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Device sync jobs now mirror supported readings into the vitals model in an idempotent way.
                </div>
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
                <div
                  key={run.id}
                  className="rounded-3xl border border-border/60 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{run.jobKind.replaceAll("_", " ")}</Badge>
                        <StatusPill
                          tone={
                            run.status === "COMPLETED"
                              ? "success"
                              : run.status === "FAILED"
                              ? "danger"
                              : run.status === "RETRYING"
                              ? "warning"
                              : run.status === "ACTIVE"
                              ? "info"
                              : "neutral"
                          }
                        >
                          {run.status}
                        </StatusPill>
                      </div>

                      <div>
                        <div className="font-medium">{run.jobName}</div>
                        <div className="text-sm text-muted-foreground">
                          Queue: {run.queueName}
                        </div>
                      </div>

                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <div>Attempts: {run.attemptsMade} / {run.maxAttempts}</div>
                        <div>Created: {formatDateTime(run.createdAt)}</div>
                        <div>Started: {formatDateTime(run.startedAt)}</div>
                        <div>Finished: {formatDateTime(run.finishedAt)}</div>
                        {run.user ? (
                          <div>
                            User: {run.user.name || run.user.email || run.user.id}
                          </div>
                        ) : null}
                        {run.connection ? (
                          <div>
                            Connection: {run.connection.deviceLabel || run.connection.id}
                          </div>
                        ) : null}
                        {run.syncJob ? (
                          <div>
                            SyncJob: {run.syncJob.id} • {run.syncJob.status} • mirrored {run.syncJob.mirroredCount}/{run.syncJob.requestedCount}
                          </div>
                        ) : null}
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
                          <div
                            key={log.id}
                            className="rounded-2xl border border-border/60 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{log.level}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              {log.message}
                            </div>
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
              <div className="rounded-2xl border border-border/60 px-4 py-6 text-sm text-muted-foreground">
                No job runs yet. Queue one from the dispatch panel above.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}