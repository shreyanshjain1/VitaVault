import { AlertTriangle, CalendarDays, FileText, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatDate, formatDateTime, bpLabel } from "@/lib/utils";
import { PageHeader } from "@/components/common";
import { ModuleHero, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { SummaryExportActions } from "@/components/summary-export-actions";
import { getPatientSummaryData } from "@/lib/patient-summary";

export default async function SummaryPage() {
  const user = await requireUser();
  const data = await getPatientSummaryData(user.id!);
  const {
    generatedAt,
    profile,
    meds,
    appointments,
    labs,
    vitals,
    symptoms,
    vaccinations,
    reminders,
    docs,
    alerts,
    stats,
    latestInsight,
    careAccess,
  } = data;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6 print:max-w-none print:p-0">
        <PageTransition>
          <PageHeader
            title="Patient Summary & PDF Export"
            description="A cleaner high-level summary designed for browser printing and Save as PDF workflows."
            action={
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-background/70">Print-ready</Badge>
                <Badge className="bg-background/70">PDF-friendly</Badge>
                <Badge className="bg-background/70">{stats.careMembers} active share{stats.careMembers === 1 ? "" : "s"}</Badge>
                <SummaryExportActions />
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Patient summary"
            title={profile?.fullName ?? user.name ?? "Patient overview"}
            description="Share a cleaner longitudinal snapshot with care teams, save it as PDF, or use the print view for a tighter paper layout."
            stats={[
              { label: "Medications", value: stats.medications },
              { label: "Appointments", value: stats.appointments },
              { label: "Labs", value: stats.labs },
              { label: "Vitals", value: stats.vitals },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr] print:grid-cols-1">
            <StaggerItem>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient overview</CardTitle>
                    <CardDescription className="mt-1">
                      Core profile details included in the export.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DataCard>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <p><span className="font-medium">Name:</span> {profile?.fullName ?? user.name ?? "—"}</p>
                        <p><span className="font-medium">Date of birth:</span> {formatDate(profile?.dateOfBirth)}</p>
                        <p><span className="font-medium">Sex:</span> {profile?.sex ?? "—"}</p>
                        <p><span className="font-medium">Blood type:</span> {profile?.bloodType ?? "—"}</p>
                        <p><span className="font-medium">Height:</span> {profile?.heightCm ?? "—"} cm</p>
                        <p><span className="font-medium">Weight:</span> {profile?.weightKg ?? "—"} kg</p>
                        <p><span className="font-medium">Emergency contact:</span> {profile?.emergencyContactName ?? "—"}</p>
                        <p><span className="font-medium">Emergency phone:</span> {profile?.emergencyContactPhone ?? "—"}</p>
                      </div>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Chronic conditions</p>
                      <p className="mt-2 text-sm text-muted-foreground">{profile?.chronicConditions ?? "—"}</p>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Allergies</p>
                      <p className="mt-2 text-sm text-muted-foreground">{profile?.allergiesSummary ?? "—"}</p>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Care notes</p>
                      <p className="mt-2 text-sm text-muted-foreground">{profile?.notes ?? "—"}</p>
                    </DataCard>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle>Export profile</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      Snapshot metadata for handoff-ready PDF exports.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DataCard>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <p><span className="font-medium">Prepared:</span> {formatDateTime(generatedAt)}</p>
                        <p><span className="font-medium">Prepared by:</span> {user.name ?? user.email ?? "Signed-in user"}</p>
                        <p><span className="font-medium">Reminder items:</span> {stats.reminders}</p>
                        <p><span className="font-medium">Documents attached:</span> {stats.documents}</p>
                        <p><span className="font-medium">Open alerts:</span> {stats.alerts}</p>
                        <p><span className="font-medium">AI insight included:</span> {latestInsight ? "Yes" : "No"}</p>
                      </div>
                    </DataCard>
                    <DataCard>
                      <p className="text-sm font-medium">Print modes</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>• Standard PDF view for detailed patient handoff exports.</li>
                        <li>• Compact auto-print view for a tighter browser Save as PDF flow.</li>
                        <li>• Current page print keeps the richer card layout intact for internal use.</li>
                      </ul>
                    </DataCard>
                  </CardContent>
                </Card>

                {latestInsight ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <CardTitle>Latest AI insight</CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        Most recent generated clinical-style summary.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <DataCard>
                        <p className="font-medium">{latestInsight.title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{latestInsight.summary}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Generated {formatDateTime(latestInsight.createdAt)}</p>
                      </DataCard>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <CardTitle>Care-team export access</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      Active members currently included in the patient-sharing layer.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {careAccess.length ? careAccess.map((member) => (
                      <DataCard key={member.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium">{member.member.name ?? member.member.email ?? "Care team member"}</p>
                            <p className="mt-1 text-muted-foreground">{member.accessRole} • {member.status}</p>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <p>Export {member.canExport ? "enabled" : "disabled"}</p>
                            <p>Edit {member.canEditRecords ? "enabled" : "disabled"}</p>
                          </div>
                        </div>
                      </DataCard>
                    )) : <p className="text-sm text-muted-foreground">No active care-team access relationships.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <CardTitle>Active watch items</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      Quick items that matter during a handoff or review.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <DataCard>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open alerts</p>
                      <p className="mt-2 text-3xl font-semibold">{stats.alerts}</p>
                    </DataCard>
                    <DataCard>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending reminders</p>
                      <p className="mt-2 text-3xl font-semibold">{stats.reminders}</p>
                    </DataCard>
                    <DataCard>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent symptoms</p>
                      <p className="mt-2 text-3xl font-semibold">{stats.symptoms}</p>
                    </DataCard>
                    <DataCard>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</p>
                      <p className="mt-2 text-3xl font-semibold">{stats.documents}</p>
                    </DataCard>
                  </CardContent>
                </Card>

                <Card className="bg-background/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        This summary is designed to stay readable on screen and still export cleanly through the browser print dialog as PDF.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle>Medications</CardTitle>
                    </div>
                    <CardDescription className="mt-1">Latest medication plans and schedules.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {meds.length ? meds.map((item) => (
                      <DataCard key={item.id}>
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.dosage} • {item.frequency}</p>
                        <p className="mt-2 text-sm text-muted-foreground">Times: {item.schedules.map((s) => s.timeOfDay).join(", ") || "—"}</p>
                        <p className="text-sm text-muted-foreground">Start: {formatDate(item.startDate)} • End: {formatDate(item.endDate)}</p>
                      </DataCard>
                    )) : <p className="text-sm text-muted-foreground">No medications available.</p>}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <CardTitle>Appointments</CardTitle>
                      </div>
                      <CardDescription className="mt-1">Recent consultations and visit status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {appointments.length ? appointments.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.purpose}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.doctorName} • {item.clinic}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(item.scheduledAt)} • {item.status}</p>
                        </DataCard>
                      )) : <p className="text-sm text-muted-foreground">No appointments available.</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vaccinations</CardTitle>
                      <CardDescription className="mt-1">Recent vaccine history and follow-up dates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vaccinations.length ? vaccinations.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.vaccineName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Dose {item.doseNumber} • {formatDate(item.dateTaken)}</p>
                          <p className="text-sm text-muted-foreground">Next due {formatDate(item.nextDueDate)}</p>
                        </DataCard>
                      )) : <p className="text-sm text-muted-foreground">No vaccinations available.</p>}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent labs</CardTitle>
                      <CardDescription className="mt-1">Latest tests and highlighted flags.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {labs.length ? labs.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.testName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{formatDate(item.dateTaken)} • {item.flag}</p>
                          <p className="text-sm text-muted-foreground">{item.resultSummary}</p>
                        </DataCard>
                      )) : <p className="text-sm text-muted-foreground">No lab results available.</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent vitals</CardTitle>
                      <CardDescription className="mt-1">Recent measurements captured in the record.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vitals.length ? vitals.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{formatDateTime(item.recordedAt)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">BP {bpLabel(item.systolic, item.diastolic)} • HR {item.heartRate ?? "—"}</p>
                          <p className="text-sm text-muted-foreground">Blood sugar {item.bloodSugar ?? "—"} • O₂ {item.oxygenSaturation ?? "—"}</p>
                          <p className="text-sm text-muted-foreground">Temp {item.temperatureC ?? "—"} • Weight {item.weightKg ?? "—"}</p>
                        </DataCard>
                      )) : <p className="text-sm text-muted-foreground">No vital records available.</p>}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Symptoms & reminders</CardTitle>
                      <CardDescription className="mt-1">Recent symptom reports and reminder workload.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {symptoms.length ? symptoms.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.severity} • {formatDateTime(item.startedAt)}</p>
                          <p className="text-sm text-muted-foreground">{item.notes ?? (item.resolved ? "Marked resolved." : "No notes provided.")}</p>
                        </DataCard>
                      )) : <p className="text-sm text-muted-foreground">No symptom history available.</p>}

                      {reminders.length ? reminders.slice(0, 3).map((item) => (
                        <DataCard key={item.id} className="border-dashed">
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(item.dueAt)} • {item.state}</p>
                          <p className="text-sm text-muted-foreground">{item.description ?? "No reminder description."}</p>
                        </DataCard>
                      )) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Documents & alerts</CardTitle>
                      <CardDescription className="mt-1">Supporting records included in the current patient workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {docs.length ? docs.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.type} • {formatDateTime(item.createdAt)}</p>
                          <p className="text-sm text-muted-foreground">{item.fileName}</p>
                        </DataCard>
                      )) : <p className="text-sm text-muted-foreground">No documents available.</p>}

                      {alerts.length ? alerts.slice(0, 3).map((item) => (
                        <DataCard key={item.id} className="border-dashed">
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.severity} • {item.status}</p>
                          <p className="text-sm text-muted-foreground">{item.message}</p>
                        </DataCard>
                      )) : null}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </StaggerItem>
          </div>
        </StaggerGroup>
      </div>
    </AppShell>
  );
}
