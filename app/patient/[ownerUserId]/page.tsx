import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  LockKeyhole,
  Pill,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireOwnerAccess } from "@/lib/access";
import { getCaregiverWorkspaceData, formatCareDate } from "@/lib/caregiver-workspace";
import { requireUser } from "@/lib/session";
import { generatePatientInsightAction } from "../actions";

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 bg-background/40 p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone =
    normalized.includes("CRITICAL") || normalized.includes("HIGH") || normalized.includes("OVERDUE") || normalized.includes("OPEN")
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
      : normalized.includes("MEDIUM") || normalized.includes("BORDERLINE") || normalized.includes("DUE")
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";

  return <Badge className={tone}>{value}</Badge>;
}

export default async function SharedPatientWorkspacePage({
  params,
}: {
  params: Promise<{ ownerUserId: string }>;
}) {
  const { ownerUserId } = await params;
  const actor = await requireUser();
  const access = await requireOwnerAccess(actor.id, ownerUserId, "view");
  const data = await getCaregiverWorkspaceData({ ownerUserId, access });
  const profile = data.owner.healthProfile;

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-xl font-semibold text-primary-foreground shadow-sm">
                {data.initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Shared patient workspace</Badge>
                  <StatusBadge value={String(access.accessRole)} />
                  {access.isOwner ? <Badge>Owner view</Badge> : null}
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">{data.displayName}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Caregiver-friendly command center for reviewing high-priority context, upcoming care work,
                  recent records, shared permissions, and patient handoff details in one place.
                </p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <span>Age: {data.age ?? "—"}</span>
                  <span>Blood type: {profile?.bloodType ?? "—"}</span>
                  <span>Emergency: {profile?.emergencyContactName ?? "—"}</span>
                  <span>Care members: {data.metrics.careMembers}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/care-team"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/60"
              >
                Back to care team
              </Link>
              {access.canExport ? (
                <Link
                  href="/summary/print"
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/60"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Print packet
                </Link>
              ) : null}
              {access.canGenerateAIInsights ? (
                <form action={generatePatientInsightAction}>
                  <input type="hidden" name="ownerUserId" value={ownerUserId} />
                  <Button type="submit">
                    <Brain className="h-4 w-4" />
                    Generate insight
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Open alerts" value={data.metrics.openAlerts} description="Care-team visible alerts needing review." icon={<AlertTriangle className="h-5 w-5" />} />
          <StatCard title="Due reminders" value={data.metrics.dueReminders} description="Upcoming or overdue care actions." icon={<ClipboardList className="h-5 w-5" />} />
          <StatCard title="Active medications" value={data.metrics.activeMedications} description="Medication records marked active." icon={<Pill className="h-5 w-5" />} />
          <StatCard title="Recent documents" value={data.metrics.documents} description="Shared files available in this view." icon={<FileText className="h-5 w-5" />} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Needs attention</CardTitle>
                    <CardDescription className="mt-1">
                      Prioritized from visible alerts, abnormal labs, unresolved symptoms, and due reminders.
                    </CardDescription>
                  </div>
                  <Badge>{data.attentionItems.length} items</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.attentionItems.length === 0 ? (
                  <EmptyState>No urgent shared items detected from the available records.</EmptyState>
                ) : (
                  data.attentionItems.map((item) => (
                    <Link key={item.key} href={item.href} className="block rounded-3xl border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge value={item.type} />
                            <span className="text-xs text-muted-foreground">{item.meta}</span>
                          </div>
                          <p className="mt-2 font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming care timeline</CardTitle>
                <CardDescription className="mt-1">
                  Appointments, reminders, and recent clinical context sorted by date.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.timeline.length === 0 ? (
                  <EmptyState>No upcoming timeline items are available for this shared record.</EmptyState>
                ) : (
                  data.timeline.map((item) => (
                    <Link key={item.key} href={item.href} className="grid gap-3 rounded-3xl border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40 sm:grid-cols-[150px_1fr]">
                      <div className="text-sm font-medium">{formatCareDate(item.at, true)}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{item.kind}</Badge>
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent record activity</CardTitle>
                <CardDescription className="mt-1">
                  Latest vitals, symptoms, and documents available to this caregiver view.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentRecords.length === 0 ? (
                  <EmptyState>No recent shared record activity yet.</EmptyState>
                ) : (
                  data.recentRecords.map((item) => (
                    <Link key={item.key} href={item.href} className="grid gap-3 rounded-3xl border border-border/60 bg-background/40 p-4 transition hover:bg-muted/40 sm:grid-cols-[150px_1fr]">
                      <div className="text-sm font-medium">{formatCareDate(item.at, true)}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{item.kind}</Badge>
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Patient overview</CardTitle>
                    <CardDescription className="mt-1">Baseline profile and emergency context.</CardDescription>
                  </div>
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Email" value={data.owner.email} />
                  <Info label="Date of birth" value={formatCareDate(profile?.dateOfBirth)} />
                  <Info label="Sex" value={profile?.sex ?? "—"} />
                  <Info label="Blood type" value={profile?.bloodType ?? "—"} />
                  <Info label="Height" value={profile?.heightCm ? `${profile.heightCm} cm` : "—"} />
                  <Info label="Weight" value={profile?.weightKg ? `${profile.weightKg} kg` : "—"} />
                </div>
                <Info label="Emergency contact" value={profile?.emergencyContactName ?? "—"} />
                <Info label="Emergency phone" value={profile?.emergencyContactPhone ?? "—"} />
                <Info label="Allergies" value={profile?.allergiesSummary ?? "—"} />
                <Info label="Chronic conditions" value={profile?.chronicConditions ?? "—"} />
                <Info label="Care notes" value={profile?.notes ?? "—"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Shared access permissions</CardTitle>
                    <CardDescription className="mt-1">What this user can do in the patient workspace.</CardDescription>
                  </div>
                  <LockKeyhole className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.permissions.map((permission) => (
                  <div key={permission.label} className="flex gap-3 rounded-3xl border border-border/60 bg-background/40 p-4">
                    {permission.enabled ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{permission.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Latest AI insight</CardTitle>
                    <CardDescription className="mt-1">Most recent generated summary for this shared patient.</CardDescription>
                  </div>
                  <Brain className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {data.latestInsight ? (
                  <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                    <p className="font-medium">{data.latestInsight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.latestInsight.summary}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Generated {formatCareDate(data.latestInsight.createdAt, true)}</p>
                  </div>
                ) : (
                  <EmptyState>No AI insight has been generated yet for this shared patient.</EmptyState>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Active care team</CardTitle>
                    <CardDescription className="mt-1">Other active members with shared patient access.</CardDescription>
                  </div>
                  <UsersRound className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.careTeam.length === 0 ? (
                  <EmptyState>No active care team members are listed.</EmptyState>
                ) : (
                  data.careTeam.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-border/60 bg-background/40 p-4">
                      <p className="font-medium">{item.member.name ?? item.member.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.member.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge value={item.accessRole} />
                        {item.canViewRecords ? <Badge>View</Badge> : null}
                        {item.canEditRecords ? <Badge>Edit</Badge> : null}
                        {item.canAddNotes ? <Badge>Notes</Badge> : null}
                        {item.canExport ? <Badge>Export</Badge> : null}
                        {item.canGenerateAIInsights ? <Badge>AI</Badge> : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <MiniList
            title="Active medications"
            description="Current medication context for handoff review."
            icon={<Pill className="h-5 w-5 text-primary" />}
            empty="No active medications recorded."
            items={data.medications.filter((item) => item.active).slice(0, 5).map((item) => ({
              key: item.id,
              title: item.name,
              detail: `${item.dosage} · ${item.frequency} · ${item.doctor?.name ?? "No doctor linked"}`,
              meta: item.schedules.map((schedule) => schedule.timeOfDay).join(", ") || "No schedule",
            }))}
          />
          <MiniList
            title="Upcoming appointments"
            description="Next visits and follow-up context."
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            empty="No upcoming appointments recorded."
            items={data.appointments.map((item) => ({
              key: item.id,
              title: item.purpose,
              detail: `${item.doctorName} · ${item.clinic}`,
              meta: `${formatCareDate(item.scheduledAt, true)} · ${item.status}`,
            }))}
          />
          <MiniList
            title="Latest labs"
            description="Most recent lab results and flags."
            icon={<Stethoscope className="h-5 w-5 text-primary" />}
            empty="No lab results recorded."
            items={data.labs.slice(0, 5).map((item) => ({
              key: item.id,
              title: item.testName,
              detail: item.resultSummary,
              meta: `${item.flag} · ${formatCareDate(item.dateTaken)}`,
            }))}
          />
        </section>

        <section className="rounded-[28px] border border-border/60 bg-card/70 p-5 text-sm text-muted-foreground shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <p>
                This workspace is access-aware. Records are shown only after an active care-team grant is confirmed, and action buttons are displayed based on the current permission set.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{access.canViewRecords ? "View allowed" : "View blocked"}</Badge>
              <Badge>{access.canExport ? "Export allowed" : "Export blocked"}</Badge>
              <Badge>{access.canGenerateAIInsights ? "AI allowed" : "AI blocked"}</Badge>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function MiniList({
  title,
  description,
  icon,
  empty,
  items,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  empty: string;
  items: Array<{ key: string; title: string; detail: string; meta: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          items.map((item) => (
            <div key={item.key} className="rounded-3xl border border-border/60 bg-background/40 p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.meta}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
