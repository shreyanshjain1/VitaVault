import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UsersRound,
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
import { getDashboardData } from "@/lib/dashboard-data";
import { requireUser } from "@/lib/session";

function formatDateTime(value: Date) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function completionTone(value: number) {
  if (value >= 85) return "success";
  if (value >= 60) return "info";
  return "warning";
}

function StatTile({
  label,
  value,
  description,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[190px] flex-col justify-between rounded-[28px] border border-border/60 bg-background/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[150px] text-sm font-medium leading-5 text-muted-foreground">
          {label}
        </p>
        <div className="shrink-0 rounded-2xl border border-border/60 bg-background/80 p-2 transition group-hover:scale-105">
          {icon}
        </div>
      </div>

      <div>
        <p className="text-4xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-border/60 bg-background/40 p-5 text-sm leading-6 text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const currentUser = await requireUser();
  const data = await getDashboardData(currentUser.id!);

  const nextMedication = data.nextMedication;
  const nextMedicationTime =
    nextMedication?.schedules?.[0]?.timeOfDay ?? "No schedule added yet";
  const recentVitals = data.vitals.slice(0, 3);
  const recentAppointments = data.appointments.slice(0, 3);
  const activeAttentionCount = data.needsAttention.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Dashboard"
          description="A command center for readiness, reminders, alerts, recent records, and care workflows."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/review-queue"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                <ClipboardList className="h-4 w-4" />
                Review Queue
              </Link>
              <Link
                href="/summary/print"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm font-medium transition hover:bg-muted/50"
              >
                <FileText className="h-4 w-4" />
                Print Summary
              </Link>
            </div>
          }
        />

        <Card className="overflow-hidden rounded-[34px] border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-6 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone={completionTone(data.profileCompletion)}>
                    {data.readinessLevel}
                  </StatusPill>
                  <StatusPill tone={activeAttentionCount > 0 ? "warning" : "success"}>
                    {activeAttentionCount > 0
                      ? `${activeAttentionCount} attention item${activeAttentionCount === 1 ? "" : "s"}`
                      : "No active attention items"}
                  </StatusPill>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Health command center
                  </p>
                  <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                    Turn scattered health records into a clear next-action workspace.
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    VitaVault now surfaces profile readiness, care tasks, operational risk, recent records, and quick actions without needing to open every module one by one.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
                    label="Profile completion"
                    value={`${data.profileCompletion}%`}
                    description="Baseline health data and care-readiness coverage."
                    href="/health-profile"
                    icon={<Sparkles className="h-5 w-5 text-primary" />}
                  />
                  <StatTile
                    label="Open alerts"
                    value={data.openAlerts.length}
                    description="Rule-driven alerts still waiting for review."
                    href="/alerts"
                    icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
                  />
                  <StatTile
                    label="Upcoming care tasks"
                    value={data.careTimeline.length}
                    description="Reminders and visits due across the next care window."
                    href="/reminders"
                    icon={<CalendarClock className="h-5 w-5 text-sky-500" />}
                  />
                  <StatTile
                    label="Review queue"
                    value={data.reviewQueueSummary.total}
                    description="Overdue, missed, abnormal, or severe follow-up items."
                    href="/review-queue"
                    icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
                  />
                </div>
              </div>

              <div className="border-t border-border/60 bg-muted/20 p-6 sm:p-8 xl:border-l xl:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Readiness checklist</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Complete these areas to make records, alerts, and emergency summaries more useful.
                    </p>
                  </div>
                  <StatusPill tone={completionTone(data.profileCompletion)}>
                    {data.profileCompletion}%
                  </StatusPill>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-background/80">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${data.profileCompletion}%` }}
                  />
                </div>

                <div className="mt-6 space-y-3">
                  {data.profileChecklist.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-[22px] border border-border/60 bg-background/60 p-3 transition hover:bg-muted/40"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {item.complete ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-sm font-medium">{item.label}</span>
                      </span>
                      <StatusPill tone={item.complete ? "success" : "neutral"}>
                        {item.complete ? "Done" : "Open"}
                      </StatusPill>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl tracking-tight">Needs attention</CardTitle>
                  <CardDescription className="mt-1 text-sm leading-6">
                    The highest-priority items from alerts, reminders, labs, symptoms, and profile readiness.
                  </CardDescription>
                </div>
                <StatusPill tone={data.needsAttention.length > 0 ? "warning" : "success"}>
                  {data.needsAttention.length > 0 ? "Actionable" : "Stable"}
                </StatusPill>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.needsAttention.length ? (
                data.needsAttention.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="group block rounded-[26px] border border-border/60 bg-background/40 p-5 transition hover:bg-muted/35"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                      <StatusPill tone={item.tone}>{item.detail}</StatusPill>
                    </div>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Open workflow <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyPanel
                  title="No urgent follow-up right now."
                  description="Alerts, abnormal labs, severe symptoms, and overdue reminders will appear here when they need review."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Quick actions</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Fast entry points for the workflows users need most often.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {data.quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start justify-between rounded-[24px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40"
                >
                  <span className="pr-3">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Upcoming care timeline</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Reminders and visits sorted by next due date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.careTimeline.length ? (
                data.careTimeline.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex gap-4 rounded-[24px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40"
                  >
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-2xl border border-border/60 bg-background/80 p-2">
                      {item.type === "Visit" ? (
                        <Stethoscope className="h-full w-full text-sky-500" />
                      ) : (
                        <CalendarClock className="h-full w-full text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <StatusPill tone={item.tone}>{item.type}</StatusPill>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                      <p className="mt-2 text-xs font-medium text-foreground/80">
                        {formatDateTime(item.at)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyPanel
                  title="No upcoming care tasks."
                  description="Create reminders or appointments to build a forward-looking care plan."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Recent activity feed</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                A single feed combining medications, vitals, labs, symptoms, documents, and AI insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentActivity.length ? (
                data.recentActivity.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="grid gap-3 rounded-[24px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40 sm:grid-cols-[120px_1fr]"
                  >
                    <div>
                      <StatusPill tone="neutral">{item.type}</StatusPill>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyPanel
                  title="No recent activity yet."
                  description="New logs, uploads, readings, and generated insights will appear here."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Data freshness</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Quick visibility into which record areas are current or stale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.dataFreshness.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40"
                >
                  <span className="text-sm font-semibold">{item.label}</span>
                  <StatusPill tone={item.tone}>{item.value}</StatusPill>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Recent vitals</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Latest measurements from the health record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentVitals.length ? (
                recentVitals.map((vital) => (
                  <Link
                    key={vital.id}
                    href="/vitals"
                    className="flex items-start justify-between gap-3 rounded-[24px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {new Date(vital.recordedAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        BP {vital.systolic ?? "—"} / {vital.diastolic ?? "—"} • Sugar {vital.bloodSugar ?? "—"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        HR {vital.heartRate ?? "—"} • O₂ {vital.oxygenSaturation ?? "—"}
                      </p>
                    </div>
                    <HeartPulse className="h-4 w-4 text-rose-500" />
                  </Link>
                ))
              ) : (
                <EmptyPanel
                  title="No vitals recorded yet."
                  description="Start with blood pressure, heart rate, blood sugar, oxygen, or weight."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Medication focus</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Highlighted active medication plan and next schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextMedication ? (
                <Link
                  href="/medications"
                  className="block rounded-[24px] border border-border/60 bg-background/40 p-5 transition hover:bg-muted/40"
                >
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
                </Link>
              ) : (
                <EmptyPanel
                  title="No active medication plans."
                  description="Add medication plans to make adherence tracking and reminders useful."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[32px] border-border/60 shadow-sm xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Upcoming visits</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Scheduled visits visible from the command center.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {recentAppointments.length ? (
                recentAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href="/appointments"
                    className="rounded-[24px] border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{appointment.doctorName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{appointment.purpose}</p>
                      </div>
                      <Stethoscope className="h-4 w-4 text-sky-500" />
                    </div>
                    <p className="mt-3 text-xs font-medium text-foreground/80">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-3">
                  <EmptyPanel
                    title="No upcoming appointments."
                    description="Add upcoming visits to build a more useful care timeline."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Workspace coverage</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Snapshot of the strongest product areas currently feeding this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { icon: Activity, label: "Clinical records", value: data.vitals.length + data.labs.length + data.symptoms.length },
                { icon: UploadCloud, label: "Documents", value: data.dataFreshness.find((item) => item.key === "documents")?.value ?? "No data" },
                { icon: UsersRound, label: "Care workflows", value: data.profileChecklist.find((item) => item.key === "care-network")?.complete ? "Configured" : "Not started" },
                { icon: ShieldCheck, label: "Risk posture", value: data.reviewQueueSummary.total > 0 ? "Needs review" : "Clear" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-border/60 bg-background/40 p-4"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-2xl border border-border/60 bg-background/80 p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </span>
                    <span className="text-right text-sm text-muted-foreground">{item.value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
