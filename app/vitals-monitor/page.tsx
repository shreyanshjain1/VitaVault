import Link from "next/link";
import { Activity, AlertTriangle, HeartPulse, Smartphone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getVitalPriorityTone, getVitalStatusTone, getVitalsMonitorData, type VitalMetricCard } from "@/lib/vitals-monitor";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatAverage(value: number | null, suffix: string, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("en-PH", { maximumFractionDigits: digits }).format(value)}${suffix}`;
}

function readinessTone(value: number): "success" | "warning" | "danger" {
  if (value >= 80) return "success";
  if (value >= 55) return "warning";
  return "danger";
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function StatCard({ title, value, description, icon }: { title: string; value: string | number; description: string; icon: React.ReactNode }) {
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

function MetricCard({ item }: { item: VitalMetricCard }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="mt-2 text-2xl font-semibold">{item.latest}</p>
          {item.previous ? <p className="mt-1 text-xs text-muted-foreground">Previous: {item.previous}</p> : null}
        </div>
        <StatusPill tone={getVitalStatusTone(item.status)}>{item.status}</StatusPill>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge>{formatDateTime(item.capturedAt)}</Badge>
        {item.delta ? <Badge>Delta {item.delta}</Badge> : null}
      </div>
    </div>
  );
}

export default async function VitalsMonitorPage() {
  const user = await requireUser();
  const data = await getVitalsMonitorData(user.id!);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Vitals Monitor"
          description="Review blood pressure, pulse, oxygen, glucose, temperature, weight, device coverage, and urgent vital signs from one focused workspace."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/vitals" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                Add readings
              </Link>
              <Link href="/trends" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                View trends
              </Link>
              <Link href="/summary/print?mode=doctor" className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95">
                Doctor packet
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Vitals readiness" value={`${data.summary.readinessScore}%`} description="Blends urgent readings, watch-zone readings, missing metrics, and freshness." icon={<HeartPulse className="h-5 w-5 text-primary" />} />
          <StatCard title="7-day readings" value={data.summary.readingsLastSevenDays} description={`${data.summary.averagePerWeek} readings per day on average this week.`} icon={<Activity className="h-5 w-5 text-emerald-500" />} />
          <StatCard title="Watch items" value={data.summary.dangerMetrics + data.summary.watchMetrics} description="Metric areas currently in urgent or watch range." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Device coverage" value={`${data.summary.deviceCoverage}%`} description={`${data.summary.activeDeviceConnections} active device connection${data.summary.activeDeviceConnections === 1 ? "" : "s"}.`} icon={<Smartphone className="h-5 w-5 text-sky-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring readiness</CardTitle>
              <CardDescription>A practical signal for whether vitals are fresh, broad, and safe enough for care review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">{data.summary.readinessScore}%</p>
                  <p className="text-sm text-muted-foreground">{data.summary.totalReadings} readings reviewed from the last 90 days</p>
                </div>
                <StatusPill tone={readinessTone(data.summary.readinessScore)}>
                  {data.summary.readinessScore >= 80 ? "Healthy" : data.summary.readinessScore >= 55 ? "Review" : "Needs attention"}
                </StatusPill>
              </div>
              <ProgressBar value={data.summary.readinessScore} />
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Urgent metrics</p>
                  <p className="text-muted-foreground">{data.summary.dangerMetrics} metric area{data.summary.dangerMetrics === 1 ? "" : "s"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Watch metrics</p>
                  <p className="text-muted-foreground">{data.summary.watchMetrics} metric area{data.summary.watchMetrics === 1 ? "" : "s"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Missing metrics</p>
                  <p className="text-muted-foreground">{data.summary.missingMetrics} metric area{data.summary.missingMetrics === 1 ? "" : "s"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Open vital alerts</p>
                  <p className="text-muted-foreground">{data.summary.openVitalAlerts} alert{data.summary.openVitalAlerts === 1 ? "" : "s"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended vital actions</CardTitle>
              <CardDescription>Highest-value follow-ups based on urgent readings, freshness, device coverage, and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.actions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={getVitalPriorityTone(item.priority)}>{item.priority}</StatusPill>
                        <p className="font-medium">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
              {data.actions.length === 0 ? <EmptyState title="No vital actions" description="Vitals look stable and current enough for now. Keep adding readings to maintain a useful trend history." /> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metric cards</CardTitle>
            <CardDescription>Latest reading, previous reading, delta, capture time, and status for each vital area.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.metricCards.map((item) => <MetricCard key={item.key} item={item} />)}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>30-day averages</CardTitle>
              <CardDescription>Quick provider-friendly averages from recent vitals.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 p-3"><p className="font-medium">Blood pressure</p><p className="text-muted-foreground">{formatAverage(data.averages.systolic, "", 0)}/{formatAverage(data.averages.diastolic, " mmHg", 0)}</p></div>
              <div className="rounded-2xl border border-border/60 p-3"><p className="font-medium">Heart rate</p><p className="text-muted-foreground">{formatAverage(data.averages.heartRate, " bpm", 0)}</p></div>
              <div className="rounded-2xl border border-border/60 p-3"><p className="font-medium">Oxygen</p><p className="text-muted-foreground">{formatAverage(data.averages.oxygen, "% SpO2", 0)}</p></div>
              <div className="rounded-2xl border border-border/60 p-3"><p className="font-medium">Blood sugar</p><p className="text-muted-foreground">{formatAverage(data.averages.bloodSugar, " glucose", 1)}</p></div>
              <div className="rounded-2xl border border-border/60 p-3"><p className="font-medium">Temperature</p><p className="text-muted-foreground">{formatAverage(data.averages.temperature, " °C", 1)}</p></div>
              <div className="rounded-2xl border border-border/60 p-3"><p className="font-medium">Weight</p><p className="text-muted-foreground">{formatAverage(data.averages.weight, " kg", 1)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent vitals timeline</CardTitle>
              <CardDescription>Latest manual and device readings with status tone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.timeline.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={item.tone}>{item.label}</StatusPill>
                        <p className="font-medium">{item.detail}</p>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
                    </div>
                    <Badge>{item.source}</Badge>
                  </div>
                </div>
              ))}
              {data.timeline.length === 0 ? <EmptyState title="No vital readings yet" description="Add your first vital record to activate monitoring cards and review signals." /> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Device connection signal</CardTitle>
            <CardDescription>Current connected-device readiness for automatic vital collection.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.deviceConnections.map((connection) => (
              <div key={connection.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{connection.deviceLabel || connection.source}</p>
                  <StatusPill tone={connection.status === "ACTIVE" ? "success" : connection.status === "ERROR" ? "danger" : "warning"}>{connection.status}</StatusPill>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{connection.platform} • {connection.source}</p>
                <p className="mt-1 text-xs text-muted-foreground">Last sync: {formatDateTime(connection.lastSyncedAt)}</p>
                {connection.lastError ? <p className="mt-2 text-sm text-destructive">{connection.lastError}</p> : null}
              </div>
            ))}
            {data.deviceConnections.length === 0 ? <EmptyState title="No device connections" description="Connect a future mobile or device source to improve automatic vitals coverage." /> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
