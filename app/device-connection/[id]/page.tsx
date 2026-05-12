import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  DatabaseZap,
  HeartPulse,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { requireUser } from "@/lib/session";
import {
  connectionStatusTone,
  formatDateTime,
  getDeviceConnectionDetailData,
  parseJsonObject,
  readingDisplayValue,
  readingLabel,
  sourceLabel,
  syncJobStatusTone,
} from "@/lib/device-integrations";
import {
  clearDeviceConnectionErrorAction,
  disconnectDeviceConnectionAction,
  reconnectDeviceConnectionAction,
  revokeDeviceConnectionAction,
} from "../actions";

function vitalDisplayValue(vital: {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  bloodSugar: number | null;
  oxygenSaturation: number | null;
  temperatureC: number | null;
  weightKg: number | null;
}) {
  const parts = [
    vital.systolic && vital.diastolic
      ? `${vital.systolic}/${vital.diastolic} BP`
      : null,
    vital.heartRate ? `${vital.heartRate} bpm` : null,
    vital.bloodSugar ? `${vital.bloodSugar} glucose` : null,
    vital.oxygenSaturation ? `${vital.oxygenSaturation}% SpO2` : null,
    vital.temperatureC ? `${vital.temperatureC} C` : null,
    vital.weightKg ? `${vital.weightKg} kg` : null,
  ].filter(Boolean);
  return parts.join(" • ") || "Device vital";
}

function ConnectionActionPanel({
  connection,
}: {
  connection: { id: string; status: string; lastError: string | null };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection actions</CardTitle>
        <CardDescription className="mt-1">
          Safe lifecycle actions for this user-owned device connection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connection.status === "ACTIVE" || connection.status === "ERROR" ? (
          <form action={disconnectDeviceConnectionAction}>
            <input type="hidden" name="connectionId" value={connection.id} />
            <Button type="submit" variant="outline" className="w-full">
              Disconnect
            </Button>
          </form>
        ) : null}
        {connection.status === "DISCONNECTED" ||
        connection.status === "ERROR" ? (
          <form action={reconnectDeviceConnectionAction}>
            <input type="hidden" name="connectionId" value={connection.id} />
            <Button type="submit" className="w-full">
              Reconnect / mark active
            </Button>
          </form>
        ) : null}
        {connection.lastError ? (
          <form action={clearDeviceConnectionErrorAction}>
            <input type="hidden" name="connectionId" value={connection.id} />
            <Button type="submit" variant="outline" className="w-full">
              Clear last error
            </Button>
          </form>
        ) : null}
        {connection.status !== "REVOKED" ? (
          <form
            action={revokeDeviceConnectionAction}
            className="space-y-2 rounded-2xl border border-border/60 bg-background/40 p-3"
          >
            <input type="hidden" name="connectionId" value={connection.id} />
            <input
              name="confirmation"
              placeholder="Type REVOKE"
              className="h-10 w-full rounded-2xl border border-input bg-background/70 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" variant="destructive" className="w-full">
              Revoke connection
            </Button>
            <p className="text-xs text-muted-foreground">
              Historical readings remain available for audit and reports.
            </p>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function DeviceConnectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getDeviceConnectionDetailData({
    userId: user.id!,
    connectionId: id,
  });
  if (!data) notFound();
  const { connection, health, reliability } = data;
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title={connection.deviceLabel || sourceLabel(connection.source)}
          description="Review this device connection, recent readings, sync jobs, job-run history, mirrored vitals, and stored metadata."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/device-connection"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50"
              >
                Back to devices
              </Link>
              <Link
                href="/device-sync-simulator"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50"
              >
                Run simulator
              </Link>
            </div>
          }
        />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Connection overview</CardTitle>
                  <CardDescription className="mt-1">
                    Source, platform, client device id, scopes, and latest sync
                    state.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={connectionStatusTone(connection.status)}>
                    {connection.status}
                  </StatusPill>
                  <StatusPill tone={health.tone}>{health.label}</StatusPill>
                  <StatusPill tone={reliability.tone}>
                    {reliability.label}
                  </StatusPill>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 p-4">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">
                    {sourceLabel(connection.source)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <Activity className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Platform</p>
                  <p className="font-medium">{connection.platform}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <DatabaseZap className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Readings</p>
                  <p className="font-medium">{connection._count.readings}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-4">
                  <RefreshCcw className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Sync jobs
                  </p>
                  <p className="font-medium">{connection._count.syncJobs}</p>
                </div>
              </div>
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Client device id</dt>
                  <dd className="mt-1 break-all font-medium">
                    {connection.clientDeviceId}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">App version</dt>
                  <dd className="mt-1 font-medium">
                    {connection.appVersion || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(connection.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last synced</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(connection.lastSyncedAt)}
                  </dd>
                </div>
              </dl>
              {data.scopes.length ? (
                <div>
                  <p className="text-sm font-medium">Scopes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.scopes.map((scope) => (
                      <Badge key={scope}>{scope}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {connection.lastError ? (
                <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <span>{connection.lastError}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reliability signal</CardTitle>
                <CardDescription className="mt-1">
                  Freshness and remediation guidance for this specific device
                  source.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={reliability.tone}>
                    {reliability.label}
                  </StatusPill>
                  <Badge>{reliability.syncAgeLabel}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {reliability.description}
                </p>
                <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next step
                  </p>
                  <p className="mt-1 font-medium">{reliability.nextStep}</p>
                </div>
              </CardContent>
            </Card>
            <ConnectionActionPanel connection={connection} />
            <Card>
              <CardHeader>
                <CardTitle>Traceability</CardTitle>
                <CardDescription className="mt-1">
                  How this connection feeds the rest of VitaVault.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                  <DatabaseZap className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    Raw device readings remain source-aware and timestamped.
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                  <HeartPulse className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    Supported readings mirror into the normal vitals workflow.
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    Lifecycle actions write audit-log records for reviewer
                    visibility.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent readings</CardTitle>
              <CardDescription>
                Latest raw records for this connection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.readings.map((reading) => {
                const metadata = parseJsonObject(reading.metadataJson);
                const rawPayload = parseJsonObject(reading.rawPayloadJson);
                return (
                  <div
                    key={reading.id}
                    className="rounded-2xl border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {readingLabel(reading.readingType)}
                      </p>
                      <Badge>{formatDateTime(reading.capturedAt)}</Badge>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">
                      {readingDisplayValue(reading)}
                    </p>
                    {metadata ? (
                      <pre className="mt-3 max-h-28 overflow-auto rounded-xl bg-muted/40 p-3 text-xs">
                        {JSON.stringify(metadata, null, 2)}
                      </pre>
                    ) : null}
                    {rawPayload ? (
                      <pre className="mt-3 max-h-28 overflow-auto rounded-xl bg-muted/40 p-3 text-xs">
                        {JSON.stringify(rawPayload, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                );
              })}
              {data.readings.length === 0 ? (
                <EmptyState
                  title="No readings for this connection"
                  description="Run a sync to populate source-aware readings."
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sync jobs</CardTitle>
              <CardDescription>
                Import attempts linked to this connection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.syncJobs.map((job) => {
                const metadata = parseJsonObject(job.metadataJson);
                return (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">Sync job</p>
                      <StatusPill tone={syncJobStatusTone(job.status)}>
                        {job.status}
                      </StatusPill>
                    </div>
                    <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                      <p>Requested: {job.requestedCount}</p>
                      <p>Accepted: {job.acceptedCount}</p>
                      <p>Mirrored: {job.mirroredCount}</p>
                      <p>Started: {formatDateTime(job.startedAt)}</p>
                      <p>Finished: {formatDateTime(job.finishedAt)}</p>
                    </div>
                    {job.errorMessage ? (
                      <p className="mt-3 text-sm text-destructive">
                        {job.errorMessage}
                      </p>
                    ) : null}
                    {metadata ? (
                      <pre className="mt-3 max-h-28 overflow-auto rounded-xl bg-muted/40 p-3 text-xs">
                        {JSON.stringify(metadata, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                );
              })}
              {data.syncJobs.length === 0 ? (
                <EmptyState
                  title="No sync jobs yet"
                  description="Mobile imports and simulator runs will appear here."
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mirrored vitals</CardTitle>
              <CardDescription>
                Latest vitals created from this connection source.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.mirroredVitals.map((vital) => (
                <div
                  key={vital.id}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{vitalDisplayValue(vital)}</p>
                    <Badge>{sourceLabel(vital.readingSource)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Recorded {formatDateTime(vital.recordedAt)}
                  </p>
                  {vital.notes ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {vital.notes}
                    </p>
                  ) : null}
                </div>
              ))}
              {data.mirroredVitals.length === 0 ? (
                <EmptyState
                  title="No mirrored vitals yet"
                  description="Supported readings mirror into vitals after ingestion."
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Job runs</CardTitle>
            <CardDescription>
              Persisted worker/job-run records tied to this device connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.jobRuns.map((run) => (
              <div
                key={run.id}
                className="rounded-2xl border border-border/60 bg-background/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{run.jobName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sourceLabel(run.jobKind)}
                    </p>
                  </div>
                  <Badge>{run.status}</Badge>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground md:grid-cols-4">
                  <p>
                    Attempts: {run.attemptsMade} / {run.maxAttempts}
                  </p>
                  <p>Created: {formatDateTime(run.createdAt)}</p>
                  <p>Finished: {formatDateTime(run.finishedAt)}</p>
                  <p>{run.errorMessage || "No error"}</p>
                </div>
              </div>
            ))}
            {data.jobRuns.length === 0 ? (
              <EmptyState
                title="No job runs yet"
                description="Queue-backed device sync job runs will appear here when available."
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
