import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileHeart,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getCarePlanHubData, type CarePlanPriority, type CarePlanTone } from "@/lib/care-plan";
import { requireUser } from "@/lib/session";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function priorityLabel(priority: CarePlanPriority) {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function toneToPill(tone: CarePlanTone) {
  if (tone === "danger") return "danger" as const;
  if (tone === "warning") return "warning" as const;
  if (tone === "success") return "success" as const;
  if (tone === "info") return "info" as const;
  return "neutral" as const;
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function StatCard({ title, value, description, icon }: { title: string; value: string | number; description: string; icon: ReactNode }) {
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

export default async function CarePlanPage() {
  const user = await requireUser();
  const data = await getCarePlanHubData(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Care Plan Hub"
          description="A practical action plan that turns your records, alerts, reminders, appointments, labs, documents, and care-team context into one prioritized next-step view."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/summary" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                Patient summary
              </Link>
              <Link href="/notifications" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                Notifications
              </Link>
            </div>
          }
        />

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={toneToPill(data.readinessTone)}>
                    {data.overallScore >= 85 ? "Visit ready" : data.overallScore >= 60 ? "Needs polish" : "Needs setup"}
                  </StatusPill>
                  <Badge>Care-plan score: {data.overallScore}%</Badge>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Your next best care actions</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    VitaVault prioritizes urgent health signals first, then highlights missing handoff details that make your doctor visits, emergency card, and caregiver sharing more useful.
                  </p>
                </div>
                <ProgressBar value={data.overallScore} />
              </div>
              <div className="border-t border-border/60 bg-muted/20 p-6 lg:border-l lg:border-t-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critical</p>
                    <p className="mt-2 text-2xl font-semibold">{data.stats.criticalCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">High priority</p>
                    <p className="mt-2 text-2xl font-semibold">{data.stats.highCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open alerts</p>
                    <p className="mt-2 text-2xl font-semibold">{data.stats.openAlerts}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Upcoming visits</p>
                    <p className="mt-2 text-2xl font-semibold">{data.stats.upcomingAppointments}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Active medications" value={data.stats.activeMedications} description="Medication context available for doctor handoff." icon={<Pill className="h-5 w-5 text-primary" />} />
          <StatCard title="Abnormal labs" value={data.stats.abnormalLabs} description="Lab results that may need review or follow-up." icon={<ClipboardCheck className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Care members" value={data.stats.activeCareMembers} description="Active people with shared care access." icon={<Users className="h-5 w-5 text-sky-500" />} />
          <StatCard title="Unlinked documents" value={data.stats.unlinkedDocuments} description="Files that need record linking for better context." icon={<FileHeart className="h-5 w-5 text-violet-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Prioritized action list</CardTitle>
              <CardDescription>Highest-value follow-ups across records, reminders, alerts, and profile readiness.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.tasks.map((task) => (
                <Link key={task.id} href={task.href} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-border hover:bg-muted/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={toneToPill(task.tone)}>{priorityLabel(task.priority)}</StatusPill>
                        <Badge>{task.source}</Badge>
                      </div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{task.dueLabel}</span>
                  </div>
                </Link>
              ))}
              {data.tasks.length === 0 ? <EmptyState title="No urgent care-plan tasks" description="Your current records do not show urgent follow-up items. Keep adding records to maintain a stronger plan." /> : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Readiness breakdown</CardTitle>
                <CardDescription>Where your care plan is strong and where it needs setup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {data.sections.map((section) => (
                  <div key={section.title} className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{section.score}% complete</p>
                      </div>
                      <StatusPill tone={toneToPill(section.tone)}>{section.status}</StatusPill>
                    </div>
                    <ProgressBar value={section.score} />
                    <div className="space-y-2">
                      {section.checks.map((check) => (
                        <div key={check.label} className="flex items-start gap-2 text-sm">
                          {check.complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />}
                          <div>
                            <p className="font-medium">{check.label}</p>
                            <p className="text-xs text-muted-foreground">{check.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming care timeline</CardTitle>
              <CardDescription>Appointments, reminders, and vaccine follow-ups in one planning stream.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.timeline.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-border hover:bg-muted/40">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-2">
                    {item.type === "appointment" ? <CalendarClock className="h-4 w-4" /> : item.type === "reminder" ? <ShieldCheck className="h-4 w-4" /> : <HeartPulse className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <StatusPill tone={toneToPill(item.tone)}>{item.type}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.when)}</p>
                  </div>
                </Link>
              ))}
              {data.timeline.length === 0 ? <EmptyState title="No upcoming care items" description="Upcoming appointments, reminders, and vaccination due dates will appear here." /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Care context snapshot</CardTitle>
              <CardDescription>Quick context to prepare for appointments or caregiver review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /><p className="font-medium">Care providers</p></div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {data.doctors.map((doctor) => <p key={doctor.id}>{doctor.name}{doctor.specialty ? ` • ${doctor.specialty}` : ""}</p>)}
                  {data.doctors.length === 0 ? <p>No providers saved yet.</p> : null}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2"><Pill className="h-4 w-4" /><p className="font-medium">Medication context</p></div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {data.medications.map((med) => <p key={med.id}>{med.name} • {med.dosage} • {med.frequency}</p>)}
                  {data.medications.length === 0 ? <p>No active medications saved yet.</p> : null}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4" /><p className="font-medium">Latest vitals</p></div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {data.latestVitals.map((vital) => (
                    <p key={vital.id}>
                      {formatDate(vital.recordedAt)} • BP {vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : "—"} • HR {vital.heartRate ?? "—"}
                    </p>
                  ))}
                  {data.latestVitals.length === 0 ? <p>No recent vitals saved yet.</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
