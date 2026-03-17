import Link from "next/link";
import { Sparkles, Users, ArrowUpRight, BellRing } from "lucide-react";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";
import { AreaTrendChart, AdherenceChart, TrendChart } from "@/components/charts";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";
import { primaryRoutes, utilityRoutes } from "@/lib/app-routes";

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-muted/60">
      <div
        className="h-2 rounded-full bg-primary"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [data, latestInsight, ownedTeamCount, sharedWithMeCount, outgoingInviteCount] =
    await Promise.all([
      getDashboardData(user.id),
      db.aiInsight.findFirst({
        where: { ownerUserId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.careAccess.count({
        where: { ownerUserId: user.id, status: "ACTIVE" },
      }),
      db.careAccess.count({
        where: { memberUserId: user.id, status: "ACTIVE" },
      }),
      db.careInvite.count({
        where: { ownerUserId: user.id, status: "PENDING" },
      }),
    ]);

  const allRoutes = [
    ...primaryRoutes.filter((item) => item.href !== "/dashboard"),
    ...utilityRoutes,
  ];

  const nextAppt = data.appointments?.[0] ?? null;
  const nextMedication = data.nextMedication ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Command Center hero */}
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-3">
            <div className="p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-background/70">Command Center</Badge>
                <Badge className="bg-background/70">Secure workspace</Badge>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Welcome back, {data.profile?.fullName ?? user.name ?? "there"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                VitaVault surfaces what matters first—records, reminders, care-team sharing, and AI summaries—without making you hunt through modules.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/ai-insights"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Open AI Insights
                </Link>
                <Link
                  href="/care-team"
                  className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Care Team
                </Link>
                <Link
                  href="/summary"
                  className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  Print Summary
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Profile completion
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{data.profileCompletion}%</p>
                  <div className="mt-3">
                    <ProgressBar value={data.profileCompletion} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep your core profile current for better insights and sharing clarity.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Next dose
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {nextMedication ? nextMedication.name : "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nextMedication ? `Scheduled: ${nextMedication.time}` : "No schedules found"}
                  </p>
                  <Link
                    href="/medications"
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary"
                  >
                    Review medications <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Next appointment
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {nextAppt ? nextAppt.purpose : "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nextAppt ? formatDateTime(nextAppt.scheduledAt) : "No upcoming appointments"}
                  </p>
                  <Link
                    href="/appointments"
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary"
                  >
                    View appointments <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 bg-background/40 p-6 lg:border-l lg:border-t-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Flagship modules
                  </p>
                  <p className="mt-1 text-lg font-semibold">AI + Care Team</p>
                </div>
                <Badge className="bg-background/70">
                  <BellRing className="mr-1 h-3.5 w-3.5" />
                  Ready for Phase 2
                </Badge>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border border-border/60 bg-background/50 p-5">
                  <p className="text-sm font-semibold">AI brief</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {latestInsight
                      ? latestInsight.summary
                      : "No AI summary yet. Generate an insight to create a concise brief from your stored records."}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {latestInsight
                      ? `Latest generated: ${latestInsight.createdAt.toLocaleString()}`
                      : "AI is wired and ready."}
                  </p>
                  <Link
                    href="/ai-insights"
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary"
                  >
                    Open AI Insights <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/50 p-5">
                  <p className="text-sm font-semibold">Care-team snapshot</p>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Owned</p>
                      <p className="mt-1 text-lg font-semibold">{ownedTeamCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Shared</p>
                      <p className="mt-1 text-lg font-semibold">{sharedWithMeCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Invites</p>
                      <p className="mt-1 text-lg font-semibold">{outgoingInviteCount}</p>
                    </div>
                  </div>
                  <Link
                    href="/care-team"
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary"
                  >
                    Open Care Team <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Trends */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Blood pressure trend</CardTitle>
              <CardDescription className="mt-1">
                Recent systolic/diastolic entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              <TrendChart
                data={data.bloodPressureTrend}
                lines={[
                  { key: "systolic", name: "Systolic" },
                  { key: "diastolic", name: "Diastolic" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weight</CardTitle>
                <CardDescription className="mt-1">Recent entries.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <AreaTrendChart data={data.weightTrend} keyName="weight" name="Weight (kg)" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blood sugar</CardTitle>
                <CardDescription className="mt-1">Recent entries.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <AreaTrendChart data={data.sugarTrend} keyName="sugar" name="Blood sugar" />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medication adherence</CardTitle>
            <CardDescription className="mt-1">
              Taken vs missed over the last week.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <AdherenceChart data={data.adherenceTrend} />
          </CardContent>
        </Card>

        {/* Work queue */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription className="mt-1">What’s due next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.reminders.length ? (
                data.reminders.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description ?? "—"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="bg-background/70">
                        {item.type.replaceAll("_", " ")}
                      </Badge>
                      <Badge className="bg-background/70">{formatDateTime(item.dueAt)}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No upcoming reminders.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Health alerts</CardTitle>
              <CardDescription className="mt-1">
                Informational flags from your data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.healthAlerts.length ? (
                data.healthAlerts.map((alert, i) => (
                  <div key={i} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                    <p className="text-sm font-semibold">{`Alert ${i + 1}`}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{alert}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No active alerts. Great job staying on track.
                </div>
              )}
              <Link
                href="/alerts"
                className="inline-flex items-center text-sm font-medium text-primary"
              >
                Open Alert Center <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription className="mt-1">
                Symptoms and new events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.symptoms.length ? (
                data.symptoms.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes ?? "No notes"}</p>
                    <Badge className="mt-3 bg-background/70">{formatDateTime(item.startedAt)}</Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No recent symptom activity.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription className="mt-1">
              Jump into any record module from a cleaner grid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allRoutes.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-3xl border border-border/60 bg-background/40 p-5 transition hover:bg-background/60 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        <p className="mt-3 text-xs font-medium text-primary">
                          {item.href} <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card className="bg-background/40">
                <CardHeader>
                  <CardTitle>Upcoming appointments</CardTitle>
                  <CardDescription className="mt-1">Next 5.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.appointments.length ? (
                    data.appointments.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                        <p className="text-sm font-semibold">{item.purpose}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.doctorName} • {item.clinic}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge className="bg-background/70">{item.status}</Badge>
                          <Badge className="bg-background/70">{formatDateTime(item.scheduledAt)}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                      No appointments available.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-background/40">
                <CardHeader>
                  <CardTitle>Latest lab results</CardTitle>
                  <CardDescription className="mt-1">Most recent 5.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.labs.length ? (
                    data.labs.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                        <p className="text-sm font-semibold">{item.testName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.resultSummary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge className="bg-background/70">{item.flag}</Badge>
                          <Badge className="bg-background/70">{formatDate(item.dateTaken)}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                      No lab results available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}