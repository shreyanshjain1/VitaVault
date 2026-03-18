import Link from "next/link";
import { AlertTriangle, CalendarClock, HeartPulse, Pill, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const currentUser = await requireUser();
  const data = await getDashboardData(currentUser.id!);

  const nextMedication = data.nextMedication;
  const nextMedicationTime = nextMedication?.schedules?.[0]?.timeOfDay ?? "No schedules found";

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your health records, adherence, reminders, and alerts."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Profile completion</CardTitle>
              <Sparkles className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{data.profileCompletion}%</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill more profile details for better summaries and alerts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Open alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{data.openAlerts.length}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Active alerts waiting for review.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Upcoming reminders</CardTitle>
              <CalendarClock className="h-5 w-5 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{data.reminders.length}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Pending reminders from your health schedule.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Next medication</CardTitle>
              <Pill className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {nextMedication ? nextMedication.name : "No active medication"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextMedication ? `Scheduled: ${nextMedicationTime}` : "No schedules found"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent health alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.openAlerts.length ? (
                data.openAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-3xl border border-border/60 bg-background/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Rule: {alert.rule?.name ?? "System generated"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No active alerts right now.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.reminders.length ? (
                data.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-3xl border border-border/60 bg-background/40 p-4"
                  >
                    <p className="text-sm font-semibold">{reminder.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(reminder.dueAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5" />
                Latest vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.vitals.length ? (
                data.vitals.slice(0, 5).map((vital) => (
                  <div
                    key={vital.id}
                    className="rounded-3xl border border-border/60 bg-background/40 p-4"
                  >
                    <p className="text-sm font-semibold">
                      {new Date(vital.recordedAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      BP: {vital.systolic ?? "-"} / {vital.diastolic ?? "-"} | HR: {vital.heartRate ?? "-"} | Sugar: {vital.bloodSugar ?? "-"} | Weight: {vital.weightKg ?? "-"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.appointments.length ? (
                data.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-3xl border border-border/60 bg-background/40 p-4"
                  >
                    <p className="text-sm font-semibold">{appointment.doctorName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.clinic}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(appointment.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/alerts"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Open Alerts
          </Link>
          <Link
            href="/medications"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Open Medications
          </Link>
          <Link
            href="/device-connection"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Open Device Connection
          </Link>
        </div>
      </div>
    </AppShell>
  );
}