import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getJobsDashboardData } from "@/lib/jobs/dashboard";

function toneForRunStatus(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "FAILED":
      return "danger";
    case "RETRYING":
      return "warning";
    case "ACTIVE":
      return "info";
    default:
      return "neutral";
  }
}

export default async function JobsPage() {
  await requireUser();
  const dashboard = await getJobsDashboardData();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Jobs Dashboard"
          description="Queue overview and recent background job activity."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.queueCounts.map((queue) => (
            <Card key={queue.label}>
              <CardHeader>
                <CardTitle className="text-base">{queue.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Waiting</span>
                  <span>{queue.counts.waiting ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active</span>
                  <span>{queue.counts.active ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completed</span>
                  <span>{queue.counts.completed ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Failed</span>
                  <span>{queue.counts.failed ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delayed</span>
                  <span>{queue.counts.delayed ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent job runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.recentRuns.length ? (
              dashboard.recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-3xl border border-border/60 bg-background/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{run.jobName}</p>
                      <p className="text-sm text-muted-foreground">
                        Queue: {run.queueName}
                      </p>
                    </div>
                    <StatusPill tone={toneForRunStatus(run.status)}>
                      {run.status}
                    </StatusPill>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <span className="font-medium text-foreground">Created:</span>{" "}
                      {new Date(run.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Started:</span>{" "}
                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Finished:</span>{" "}
                      {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Attempts:</span>{" "}
                      {run.attemptsMade} / {run.maxAttempts}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <div>
                      <span className="font-medium text-foreground">User:</span>{" "}
                      {run.user?.name || run.user?.email || run.userId || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Connection ID:</span>{" "}
                      {run.connectionId || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Sync Job ID:</span>{" "}
                      {run.syncJobId || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">BullMQ Job ID:</span>{" "}
                      {run.bullmqJobId || "—"}
                    </div>
                  </div>

                  {run.errorMessage ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                      {run.errorMessage}
                    </div>
                  ) : null}

                  {run.logs.length ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Recent logs</p>
                      {run.logs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-border/60 bg-background/60 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {log.level}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{log.message}</p>
                          {log.contextJson ? (
                            <pre className="mt-2 overflow-x-auto rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                              {JSON.stringify(JSON.parse(log.contextJson), null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No job runs found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}