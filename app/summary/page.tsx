import { FileText, Printer, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatDate, formatDateTime, bpLabel } from "@/lib/utils";
import { PrintSummaryButton } from "@/components/print-summary-button";
import { PageHeader } from "@/components/common";
import { ModuleHero, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";

export default async function SummaryPage() {
  const user = await requireUser();

  const [profile, meds, appointments, labs, vitals] = await Promise.all([
    db.healthProfile.findUnique({
      where: { userId: user.id },
    }),
    db.medication.findMany({
      where: { userId: user.id },
      include: { schedules: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.appointment.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    }),
    db.labResult.findMany({
      where: { userId: user.id },
      orderBy: { dateTaken: "desc" },
      take: 10,
    }),
    db.vitalRecord.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6 print:max-w-none print:p-0">
        <PageTransition>
          <PageHeader
            title="Printable Health Summary"
            description="A cleaner high-level patient summary for sharing, reviewing, or saving as PDF."
            action={
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-background/70">Print-ready</Badge>
                <PrintSummaryButton />
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Patient summary"
            title={profile?.fullName ?? user.name ?? "Patient overview"}
            description="Use your browser print dialog to save this page as PDF or prepare it for care-team review."
            stats={[
              { label: "Medications", value: meds.length },
              { label: "Appointments", value: appointments.length },
              { label: "Lab results", value: labs.length },
              { label: "Vitals", value: vitals.length },
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
                      Core profile details included in the printable summary.
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
                      <p className="mt-2 text-sm text-muted-foreground">
                        {profile?.chronicConditions ?? "—"}
                      </p>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Allergies</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {profile?.allergiesSummary ?? "—"}
                      </p>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {profile?.notes ?? "—"}
                      </p>
                    </DataCard>
                  </CardContent>
                </Card>

                <Card className="bg-background/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        This summary is designed to be human-readable on screen and still work well when printed or saved as PDF.
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
                    <CardDescription className="mt-1">
                      Latest medication plans and schedules.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {meds.length ? (
                      meds.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.dosage} • {item.frequency}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Times: {item.schedules.map((s) => s.timeOfDay).join(", ") || "—"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Start: {formatDate(item.startDate)} • End: {formatDate(item.endDate)}
                          </p>
                        </DataCard>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No medications available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription className="mt-1">
                      Most recent consultations and visit status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {appointments.length ? (
                      appointments.map((item) => (
                        <DataCard key={item.id}>
                          <p className="font-medium">{item.purpose}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.doctorName} • {item.clinic}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(item.scheduledAt)} • {item.status}
                          </p>
                        </DataCard>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No appointments available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Labs and recent vitals</CardTitle>
                    <CardDescription className="mt-1">
                      Recent clinical results and basic vital snapshot.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Lab results</p>
                      {labs.length ? (
                        labs.map((item) => (
                          <DataCard key={item.id}>
                            <p className="font-medium">{item.testName}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatDate(item.dateTaken)} • {item.resultSummary}
                            </p>
                            <p className="text-sm text-muted-foreground">{item.flag}</p>
                          </DataCard>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No lab results available.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Vitals</p>
                      {vitals.length ? (
                        vitals.map((item) => (
                          <DataCard key={item.id}>
                            <p className="font-medium">{formatDateTime(item.recordedAt)}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              BP {bpLabel(item.systolic, item.diastolic)} • HR {item.heartRate ?? "—"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Sugar {item.bloodSugar ?? "—"} • Weight {item.weightKg ?? "—"}
                            </p>
                          </DataCard>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No vitals available.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="print:hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Ready to print</p>
                        <p className="text-sm text-muted-foreground">
                          Save this summary as PDF for sharing or offline review.
                        </p>
                      </div>
                      <div className="shrink-0">
                        <PrintSummaryButton />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </StaggerItem>
          </div>
        </StaggerGroup>
      </div>
    </AppShell>
  );
}