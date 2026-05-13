import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { requireUser } from "@/lib/session";
import {
  getVisitPrepData,
  type VisitPrepPriority,
  type VisitPrepTimelineItem,
} from "@/lib/visit-prep";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function priorityTone(priority: VisitPrepPriority) {
  if (priority === "critical") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "medium") return "info" as const;
  return "neutral" as const;
}

function sourceTone(source: VisitPrepTimelineItem["source"]) {
  if (source === "appointment") return "success" as const;
  if (source === "reminder") return "warning" as const;
  if (source === "lab") return "danger" as const;
  if (source === "symptom") return "info" as const;
  if (source === "vital") return "success" as const;
  return "neutral" as const;
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-2">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <p className="mb-2 font-medium">{title}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default async function VisitPrepPage() {
  const user = await requireUser();
  const data = await getVisitPrepData(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Visit Prep Hub"
          description="Prepare a cleaner doctor visit packet from your appointments, medications, labs, vitals, symptoms, documents, reminders, and alerts."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/summary/print?mode=doctor"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60"
              >
                Doctor packet
              </Link>
              <Link
                href="/appointments"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
              >
                Appointments
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Prep readiness"
            value={`${data.readinessScore}%`}
            description={data.readinessSignal.description}
            icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Visit countdown"
            value={data.nextVisitCountdown}
            description="Timing signal for the appointment currently driving this visit packet."
            icon={<CalendarDays className="h-5 w-5 text-violet-500" />}
          />
          <StatCard
            title="Critical tasks"
            value={data.summary.criticalTasks}
            description="Items that should be discussed before or during the next visit."
            icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
          />
          <StatCard
            title="Flagged labs"
            value={data.summary.abnormalLabs}
            description="Recent lab results with borderline, high, or low flags."
            icon={<FileText className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Packet items"
            value={data.summary.packetItems}
            description="Recent records available for the visit packet."
            icon={<CalendarCheck2 className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardDescription>Visit readiness signal</CardDescription>
                <CardTitle className="mt-2 flex flex-wrap items-center gap-2">
                  {data.readinessSignal.label}
                  <StatusPill tone={data.readinessSignal.tone}>
                    {data.readinessSignal.state}
                  </StatusPill>
                </CardTitle>
              </div>
              <Badge className="bg-background/80">
                {data.nextVisitCountdown}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
            <p className="text-sm text-muted-foreground">
              {data.readinessSignal.description}
            </p>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
              <p className="font-medium">Recommended next step</p>
              <p className="mt-1 text-muted-foreground">
                {data.readinessSignal.nextStep}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Next visit context</CardTitle>
                <CardDescription>
                  The appointment this workspace is currently preparing around.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.nextAppointment ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-semibold">
                        {data.nextAppointment.purpose}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(data.nextAppointment.scheduledAt)} •{" "}
                        {data.nextVisitCountdown}
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailCard title="Provider">
                        {data.nextAppointment.doctorName}
                        <br />
                        {data.nextAppointment.specialty ||
                          data.nextAppointment.doctor?.specialty ||
                          "Specialty not set"}
                      </DetailCard>
                      <DetailCard title="Clinic">
                        {data.nextAppointment.clinic}
                        <br />
                        {data.nextAppointment.doctor?.phone ||
                          "No phone recorded"}
                      </DetailCard>
                    </div>
                    {data.nextAppointment.notes ? (
                      <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                        {data.nextAppointment.notes}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title="No upcoming visit yet"
                    description="Add an appointment so VitaVault can build a provider-ready packet around the visit date."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Readiness checklist</CardTitle>
                <CardDescription>
                  Quick checks that improve the quality of the visit packet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall readiness</span>
                    <span className="text-muted-foreground">
                      {data.readinessScore}%
                    </span>
                  </div>
                  <ProgressBar value={data.readinessScore} />
                </div>
                <div className="space-y-2">
                  {data.readinessChecks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 transition-all hover:bg-muted/40"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <StatusPill tone={item.complete ? "success" : "warning"}>
                        {item.complete ? "Ready" : "Missing"}
                      </StatusPill>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Priority visit prep queue</CardTitle>
              <CardDescription>
                Tasks generated from gaps, abnormal records, severe symptoms,
                open alerts, and unlinked documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.tasks.map((task) => (
                <Link
                  key={`${task.priority}-${task.title}`}
                  href={task.href}
                  className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-all hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.detail}
                      </p>
                    </div>
                    <StatusPill tone={priorityTone(task.priority)}>
                      {task.priority}
                    </StatusPill>
                  </div>
                </Link>
              ))}
              {data.tasks.length === 0 ? (
                <EmptyState
                  title="Visit packet looks ready"
                  description="No urgent visit-prep gaps were detected from the available records."
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Provider timeline</CardTitle>
              <CardDescription>
                Near-term appointments, reminders, labs, symptoms, vitals, and
                documents grouped by visit relevance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {data.timelineGroups.map((group) => (
                <div key={group.bucket} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{group.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                    <Badge className="bg-background/70">
                      {group.items.length} item
                      {group.items.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 transition-all hover:bg-muted/40"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={sourceTone(item.source)}>
                              {item.source}
                            </StatusPill>
                            <StatusPill tone="neutral">
                              {item.proximityLabel}
                            </StatusPill>
                            <p className="font-medium">{item.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.detail}
                          </p>
                          <p className="text-xs font-medium text-primary">
                            {item.actionLabel}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.at)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {data.timelineGroups.length === 0 ? (
                <EmptyState
                  title="No timeline items yet"
                  description="Appointments, labs, vitals, documents, reminders, and symptoms will appear here once records exist."
                />
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Medication snapshot</CardTitle>
                <CardDescription>
                  Active medications to confirm before the provider
                  conversation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.activeMedications.slice(0, 6).map((medication) => (
                  <div
                    key={medication.id}
                    className="rounded-2xl border border-border/60 bg-background/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{medication.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {medication.dosage} • {medication.frequency}
                        </p>
                      </div>
                      <Badge>{medication.schedules.length} schedules</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Provider:{" "}
                      {medication.doctor?.name || "No linked provider"}
                    </p>
                  </div>
                ))}
                {data.activeMedications.length === 0 ? (
                  <EmptyState
                    title="No active medications"
                    description="Add active medications before generating a provider packet."
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Care context</CardTitle>
                <CardDescription>
                  Provider and safety context that can strengthen the visit
                  handoff.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <DetailCard title="Emergency contact">
                  {data.profile?.emergencyContactName
                    ? `${data.profile.emergencyContactName} • ${data.profile.emergencyContactPhone || "No phone"}`
                    : "Not recorded"}
                </DetailCard>
                <DetailCard title="Allergies">
                  {data.profile?.allergiesSummary ||
                    "No allergy context recorded"}
                </DetailCard>
                <DetailCard title="Doctors on file">
                  {data.doctors.length
                    ? `${data.doctors.length} provider${data.doctors.length === 1 ? "" : "s"} available`
                    : "No doctors recorded"}
                </DetailCard>
                <DetailCard title="Recent documents">
                  {data.recentDocuments.length
                    ? `${data.recentDocuments.length} recent file${data.recentDocuments.length === 1 ? "" : "s"}; ${data.unlinkedDocuments.length} unlinked`
                    : "No recent documents"}
                </DetailCard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review signals</CardTitle>
                <CardDescription>
                  What should be called out during the appointment.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <DetailCard title="Symptoms">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4" />{" "}
                    {data.summary.unresolvedSevereSymptoms} unresolved severe
                  </div>
                </DetailCard>
                <DetailCard title="Alerts">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />{" "}
                    {data.openAlerts.length} open alerts
                  </div>
                </DetailCard>
                <DetailCard title="Providers">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" /> {data.doctors.length}{" "}
                    contacts
                  </div>
                </DetailCard>
                <DetailCard title="Active medications">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />{" "}
                    {data.summary.activeMedications} to confirm
                  </div>
                </DetailCard>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
