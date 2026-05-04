import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Pill, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getMedicationSafetyData, type MedicationSafetyTone } from "@/lib/medication-safety";
import { formatDate, formatDateTime } from "@/lib/utils";

function toneFromScore(value: number): MedicationSafetyTone {
  if (value >= 85) return "success";
  if (value >= 65) return "warning";
  return "danger";
}

function priorityTone(priority: string): MedicationSafetyTone {
  if (priority === "Critical" || priority === "High") return "danger";
  if (priority === "Medium") return "warning";
  return "info";
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function MetricCard({ title, value, description, icon }: { title: string; value: string | number; description: string; icon: React.ReactNode }) {
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

export default async function MedicationSafetyPage() {
  const user = await requireUser();
  const data = await getMedicationSafetyData(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Medication Safety"
          description="Review active medications, today&apos;s dose coverage, adherence signals, safety gaps, and refill/follow-up risk from one medication-focused workspace."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/medications" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Manage medications</Link>
              <Link href="/reminders" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Reminders</Link>
              <Link href="/alerts" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Alerts</Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Safety readiness" value={`${data.summary.readinessScore}%`} description="Medication setup quality across schedules, logs, alerts, and expired active records." icon={<ShieldCheck className="h-5 w-5 text-primary" />} />
          <MetricCard title="Active meds" value={data.summary.activeMedications} description="Medication records currently marked active." icon={<Pill className="h-5 w-5 text-violet-500" />} />
          <MetricCard title="Today&apos;s completion" value={`${data.summary.todayCompletionRate}%`} description={`${data.summary.todayTaken} taken, ${data.summary.todayMissedOrSkipped} missed/skipped, ${data.summary.todayUnlogged} unlogged.`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} />
          <MetricCard title="30-day adherence" value={`${data.summary.adherenceRate}%`} description={`${data.summary.missedRate}% of logged doses were missed or skipped.`} icon={<CalendarClock className="h-5 w-5 text-sky-500" />} />
          <MetricCard title="Open med alerts" value={data.summary.openMedicationAlerts} description={`${data.summary.highSeverityMedicationAlerts} high-risk medication alert(s) currently open.`} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Medication readiness checklist</CardTitle>
              <CardDescription>Quick review of the records needed for safe tracking and care handoff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Readiness score</span>
                  <StatusPill tone={toneFromScore(data.summary.readinessScore)}>{data.summary.readinessScore}%</StatusPill>
                </div>
                <ProgressBar value={data.summary.readinessScore} />
              </div>
              <div className="space-y-3">
                {data.readinessChecks.map((check) => (
                  <div key={check.label} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                    <div>
                      <p className="font-medium">{check.label}</p>
                      <p className="text-sm text-muted-foreground">{check.detail}</p>
                    </div>
                    <StatusPill tone={check.complete ? "success" : "warning"}>{check.complete ? "Ready" : "Review"}</StatusPill>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety action queue</CardTitle>
              <CardDescription>Prioritized issues that can improve medication safety and reporting quality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.safetyItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={priorityTone(item.priority)}>{item.priority}</StatusPill>
                    <StatusPill tone={item.tone}>{item.tone === "danger" ? "Risk" : item.tone === "warning" ? "Needs setup" : item.tone === "info" ? "Upcoming" : "Context"}</StatusPill>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-sm text-foreground/80">Next step: {item.action}</p>
                  </div>
                </div>
              ))}
              {data.safetyItems.length === 0 ? <EmptyState title="No medication safety gaps" description="Your active medication records do not have urgent setup or adherence gaps right now." /> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s dose board</CardTitle>
            <CardDescription>Schedule-level view for active medication doses due today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.todayDoseRows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.medicationName}</p>
                      <p className="text-sm text-muted-foreground">{row.dosage} • {row.scheduleTime}</p>
                    </div>
                    <StatusPill tone={row.tone}>{row.status}</StatusPill>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>Provider: {row.doctorName}</p>
                    <p>Logged: {row.loggedAt ? formatDateTime(row.loggedAt) : "Not logged today"}</p>
                  </div>
                </div>
              ))}
              {data.todayDoseRows.length === 0 ? <EmptyState title="No scheduled doses" description="Add schedule times to active medications to populate today&apos;s dose board." /> : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Medication adherence cards</CardTitle>
              <CardDescription>Thirty-day adherence signal per active medication.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {data.medicationCards.map((medication) => (
                <div key={medication.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{medication.name}</p>
                      <p className="text-sm text-muted-foreground">{medication.dosage} • {medication.frequency}</p>
                    </div>
                    <StatusPill tone={medication.tone}>{medication.logged > 0 ? `${medication.adherence}%` : "No logs"}</StatusPill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{medication.scheduleCount} schedule(s)</Badge>
                    <Badge>{medication.taken} taken</Badge>
                    <Badge>{medication.missed} missed</Badge>
                    <Badge>{medication.skipped} skipped</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>Provider: {medication.doctorName ?? "No linked doctor"}</p>
                    {medication.endDate ? <p>End date: {formatDate(medication.endDate)} {medication.daysUntilEnd !== null ? `(${medication.daysUntilEnd} day(s))` : ""}</p> : <p>No end date set</p>}
                    {medication.instructions ? <p>Instructions: {medication.instructions}</p> : null}
                  </div>
                </div>
              ))}
              {data.medicationCards.length === 0 ? <EmptyState title="No active medication cards" description="Active medications will appear here once added." /> : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Medication reminders</CardTitle>
                <CardDescription>Due, overdue, or missed medication reminders in the next 30 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.medicationReminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">{reminder.description ?? "Medication reminder"}</p>
                      </div>
                      <StatusPill tone={reminder.state === "OVERDUE" || reminder.state === "MISSED" ? "danger" : "warning"}>{reminder.state}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Due: {formatDateTime(reminder.dueAt)}</p>
                  </div>
                ))}
                {data.medicationReminders.length === 0 ? <EmptyState title="No medication reminders" description="Medication reminders due soon will appear here." /> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open medication alerts</CardTitle>
                <CardDescription>Adherence and medication-log alerts requiring review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.openMedicationAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      <StatusPill tone={alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "danger" : "warning"}>{alert.severity}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Opened: {formatDateTime(alert.createdAt)}</p>
                  </div>
                ))}
                {data.openMedicationAlerts.length === 0 ? <EmptyState title="No open medication alerts" description="Medication adherence alerts will appear here when monitoring rules create them." /> : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Generated {formatDateTime(data.generatedAt)}. This page summarizes tracking quality and workflow signals only. It does not replace professional medical advice.</p>
      </div>
    </AppShell>
  );
}
