import Link from "next/link";
import { Sparkles, Users } from "lucide-react";

import { db } from "@/lib/db";
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

  const [data, latestInsight, ownedTeamCount, sharedWithMeCount, outgoingInviteCount] =
    await Promise.all([
      getDashboardData(user.id),
      db.aiInsight.findFirst({
        where: { ownerUserId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.careAccess.count({
        where: {
          ownerUserId: user.id,
          status: "ACTIVE",
        },
      }),
      db.careAccess.count({
        where: {
          memberUserId: user.id,
          status: "ACTIVE",
        },
      }),
      db.careInvite.count({
        where: {
          ownerUserId: user.id,
          status: "PENDING",
        },
      }),
    ]);

  const allRoutes = [...primaryRoutes.filter((item) => item.href !== "/dashboard"), ...utilityRoutes];

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[34px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Command Center
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Welcome back, {data.profile?.fullName ?? user.name ?? "there"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Your health records, care-team sharing, and AI summaries now live in one cleaner workspace. This dashboard surfaces what matters first instead of making you hunt through modules.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/ai-insights"
                  className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Open AI Insights
                </Link>
                <Link
                  href="/care-team"
                  className="inline-flex rounded-2xl border px-4 py-2.5 text-sm font-medium"
                >
                  Manage Care Team
                </Link>
                <Link
                  href="/summary"
                  className="inline-flex rounded-2xl border px-4 py-2.5 text-sm font-medium"
                >
                  Print Summary
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Profile completion</p>
                <p className="mt-2 text-3xl font-semibold">{data.profileCompletion}%</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Keep your core patient profile current.</p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Care team members</p>
                <p className="mt-2 text-3xl font-semibold">{ownedTeamCount}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Doctors and caregivers with active access.</p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Shared with me</p>
                <p className="mt-2 text-3xl font-semibold">{sharedWithMeCount}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Patient workspaces you can currently access.</p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending invites</p>
                <p className="mt-2 text-3xl font-semibold">{outgoingInviteCount}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Invites waiting for the recipient to accept.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-600 p-2 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">AI assistant</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  AI is now a visible part of the app instead of being hidden behind shared-patient pages.
                </p>
              </div>
            </div>

            {latestInsight ? (
              <div className="mt-5 rounded-3xl border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/50 dark:bg-violet-950/25">
                <p className="font-semibold">{latestInsight.title}</p>
                <p className="mt-2 text-sm leading-6">{latestInsight.summary}</p>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  Latest generated: {latestInsight.createdAt.toLocaleString()}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/ai-insights"
                    className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    Open AI Insights
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-zinc-200 p-5 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No AI summary generated yet. The feature is wired and ready — use the AI Insights page to create your first summary.
                </p>
                <div className="mt-4">
                  <Link
                    href="/ai-insights"
                    className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    Generate first insight
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-600 p-2 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">Care-team summary</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Invites now have a real shareable link, and accepted members can open shared patient workspaces directly.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Owned team</p>
                <p className="mt-2 text-2xl font-semibold">{ownedTeamCount}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Shared with me</p>
                <p className="mt-2 text-2xl font-semibold">{sharedWithMeCount}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending invites</p>
                <p className="mt-2 text-2xl font-semibold">{outgoingInviteCount}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/care-team"
                className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Open Care Team
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Modules</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              All major patient modules are reachable directly from this cleaner grid.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allRoutes.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-3xl border border-zinc-200/80 bg-zinc-50/70 p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
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
          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
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

          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
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

          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
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

          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Medication adherence</CardTitle>
            </CardHeader>
            <CardContent>
              <AdherenceChart data={data.adherenceTrend} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.reminders.length ? (
                data.reminders.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
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

          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Health alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.healthAlerts.length ? (
                data.healthAlerts.map((alert, i) => (
                  <div key={`${alert}-${i}`} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
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

          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.symptoms.length ? (
                data.symptoms.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
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
          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Upcoming appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.appointments.length ? (
                data.appointments.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
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

          <Card className="rounded-[28px] border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Latest lab results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.labs.length ? (
                data.labs.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
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