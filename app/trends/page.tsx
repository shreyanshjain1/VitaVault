import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Pill,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { getHealthTrendsData, type TrendDirection, type TrendTone, type VitalTrendMetric } from "@/lib/health-trends";
import { requireUser } from "@/lib/session";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function toneToPill(tone: TrendTone) {
  if (tone === "danger") return "danger" as const;
  if (tone === "warning") return "warning" as const;
  if (tone === "success") return "success" as const;
  if (tone === "info") return "info" as const;
  return "neutral" as const;
}

function directionLabel(direction: TrendDirection) {
  if (direction === "up") return "Up";
  if (direction === "down") return "Down";
  if (direction === "flat") return "Stable";
  return "New";
}

function directionIcon(direction: TrendDirection) {
  if (direction === "up") return <TrendingUp className="h-4 w-4" />;
  if (direction === "down") return <TrendingDown className="h-4 w-4" />;
  return <BarChart3 className="h-4 w-4" />;
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
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

function VitalMetricCard({ metric }: { metric: VitalTrendMetric }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="mt-2 text-2xl">
              {metric.latest === null ? "—" : `${metric.latest} ${metric.unit}`}
            </CardTitle>
          </div>
          <StatusPill tone={toneToPill(metric.tone)}>
            <span className="inline-flex items-center gap-1">
              {directionIcon(metric.direction)}
              {directionLabel(metric.direction)}
            </span>
          </StatusPill>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{metric.message}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
            <p>Previous</p>
            <p className="mt-1 font-medium text-foreground">{metric.previous === null ? "—" : metric.previous}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
            <p>Delta</p>
            <p className="mt-1 font-medium text-foreground">{metric.delta === null ? "—" : metric.delta > 0 ? `+${metric.delta}` : metric.delta}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TrendsPage() {
  const user = await requireUser();
  const data = await getHealthTrendsData(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Health Trends"
          description="A longitudinal trend workspace for vitals, labs, symptoms, medication adherence, and upcoming care signals. Built from existing VitaVault records with no extra setup required."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/vitals" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Add vitals</Link>
              <Link href="/labs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Review labs</Link>
              <Link href="/care-plan" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Care plan</Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Trend coverage" value={`${data.summary.dataCoverageScore}%`} description="Coverage across vitals, labs, symptoms, medication logs, and appointments." icon={<BarChart3 className="h-5 w-5 text-primary" />} />
          <StatCard title="Risk score" value={`${data.summary.riskScore}%`} description="Weighted signal from abnormal labs, unresolved symptoms, missed meds, and vital warnings." icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Medication adherence" value={`${data.summary.adherenceRate}%`} description={`${data.medications.takenLogs} taken, ${data.medications.missedLogs} missed, ${data.medications.skippedLogs} skipped in 30 days.`} icon={<Pill className="h-5 w-5 text-emerald-500" />} />
          <StatCard title="Upcoming visits" value={data.summary.upcomingAppointments} description="Upcoming appointments connected to the current care window." icon={<CalendarClock className="h-5 w-5 text-sky-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Trend readiness</CardTitle>
              <CardDescription>How much recent data VitaVault has for meaningful trend review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">{data.summary.dataCoverageScore}%</p>
                  <p className="text-sm text-muted-foreground">Based on 90-day records and 30-day medication logs.</p>
                </div>
                <StatusPill tone={data.summary.dataCoverageScore >= 75 ? "success" : data.summary.dataCoverageScore >= 45 ? "warning" : "danger"}>
                  {data.summary.dataCoverageScore >= 75 ? "Strong baseline" : data.summary.dataCoverageScore >= 45 ? "Partial baseline" : "Needs records"}
                </StatusPill>
              </div>
              <ProgressBar value={data.summary.dataCoverageScore} />
              <div className="grid gap-3 md:grid-cols-5">
                <Badge>{data.summary.vitalReadings} vitals</Badge>
                <Badge>{data.summary.labResults} labs</Badge>
                <Badge>{data.summary.symptoms} symptoms</Badge>
                <Badge>{data.summary.medicationLogs} med logs</Badge>
                <Badge>{data.summary.upcomingAppointments} visits</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended review notes</CardTitle>
              <CardDescription>Priority interpretation from the latest health data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.insights.map((insight) => (
                <div key={insight.title} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={toneToPill(insight.tone)}>{insight.tone}</StatusPill>
                    <p className="font-medium">{insight.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{insight.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.vitalMetrics.map((metric) => <VitalMetricCard key={metric.key} metric={metric} />)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>30-day vital averages</CardTitle>
              <CardDescription>Recent average values from manual and device-linked readings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4"><p className="text-sm text-muted-foreground">Blood pressure</p><p className="mt-1 text-xl font-semibold">{data.vitalAverages.systolic ?? "—"}/{data.vitalAverages.diastolic ?? "—"}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4"><p className="text-sm text-muted-foreground">Heart rate</p><p className="mt-1 text-xl font-semibold">{data.vitalAverages.heartRate ?? "—"} bpm</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4"><p className="text-sm text-muted-foreground">Oxygen</p><p className="mt-1 text-xl font-semibold">{data.vitalAverages.oxygenSaturation ?? "—"}%</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4"><p className="text-sm text-muted-foreground">Blood sugar</p><p className="mt-1 text-xl font-semibold">{data.vitalAverages.bloodSugar ?? "—"}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4"><p className="text-sm text-muted-foreground">Temperature</p><p className="mt-1 text-xl font-semibold">{data.vitalAverages.temperatureC ?? "—"}°C</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4"><p className="text-sm text-muted-foreground">Weight</p><p className="mt-1 text-xl font-semibold">{data.vitalAverages.weightKg ?? "—"} kg</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lab flag breakdown</CardTitle>
              <CardDescription>Latest 90-day lab posture by result flag.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Normal</p><p className="text-2xl font-semibold">{data.labs.normalCount}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Borderline</p><p className="text-2xl font-semibold">{data.labs.borderlineCount}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">High</p><p className="text-2xl font-semibold">{data.labs.highCount}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Low</p><p className="text-2xl font-semibold">{data.labs.lowCount}</p></div>
              </div>
              <div className="space-y-3">
                {data.labs.abnormal.map((lab) => (
                  <div key={lab.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="warning">{lab.flag}</StatusPill>
                      <p className="font-medium">{lab.testName}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{lab.resultSummary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(lab.dateTaken)}{lab.referenceRange ? ` • Ref: ${lab.referenceRange}` : ""}</p>
                  </div>
                ))}
                {data.labs.abnormal.length === 0 ? <EmptyState title="No abnormal labs in window" description="Flagged lab results will appear here for quick review." /> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Symptom signal</CardTitle>
              <CardDescription>Severity mix and unresolved symptoms from the last 90 days.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Mild</p><p className="text-2xl font-semibold">{data.symptoms.mildCount}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Moderate</p><p className="text-2xl font-semibold">{data.symptoms.moderateCount}</p></div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3"><p className="text-xs text-muted-foreground">Severe</p><p className="text-2xl font-semibold">{data.symptoms.severeCount}</p></div>
              </div>
              <div className="space-y-3">
                {data.symptoms.unresolved.map((symptom) => (
                  <div key={symptom.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={symptom.severity === "SEVERE" ? "danger" : "warning"}>{symptom.severity}</StatusPill>
                      <p className="font-medium">{symptom.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{symptom.bodyArea || "No body area"} • {formatDateTime(symptom.startedAt)}</p>
                  </div>
                ))}
                {data.symptoms.unresolved.length === 0 ? <EmptyState title="No unresolved symptoms" description="Open symptom entries will appear here." /> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medication log signal</CardTitle>
              <CardDescription>30-day logged adherence and latest medication actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">{data.medications.adherenceRate}%</p>
                  <p className="text-sm text-muted-foreground">{data.medications.takenLogs} taken • {data.medications.missedLogs} missed • {data.medications.skippedLogs} skipped</p>
                </div>
                <StatusPill tone={data.medications.adherenceRate >= 90 ? "success" : data.medications.adherenceRate >= 75 ? "warning" : "danger"}>30-day adherence</StatusPill>
              </div>
              <ProgressBar value={data.medications.adherenceRate} />
              <div className="space-y-3">
                {data.medications.logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                    <div>
                      <p className="font-medium">{log.medication.name}</p>
                      <p className="text-xs text-muted-foreground">{log.medication.dosage} • {log.scheduleTime || "unscheduled"} • {formatDateTime(log.loggedAt)}</p>
                    </div>
                    <StatusPill tone={log.status === "TAKEN" ? "success" : log.status === "MISSED" ? "danger" : "warning"}>{log.status}</StatusPill>
                  </div>
                ))}
                {data.medications.logs.length === 0 ? <EmptyState title="No medication logs" description="Log medication actions to calculate adherence trends." /> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent health timeline</CardTitle>
            <CardDescription>Latest vitals, labs, and symptoms merged into one trend review stream.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Type</TH>
                    <TH>Title</TH>
                    <TH>Detail</TH>
                    <TH>When</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.recentTimeline.map((item) => (
                    <TR key={item.id}>
                      <TD>{item.type}</TD>
                      <TD>{item.title}</TD>
                      <TD>{item.detail}</TD>
                      <TD>{formatDateTime(item.at)}</TD>
                      <TD><StatusPill tone={toneToPill(item.tone)}>{item.tone}</StatusPill></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            {data.recentTimeline.length === 0 ? <EmptyState title="No trend timeline yet" description="Vitals, labs, and symptoms will appear here once records are added." /> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
