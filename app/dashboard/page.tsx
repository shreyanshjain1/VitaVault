import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";

function formatDateTime(value: Date) {
  return new Date(value).toLocaleString();
}

function severityTone(severity: string) {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
  return "neutral";
}

function StatTile({
  label,
  value,
  description,
  icon,
  compact = false,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-[28px] border border-border/60 bg-background/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[140px] text-sm font-medium leading-5 text-muted-foreground">
          {label}
        </p>
        <div className="shrink-0 rounded-2xl border border-border/60 bg-background/80 p-2">
          {icon}
        </div>
      </div>

      <div className="mt-6 min-h-[72px]">
        {compact ? (
          <p className="max-w-full break-words text-[18px] font-semibold leading-[1.15] tracking-tight text-foreground">
            {value}
          </p>
        ) : (
          <p className="max-w-full break-words text-4xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const currentUser = await requireUser();
  const data = await getDashboardData(currentUser.id!);

  const nextMedication = data.nextMedication;
  const nextMedicationTime =
    nextMedication?.schedules?.[0]?.timeOfDay ?? "No schedules found";

  const recentVitals = data.vitals.slice(0, 4);
  const recentAppointments = data.appointments.slice(0, 4);
  const recentAlerts = data.openAlerts.slice(0, 4);
  const recentReminders = data.reminders.slice(0, 4);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your health records, adherence, reminders, and alerts."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/review-queue"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                Review Queue
              </Link>
              <Link
                href="/timeline"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm font-medium transition hover:bg-muted/50"
              >
                Timeline
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <Card className="overflow-hidden rounded-[32px] border-border/60 shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Command center
              </p>
              <CardTitle className="text-3xl leading-tight tracking-tight sm:text-4xl">
                Your personal health workspace
              </CardTitle>
              <CardDescription className="max-w-3xl text-[15px] leading-7">
                Monitor profile readiness, active alerts, upcoming reminders, and your next key health tasks from one place.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Profile completion"
                  value={`${data.profileCompletion}%`}
                  description="Fill more profile details for better summaries and alerts."
                  icon={<Sparkles className="h-5 w-5 text-primary" />}
                />

                <StatTile
                  label="Open alerts"
                  value={data.openAlerts.length}
                  description="Active alerts waiting for review."
                  icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
                />

                <StatTile
                  label="Upcoming reminders"
                  value={data.reminders.length}
                  description="Pending reminders from your health schedule."
                  icon={<CalendarClock className="h-5 w-5 text-sky-500" />}
                />

                <StatTile
                  label="Review queue"
                  value={data.reviewQueueSummary.total}
                  description="Overdue reminders, severe symptoms, and abnormal labs."
                  icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Quick navigation</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Jump into the most operational areas of VitaVault.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  href: "/review-queue",
                  label: "Review Queue",
                  description: "Work overdue reminders, severe symptoms, and abnormal labs.",
                },
                {
                  href: "/alerts",
                  label: "Alerts",
                  description: "Review open alert events and rule-driven triage.",
                },
                {
                  href: "/medications",
                  label: "Medications",
                  description: "Track plans, schedules, and adherence activity.",
                },
                {
                  href: "/timeline",
                  label: "Timeline",
                  description: "See the patient journey across modules in one feed.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start justify-between rounded-[26px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40"
                >
                  <div className="pr-3">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl tracking-tight">
                    Recent health alerts
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm leading-6">
                    The most recent active items requiring awareness or review.
                  </CardDescription>
                </div>
                <StatusPill tone={data.openAlerts.length > 0 ? "warning" : "success"}>
                  {data.openAlerts.length > 0 ? "Needs attention" : "Stable"}
                </StatusPill>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAlerts.length ? (
                recentAlerts.map((alert: (typeof recentAlerts)[number]) => (
                  <div
                    key={alert.id}
                    className="rounded-[26px] border border-border/60 bg-background/40 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                      <StatusPill tone={severityTone(alert.severity)}>
                        {alert.severity}
                      </StatusPill>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Rule: {alert.rule?.name ?? "System generated"}</span>
                      <span>•</span>
                      <span>Created: {formatDateTime(alert.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  No active alerts right now.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">Ops visibility</CardTitle>
                <CardDescription className="mt-1 text-sm leading-6">
                  Quick counts for what likely needs follow-up.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
                  <p className="text-sm text-muted-foreground">Overdue reminders</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.reviewQueueSummary.overdueReminders}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
                  <p className="text-sm text-muted-foreground">Missed reminders</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.reviewQueueSummary.missedReminders}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
                  <p className="text-sm text-muted-foreground">Severe symptoms</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.reviewQueueSummary.severeSymptoms}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/60 bg-background/40 p-4">
                  <p className="text-sm text-muted-foreground">Abnormal labs</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {data.reviewQueueSummary.abnormalLabs}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">Upcoming reminders</CardTitle>
                <CardDescription className="mt-1 text-sm leading-6">
                  Closest scheduled reminder items.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentReminders.length ? (
                  recentReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-[24px] border border-border/60 bg-background/40 p-4"
                    >
                      <p className="text-sm font-semibold">{reminder.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(reminder.dueAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                    No reminder items found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Recent vitals</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Latest health measurements from your record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentVitals.length ? (
                recentVitals.map((vital) => (
                  <div
                    key={vital.id}
                    className="rounded-[24px] border border-border/60 bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {new Date(vital.recordedAt).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          BP {vital.systolic ?? "-"} / {vital.diastolic ?? "-"} • Sugar{" "}
                          {vital.bloodSugar ?? "-"}
                        </p>
                      </div>
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No vitals recorded yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Upcoming visits</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Your next scheduled appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAppointments.length ? (
                recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-[24px] border border-border/60 bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{appointment.doctorName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(appointment.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <Stethoscope className="h-4 w-4 text-sky-500" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No upcoming appointments.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Medication focus</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Your currently highlighted medication plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextMedication ? (
                <div className="rounded-[24px] border border-border/60 bg-background/40 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{nextMedication.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {nextMedication.dosage} • {nextMedication.frequency}
                      </p>
                    </div>
                    <Pill className="h-5 w-5 text-emerald-500" />
                  </div>

                  <div className="mt-4 rounded-[20px] border border-border/60 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">Next scheduled time</p>
                    <p className="mt-2 text-xl font-semibold">{nextMedicationTime}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No active medication plans.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
