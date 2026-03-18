import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
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
                href="/alerts"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                Open Alerts
              </Link>
              <Link
                href="/device-connection"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm font-medium transition hover:bg-muted/50"
              >
                Device Connection
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
                  label="Next medication"
                  value={nextMedication ? nextMedication.name : "No active medication"}
                  description={
                    nextMedication
                      ? `Scheduled: ${nextMedicationTime}`
                      : "No schedules found"
                  }
                  icon={<Pill className="h-5 w-5 text-emerald-500" />}
                  compact
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
                  href: "/appointments",
                  label: "Appointments",
                  description: "Manage consultations and visit follow-ups.",
                },
                {
                  href: "/health-profile",
                  label: "Health Profile",
                  description: "Update baseline patient and emergency details.",
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
                recentAlerts.map((alert) => (
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

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Reminders</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Upcoming items from your care schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReminders.length ? (
                recentReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-[26px] border border-border/60 bg-background/40 p-4"
                  >
                    <p className="text-sm font-semibold">{reminder.title}</p>
                    {reminder.description ? (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {reminder.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDateTime(reminder.dueAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  No reminders scheduled.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
                <HeartPulse className="h-5 w-5" />
                Latest vitals
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Most recent recorded readings across your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentVitals.length ? (
                recentVitals.map((vital) => (
                  <div
                    key={vital.id}
                    className="rounded-[26px] border border-border/60 bg-background/40 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {formatDateTime(vital.recordedAt)}
                      </p>
                      <StatusPill tone="info">{vital.readingSource}</StatusPill>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>BP: {vital.systolic ?? "-"} / {vital.diastolic ?? "-"}</p>
                      <p>Heart rate: {vital.heartRate ?? "-"}</p>
                      <p>Blood sugar: {vital.bloodSugar ?? "-"}</p>
                      <p>Weight: {vital.weightKg ?? "-"}</p>
                      <p>Oxygen: {vital.oxygenSaturation ?? "-"}</p>
                      <p>Temp: {vital.temperatureC ?? "-"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  No vitals recorded yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
                <Stethoscope className="h-5 w-5" />
                Upcoming appointments
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Scheduled consultations and follow-ups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAppointments.length ? (
                recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-[26px] border border-border/60 bg-background/40 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{appointment.doctorName}</p>
                      <StatusPill tone="info">{appointment.status}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{appointment.clinic}</p>
                    {appointment.specialty ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Specialty: {appointment.specialty}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  No upcoming appointments.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}