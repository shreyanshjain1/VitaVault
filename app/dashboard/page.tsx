import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";
import { AreaTrendChart, AdherenceChart, TrendChart } from "@/components/charts";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";
import { primaryRoutes, utilityRoutes } from "@/lib/app-routes";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  const topRoutes = primaryRoutes.filter((item) => item.href !== "/dashboard");
  const allRoutes = [...topRoutes, ...utilityRoutes];

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-3xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Overview
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Welcome back, {data.profile?.fullName ?? user.name ?? "there"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                Stay on top of medications, labs, symptoms, appointments, care-team access,
                and AI insights in one premium workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/care-team"
                className="inline-flex rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Open Care Team
              </Link>
              <Link
                href="/summary"
                className="inline-flex rounded-2xl border px-4 py-2 text-sm font-medium"
              >
                Print Summary
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Profile completion</CardDescription>
              <CardTitle>{data.profileCompletion}%</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Next medication</CardDescription>
              <CardTitle className="text-lg">
                {data.nextMedication?.name ?? "No active medication"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {data.nextMedication?.time ?? "—"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Upcoming appointment</CardDescription>
              <CardTitle className="text-lg">
                {data.appointments[0]?.doctorName ?? "No upcoming visit"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {formatDateTime(data.appointments[0]?.scheduledAt)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Latest lab</CardDescription>
              <CardTitle className="text-lg">
                {data.labs[0]?.testName ?? "No lab yet"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {data.labs[0]?.resultSummary ?? "—"}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Routes and workspaces</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Every major page is reachable directly from here for faster navigation.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allRoutes.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border p-3 dark:border-zinc-800">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {item.href}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Blood pressure trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={data.bloodPressureTrend}
                lines={[
                  { key: "systolic", name: "Systolic" },
                  { key: "diastolic", name: "Diastolic" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight trend</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaTrendChart
                data={data.weightTrend}
                keyName="weight"
                name="Weight (kg)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blood sugar trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={data.sugarTrend}
                lines={[{ key: "sugar", name: "Blood Sugar" }]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medication adherence</CardTitle>
            </CardHeader>
            <CardContent>
              <AdherenceChart data={data.adherenceTrend} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.reminders.length ? (
                data.reminders.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {item.type.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                    <p className="mt-2 text-sm">{formatDateTime(item.dueAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No upcoming reminders.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.healthAlerts.length ? (
                data.healthAlerts.map((alert, i) => (
                  <div key={`${alert}-${i}`} className="rounded-2xl border p-4">
                    <Badge>{`Alert ${i + 1}`}</Badge>
                    <p className="mt-3 text-sm">{alert}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No active alerts. Great job staying on track.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.symptoms.length ? (
                data.symptoms.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.notes ?? "No notes"}
                    </p>
                    <p className="mt-2 text-sm">{formatDateTime(item.startedAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No recent symptom activity.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.appointments.length ? (
                data.appointments.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.purpose}</p>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {item.doctorName} • {item.clinic}
                        </p>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm">{formatDateTime(item.scheduledAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No appointments available.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest lab results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.labs.length ? (
                data.labs.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.testName}</p>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {item.resultSummary}
                        </p>
                      </div>
                      <Badge>{item.flag}</Badge>
                    </div>
                    <p className="mt-3 text-sm">{formatDate(item.dateTaken)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No lab results available.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}