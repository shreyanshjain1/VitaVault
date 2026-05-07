import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, DatabaseZap, HeartPulse, Play, RefreshCcw, Smartphone, Watch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@/components/ui";
import { requireUser } from "@/lib/session";
import {
  getDeviceSyncSimulatorData,
  readingDisplayValue,
  readingLabel,
  simulatorProviders,
  vitalDisplayValue,
} from "@/lib/device-sync-simulator";
import { runDeviceSyncSimulationAction } from "./actions";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function statusTone(status: string) {
  if (["SUCCEEDED", "COMPLETED", "ACTIVE"].includes(status)) return "success" as const;
  if (["RUNNING", "QUEUED", "PARTIAL"].includes(status)) return "info" as const;
  if (["ERROR", "FAILED", "REVOKED"].includes(status)) return "danger" as const;
  if (["DISCONNECTED", "RETRYING"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

function sourceLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatCard({ title, value, description, icon }: { title: string; value: number | string; description: string; icon: ReactNode }) {
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

export default async function DeviceSyncSimulatorPage() {
  const user = await requireUser();
  const data = await getDeviceSyncSimulatorData(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Device Sync Simulator"
          description="Run a safe sample sync that creates source-aware device readings, mirrored vitals, sync jobs, and job-run logs for demos without requiring a real wearable integration."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/device-connection" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50">
                Device integrations
              </Link>
              <Link href="/vitals-monitor" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50">
                Vitals monitor
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Connections" value={data.summary.totalConnections} description="Simulator and device connections created for this workspace." icon={<Smartphone className="h-5 w-5 text-primary" />} />
          <StatCard title="Active" value={data.summary.activeConnections} description="Connections currently marked active and ready for ingestion." icon={<Watch className="h-5 w-5 text-emerald-500" />} />
          <StatCard title="Readings" value={data.summary.recentReadings} description="Recent source-aware readings available for review." icon={<Activity className="h-5 w-5 text-sky-500" />} />
          <StatCard title="Accepted" value={data.summary.acceptedCount} description="Readings accepted by recent simulator sync jobs." icon={<DatabaseZap className="h-5 w-5 text-violet-500" />} />
          <StatCard title="Mirrored" value={data.summary.mirroredCount} description="Accepted readings mirrored into the vitals table." icon={<HeartPulse className="h-5 w-5 text-rose-500" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Run demo sync</CardTitle>
              <CardDescription>
                Pick a provider and create realistic sample readings. The simulator is idempotent per timestamped sample batch and stays inside your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={runDeviceSyncSimulationAction} className="space-y-4 rounded-[28px] border border-border/60 bg-background/50 p-4">
                <div className="space-y-2">
                  <label htmlFor="source" className="text-sm font-medium">Demo provider</label>
                  <Select id="source" name="source" defaultValue={simulatorProviders[0].source}>
                    {simulatorProviders.map((provider) => (
                      <option key={provider.source} value={provider.source}>{provider.title}</option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  <Play className="h-4 w-4" />
                  Run simulator sync
                </Button>
              </form>

              <div className="space-y-3">
                {simulatorProviders.map((provider) => (
                  <div key={provider.source} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{provider.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{provider.description}</p>
                      </div>
                      <StatusPill tone={provider.tone}>{sourceLabel(provider.source)}</StatusPill>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.readings.map((reading) => <Badge key={reading}>{reading}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection state</CardTitle>
              <CardDescription>Latest source connections and their ingestion footprints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.connections.map((connection) => (
                <div key={connection.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{connection.deviceLabel || sourceLabel(connection.source)}</p>
                      <p className="text-xs text-muted-foreground">{sourceLabel(connection.source)} • {connection.platform}</p>
                    </div>
                    <StatusPill tone={statusTone(connection.status)}>{connection.status}</StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <p>Last sync: {formatDateTime(connection.lastSyncedAt)}</p>
                    <p>Created: {formatDateTime(connection.createdAt)}</p>
                    <p>{connection._count.readings} readings</p>
                    <p>{connection._count.syncJobs} sync jobs</p>
                  </div>
                  <Link href={`/device-connection/${connection.id}`} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">Open connection detail</Link>
                  {connection.lastError ? <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{connection.lastError}</p> : null}
                </div>
              ))}
              {data.connections.length === 0 ? <EmptyState title="No simulated connections yet" description="Run a demo sync to create a sample provider connection." /> : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent readings</CardTitle>
              <CardDescription>Raw source-aware device readings accepted by the simulator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentReadings.map((reading) => (
                <div key={reading.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{readingLabel(reading.readingType)}</p>
                    <Badge>{sourceLabel(reading.source)}</Badge>
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{readingDisplayValue(reading)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Captured {formatDateTime(reading.capturedAt)}</p>
                </div>
              ))}
              {data.recentReadings.length === 0 ? <EmptyState title="No readings yet" description="Accepted readings will appear after a simulator sync." /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync job history</CardTitle>
              <CardDescription>Persisted sync jobs created by the simulator workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentSyncJobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{sourceLabel(job.source)}</p>
                    <StatusPill tone={statusTone(job.status)}>{job.status}</StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <p>Requested: {job.requestedCount}</p>
                    <p>Accepted: {job.acceptedCount}</p>
                    <p>Mirrored: {job.mirroredCount}</p>
                    <p>Finished: {formatDateTime(job.finishedAt)}</p>
                  </div>
                  {job.errorMessage ? <p className="mt-3 text-sm text-destructive">{job.errorMessage}</p> : null}
                </div>
              ))}
              {data.recentSyncJobs.length === 0 ? <EmptyState title="No sync jobs yet" description="Simulator sync jobs will appear here after a run." /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mirrored vitals</CardTitle>
              <CardDescription>Device readings that were copied into the main vitals record system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.mirroredVitals.map((vital) => (
                <div key={vital.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{vitalDisplayValue(vital)}</p>
                    <Badge>{sourceLabel(vital.readingSource)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Recorded {formatDateTime(vital.recordedAt)}</p>
                  {vital.notes ? <p className="mt-2 text-sm text-muted-foreground">{vital.notes}</p> : null}
                </div>
              ))}
              {data.mirroredVitals.length === 0 ? <EmptyState title="No mirrored vitals yet" description="Non-step simulator readings will appear here after they are mirrored into vitals." /> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Why this matters for demos</CardTitle>
            <CardDescription>Patch 46 connects the device/mobile foundation into a visible integration workspace with connection detail views, lifecycle actions, QA payloads, and traceable sync history.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <RefreshCcw className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Shows ingestion flow</p>
              <p className="mt-1 text-sm text-muted-foreground">A single action creates connection, readings, sync job, job run, and mirrored vitals.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <DatabaseZap className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Proves data modeling</p>
              <p className="mt-1 text-sm text-muted-foreground">The simulator uses the existing device, sync, job, and vital models instead of fake UI-only cards.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <HeartPulse className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Feeds monitoring pages</p>
              <p className="mt-1 text-sm text-muted-foreground">Mirrored vitals become visible in monitoring and trend workflows after sync.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
