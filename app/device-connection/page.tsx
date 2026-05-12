import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  DatabaseZap,
  HeartPulse,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Watch,
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
  buildConnectionHealthSummary,
  connectionStatusTone,
  formatDateTime,
  getDeviceIntegrationDashboardData,
  parseScopes,
  readingDisplayValue,
  readingLabel,
  sourceLabel,
  syncJobStatusTone,
} from "@/lib/device-integrations";
import {
  connectorCategoryLabel,
  connectorStatusLabel,
} from "@/lib/device-provider-connectors";
import {
  clearDeviceConnectionErrorAction,
  disconnectDeviceConnectionAction,
  reconnectDeviceConnectionAction,
  revokeDeviceConnectionAction,
} from "./actions";

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-2">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DeviceActionForms({
  connection,
}: {
  connection: { id: string; status: string; lastError: string | null };
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/device-connection/${connection.id}`}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-border/70 bg-background/60 px-3 text-sm font-medium hover:bg-muted/50"
      >
        View detail
      </Link>
      {connection.status === "ACTIVE" || connection.status === "ERROR" ? (
        <form action={disconnectDeviceConnectionAction}>
          <input type="hidden" name="connectionId" value={connection.id} />
          <Button type="submit" variant="outline" size="sm">
            Disconnect
          </Button>
        </form>
      ) : null}
      {connection.status === "DISCONNECTED" || connection.status === "ERROR" ? (
        <form action={reconnectDeviceConnectionAction}>
          <input type="hidden" name="connectionId" value={connection.id} />
          <Button type="submit" size="sm">
            Reconnect
          </Button>
        </form>
      ) : null}
      {connection.lastError ? (
        <form action={clearDeviceConnectionErrorAction}>
          <input type="hidden" name="connectionId" value={connection.id} />
          <Button type="submit" variant="outline" size="sm">
            Clear error
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export default async function DeviceConnectionsPage() {
  const user = await requireUser();
  const data = await getDeviceIntegrationDashboardData(user.id!);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Device Integrations"
          description="Manage connected mobile and health-device sync records, review ingestion health, test API payloads, and trace readings into sync jobs and mirrored vitals."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/device-sync-simulator"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50"
              >
                Run simulator
              </Link>
              <Link
                href="/api-docs"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50"
              >
                API docs
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Connections"
            value={data.summary.totalConnections}
            description="Mobile or device links registered for this account."
            icon={<Smartphone className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Active"
            value={data.summary.activeConnections}
            description="Connections currently accepting syncs."
            icon={<Watch className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard
            title="Readings"
            value={data.summary.totalReadings}
            description="Raw source-aware readings stored from connected devices."
            icon={<Activity className="h-5 w-5 text-sky-500" />}
          />
          <StatCard
            title="Sync jobs"
            value={data.summary.totalSyncJobs}
            description="Persisted sync attempts linked to device connections."
            icon={<DatabaseZap className="h-5 w-5 text-violet-500" />}
          />
          <StatCard
            title="Needs review"
            value={data.summary.reliability.needsReview}
            description="Blocked, paused, revoked, or stale connections requiring attention."
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Reliability command center</CardTitle>
                <CardDescription className="mt-1">
                  Operational view of freshness, blocked syncs, paused devices,
                  and connections waiting for their first payload.
                </CardDescription>
              </div>
              <StatusPill
                tone={
                  data.summary.reliability.needsReview ? "warning" : "success"
                }
              >
                {data.summary.reliability.needsReview
                  ? `${data.summary.reliability.needsReview} connection${data.summary.reliability.needsReview === 1 ? "" : "s"} to review`
                  : "All tracked connections stable"}
              </StatusPill>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-7">
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">Current</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.current}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">Sync due</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.due}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">Stale</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.stale}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">Blocked</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.blocked}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">Paused</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.paused}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">First sync</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.awaitingFirstSync}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <div className="text-muted-foreground">Revoked</div>
                <div className="mt-1 text-2xl font-semibold">
                  {data.summary.reliability.revoked}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Connection management</CardTitle>
                  <CardDescription className="mt-1">
                    Real database-backed connections from mobile API syncs and
                    the simulator, with safe user-owned lifecycle actions.
                  </CardDescription>
                </div>
                <StatusPill
                  tone={data.summary.erroredConnections ? "danger" : "success"}
                >
                  {data.summary.erroredConnections
                    ? `${data.summary.erroredConnections} needs review`
                    : "No active errors"}
                </StatusPill>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.connections.map((connection) => {
                const health = buildConnectionHealthSummary(connection);
                const reliability = connection.reliability;
                const scopes = parseScopes(connection.scopesJson);
                return (
                  <div
                    key={connection.id}
                    className="rounded-[28px] border border-border/60 bg-background/50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{sourceLabel(connection.source)}</Badge>
                          <Badge>{connection.platform}</Badge>
                          <StatusPill
                            tone={connectionStatusTone(connection.status)}
                          >
                            {connection.status}
                          </StatusPill>
                          <StatusPill tone={health.tone}>
                            {health.label}
                          </StatusPill>
                          <StatusPill tone={reliability.tone}>
                            {reliability.label}
                          </StatusPill>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">
                            {connection.deviceLabel ||
                              sourceLabel(connection.source)}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {connection.clientDeviceId}{" "}
                            {connection.appVersion
                              ? `• app ${connection.appVersion}`
                              : ""}
                          </p>
                        </div>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                          {health.description} {reliability.nextStep}
                        </p>
                      </div>
                      <DeviceActionForms connection={connection} />
                    </div>
                    <div className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">Last sync</div>
                        <div className="mt-1 font-medium">
                          {formatDateTime(connection.lastSyncedAt)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {reliability.syncAgeLabel}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">Readings</div>
                        <div className="mt-1 font-medium">
                          {connection._count.readings}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">Sync jobs</div>
                        <div className="mt-1 font-medium">
                          {connection._count.syncJobs}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/60 p-3">
                        <div className="text-muted-foreground">Job runs</div>
                        <div className="mt-1 font-medium">
                          {connection._count.jobRuns}
                        </div>
                      </div>
                    </div>
                    {scopes.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {scopes.map((scope) => (
                          <Badge key={scope}>{scope}</Badge>
                        ))}
                      </div>
                    ) : null}
                    {connection.lastError ? (
                      <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                        {connection.lastError}
                      </div>
                    ) : null}
                    {connection.status !== "REVOKED" ? (
                      <form
                        action={revokeDeviceConnectionAction}
                        className="mt-4 flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/40 p-3 sm:flex-row sm:items-center"
                      >
                        <input
                          type="hidden"
                          name="connectionId"
                          value={connection.id}
                        />
                        <input
                          name="confirmation"
                          placeholder="Type REVOKE"
                          className="h-9 rounded-xl border border-input bg-background/70 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Button type="submit" variant="destructive" size="sm">
                          Revoke
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Historical readings stay available for audit.
                        </p>
                      </form>
                    ) : null}
                  </div>
                );
              })}
              {data.connections.length === 0 ? (
                <EmptyState
                  title="No device connections yet"
                  description="Run the simulator or call the mobile device readings endpoint to create the first connection."
                />
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider connector map</CardTitle>
                <CardDescription className="mt-1">
                  Adapter contracts for phone health platforms, wearables, and
                  smart devices that normalize into the same mobile API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">
                      Providers
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {data.providerSummary.totalConnectors}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">
                      API-ready
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {data.providerSummary.readyConnectors}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">
                      Reading types
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {data.providerSummary.supportedReadingTypes}
                    </div>
                  </div>
                </div>
                {data.providerConnectors.map((connector) => (
                  <div
                    key={connector.source}
                    className="rounded-2xl border border-border/60 bg-background/40 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{connector.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {connectorCategoryLabel(connector.category)} •{" "}
                          {connector.platformHints.join(", ")}
                        </p>
                      </div>
                      <StatusPill
                        tone={
                          connector.status === "ready"
                            ? "success"
                            : connector.status === "simulated"
                              ? "info"
                              : "warning"
                        }
                      >
                        {connectorStatusLabel(connector.status)}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {connector.authModel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {connector.supportedReadings.slice(0, 4).map((type) => (
                        <Badge key={type}>{readingLabel(type)}</Badge>
                      ))}
                      {connector.supportedReadings.length > 4 ? (
                        <Badge>+{connector.supportedReadings.length - 4}</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mobile API QA panel</CardTitle>
                <CardDescription className="mt-1">
                  Use this payload shape when testing a real mobile client or
                  Postman request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="max-h-[420px] overflow-auto rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs">
                  {JSON.stringify(data.qaPayload, null, 2)}
                </pre>
                <div className="space-y-2">
                  {data.qaChecklist.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Supported readings</CardTitle>
                <CardDescription className="mt-1">
                  Schema-backed values accepted by
                  `/api/mobile/device-readings`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.supportedReadings.map((reading) => (
                  <div
                    key={reading.type}
                    className="rounded-2xl border border-border/60 bg-background/40 p-3"
                  >
                    <p className="font-medium">{readingLabel(reading.type)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Required: {reading.requiredValue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reading.behavior}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent readings</CardTitle>
              <CardDescription>
                Latest raw readings from any connection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {readingLabel(reading.readingType)}
                    </p>
                    <Badge>{sourceLabel(reading.source)}</Badge>
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {readingDisplayValue(reading)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Captured {formatDateTime(reading.capturedAt)}
                  </p>
                </div>
              ))}
              {data.recentReadings.length === 0 ? (
                <EmptyState
                  title="No readings yet"
                  description="Accepted mobile/device readings will appear here."
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent sync jobs</CardTitle>
              <CardDescription>
                Accepted, mirrored, failed, and partial import runs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentSyncJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{sourceLabel(job.source)}</p>
                    <StatusPill tone={syncJobStatusTone(job.status)}>
                      {job.status}
                    </StatusPill>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <p>Requested: {job.requestedCount}</p>
                    <p>Accepted: {job.acceptedCount}</p>
                    <p>Mirrored: {job.mirroredCount}</p>
                    <p>Created: {formatDateTime(job.createdAt)}</p>
                  </div>
                  {job.connectionId ? (
                    <Link
                      href={`/device-connection/${job.connectionId}`}
                      className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Open connection
                    </Link>
                  ) : null}
                  {job.errorMessage ? (
                    <p className="mt-3 text-sm text-destructive">
                      {job.errorMessage}
                    </p>
                  ) : null}
                </div>
              ))}
              {data.recentSyncJobs.length === 0 ? (
                <EmptyState
                  title="No sync jobs yet"
                  description="Mobile imports and simulator runs will create sync jobs."
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security posture</CardTitle>
              <CardDescription>
                How this module stays honest for a portfolio/demo app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                <Lock className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Mobile bearer tokens are separate from browser sessions and
                  can be revoked from Security.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                <RefreshCcw className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Each ingestion run creates a sync job so imports can be
                  audited and reviewed.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                <HeartPulse className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Supported readings mirror into normal vitals, while raw
                  readings remain traceable.
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Device data is informational and not clinical advice or a
                  medical-device workflow.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
