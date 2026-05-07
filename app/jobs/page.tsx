import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  Filter,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { JobDispatchPanel } from "@/components/job-dispatch-panel";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { getJobsDashboardData } from "@/lib/jobs/dashboard";
import {
  buildJobRunDeepLink,
  isCancellableJobRunStatus,
  isRetryableJobRunStatus,
  jobRunTone,
  parseJobRunJson,
  parseJobRunOpsFilter,
  type JobRunFilterKind,
  type JobRunFilterStatus,
} from "@/lib/jobs/admin-tools";
import { requireRoutePolicy } from "@/lib/route-policy";
import {
  acknowledgeJobRunAction,
  cancelJobRunAction,
  retryJobRunAction,
} from "./actions";

const STATUS_FILTERS: { label: string; value: JobRunFilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Queued", value: "QUEUED" },
  { label: "Active", value: "ACTIVE" },
  { label: "Retrying", value: "RETRYING" },
  { label: "Failed", value: "FAILED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const KIND_FILTERS: { label: string; value: JobRunFilterKind }[] = [
  { label: "All kinds", value: "all" },
  { label: "Alerts", value: "ALERT_EVALUATION" },
  { label: "Reminders", value: "REMINDER_GENERATION" },
  { label: "Daily summary", value: "DAILY_HEALTH_SUMMARY" },
  { label: "Device sync", value: "DEVICE_SYNC_PROCESSING" },
];

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function compactId(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function filterHref(params: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") search.set(key, value);
  });
  const query = search.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function JsonPreview({ title, value }: { title: string; value: string | null }) {
  const parsed = parseJobRunJson(value);
  if (!parsed) return null;
  return (
    <details className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">{title}</summary>
      <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap">{JSON.stringify(parsed, null, 2)}</pre>
    </details>
  );
}

function JobActionForm({
  action,
  jobRunId,
  label,
  variant = "outline",
  icon,
}: {
  action: (formData: FormData) => Promise<void>;
  jobRunId: string;
  label: string;
  variant?: "outline" | "secondary" | "destructive";
  icon?: ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="jobRunId" value={jobRunId} />
      <Button type="submit" variant={variant} size="sm">
        {icon}
        {label}
      </Button>
    </form>
  );
}

export default async function JobsDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRoutePolicy("jobs");
  const params = (await searchParams) ?? {};
  const filters = parseJobRunOpsFilter(params);

  const [dashboard, deviceConnections] = await Promise.all([
    getJobsDashboardData({ filters }),
    db.deviceConnection.findMany({
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
          description="Admin control center for Redis/BullMQ queues, persisted job runs, retry/rerun workflows, device sync processing, and operational review."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/ops" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50">
                Ops dashboard
              </Link>
              <Link href="/audit-log?source=job" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50">
                Job audit
              </Link>
            </div>
          }
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Persisted runs</CardDescription>
              <CardTitle>{dashboard.summary.totalRuns}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">All saved job-run records in the database.</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Needs review</CardDescription>
              <CardTitle>{dashboard.summary.failedRuns}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Failed or retrying runs that need admin attention.</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In flight</CardDescription>
              <CardTitle>{dashboard.summary.activeRuns}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Queued or active persisted runs.</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recent failure rate</CardDescription>
              <CardTitle>{dashboard.summary.failureRate}%</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Failed/retrying share across the latest 100 runs.</CardContent>
          </Card>
        </div>

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
              <CardTitle>Admin operations added in v2</CardTitle>
              <CardDescription>What Patch 47 proves inside the product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>Manual job dispatch and job admin routes are admin-gated instead of authenticated-only.</div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <RotateCcw className="mt-0.5 h-4 w-4 text-primary" />
                <div>Failed, retrying, or cancelled job runs can be re-queued from persisted input payloads.</div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
                <Activity className="mt-0.5 h-4 w-4 text-primary" />
                <div>Device sync jobs now retain connection and sync-job links for traceability.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job filters</CardTitle>
            <CardDescription>Review failed runs, device-sync runs, statuses, kinds, and exact ids.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action="/jobs" className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Search job name, id, BullMQ id, connection id, sync job id, or error"
                className="h-10 rounded-2xl border border-border/70 bg-background/60 px-4 text-sm outline-none focus:border-primary/60"
              />
              <select name="status" defaultValue={filters.status} className="h-10 rounded-2xl border border-border/70 bg-background/60 px-3 text-sm">
                {STATUS_FILTERS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <select name="kind" defaultValue={filters.kind} className="h-10 rounded-2xl border border-border/70 bg-background/60 px-3 text-sm">
                {KIND_FILTERS.map((kind) => (
                  <option key={kind.value} value={kind.value}>{kind.label}</option>
                ))}
              </select>
              <Button type="submit">
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 text-sm">
              <Link href={filterHref({ review: "failed" })} className="rounded-full border border-border/60 px-3 py-1.5 hover:bg-muted/50">Needs review</Link>
              <Link href={filterHref({ review: "device" })} className="rounded-full border border-border/60 px-3 py-1.5 hover:bg-muted/50">Device sync only</Link>
              <Link href={filterHref({ status: "ACTIVE" })} className="rounded-full border border-border/60 px-3 py-1.5 hover:bg-muted/50">Active</Link>
              <Link href={filterHref({ status: "FAILED" })} className="rounded-full border border-border/60 px-3 py-1.5 hover:bg-muted/50">Failed</Link>
              <Link href="/jobs" className="rounded-full border border-border/60 px-3 py-1.5 hover:bg-muted/50">Clear filters</Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent job runs</CardTitle>
            <CardDescription>
              Persisted queue runs with attempts, payload previews, retry controls, cancellation, and worker logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.recentRuns.length ? (
              dashboard.recentRuns.map((run) => {
                const retryable = isRetryableJobRunStatus(run.status);
                const cancellable = isCancellableJobRunStatus(run.status);
                const deepLink = buildJobRunDeepLink(run);

                return (
                  <div key={run.id} className="rounded-3xl border border-border/60 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{run.jobKind.replaceAll("_", " ")}</Badge>
                          <StatusPill tone={jobRunTone(run.status)}>{run.status}</StatusPill>
                          {run.attemptsMade >= run.maxAttempts && run.maxAttempts > 0 ? <StatusPill tone="warning">Max attempts</StatusPill> : null}
                        </div>

                        <div>
                          <div className="font-medium">{run.jobName}</div>
                          <div className="text-sm text-muted-foreground">Queue: {run.queueName}</div>
                        </div>

                        <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                          <div>Run ID: {compactId(run.id)}</div>
                          <div>BullMQ ID: {compactId(run.bullmqJobId)}</div>
                          <div>Attempts: {run.attemptsMade} / {run.maxAttempts}</div>
                          <div>Created: {formatDateTime(run.createdAt)}</div>
                          <div>Started: {formatDateTime(run.startedAt)}</div>
                          <div>Finished: {formatDateTime(run.finishedAt)}</div>
                          {run.user ? <div>User: {run.user.name || run.user.email || run.user.id}</div> : null}
                          <div>Connection: {run.connection ? run.connection.deviceLabel || run.connection.clientDeviceId : compactId(run.connectionId)}</div>
                          <div>Sync Job ID: {compactId(run.syncJobId)}</div>
                        </div>

                        {run.errorMessage ? (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                            {run.errorMessage}
                          </div>
                        ) : null}

                        <div className="grid gap-2 lg:grid-cols-2">
                          <JsonPreview title="Input payload" value={run.inputJson} />
                          <JsonPreview title="Result payload" value={run.resultJson} />
                        </div>
                      </div>

                      <div className="w-full space-y-3 xl:max-w-md">
                        <div className="flex flex-wrap gap-2">
                          {retryable ? (
                            <JobActionForm action={retryJobRunAction} jobRunId={run.id} label="Retry" icon={<RotateCcw className="h-4 w-4" />} />
                          ) : null}
                          {cancellable ? (
                            <JobActionForm action={cancelJobRunAction} jobRunId={run.id} label="Cancel" variant="destructive" icon={<XCircle className="h-4 w-4" />} />
                          ) : null}
                          <JobActionForm action={acknowledgeJobRunAction} jobRunId={run.id} label="Acknowledge" variant="secondary" icon={<ShieldCheck className="h-4 w-4" />} />
                          <Link href={deepLink} className="inline-flex h-9 items-center justify-center rounded-xl border border-border/70 bg-background/60 px-3 text-sm font-medium hover:bg-muted/50">
                            Open trace
                          </Link>
                        </div>

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
                                <pre className="mt-2 max-h-28 overflow-x-auto rounded-xl bg-muted/50 p-2 text-xs text-muted-foreground">
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
                );
              })
            ) : (
              <EmptyState title="No job runs found" description="Try clearing filters or dispatching a sample job from the manual dispatch panel." />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
