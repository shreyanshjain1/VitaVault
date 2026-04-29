import { AlertTriangle, HeartPulse, Phone, Pill, Printer, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { DataCard, ModuleHero, ModuleListCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { EmergencyCardActions } from "@/components/emergency-card-actions";
import { getEmergencyCardData } from "@/lib/emergency-card";
import { requireUser } from "@/lib/session";
import { bpLabel, formatDate, formatDateTime } from "@/lib/utils";

function Field({ label, value, urgent = false }: { label: string; value?: string | number | null; urgent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${urgent ? "text-destructive" : "text-foreground"}`}>{value || "—"}</p>
    </div>
  );
}

export default async function EmergencyCardPage() {
  const currentUser = await requireUser();
  const data = await getEmergencyCardData(currentUser.id!);
  const { profile, patientName, medications, doctors, latestVitals, severeSymptoms, criticalProfileItems, generatedAt } = data;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Emergency Health Card"
            description="A quick-access printable card with the most important emergency details from the patient profile."
            action={<EmergencyCardActions />}
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Emergency packet"
            title={patientName}
            description="Keep this card updated before appointments, travel, school, work, or caregiver handoffs. It is designed for browser printing and Save as PDF workflows."
            stats={[
              { label: "Active meds", value: medications.length },
              { label: "Doctors", value: doctors.length },
              { label: "Open severe symptoms", value: severeSymptoms.length },
              { label: "Profile gaps", value: criticalProfileItems.length },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <StaggerItem>
              <Card className="overflow-hidden border-destructive/25">
                <CardHeader className="bg-destructive/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        Emergency profile
                      </CardTitle>
                      <CardDescription className="mt-1">Critical identity, allergy, condition, and contact details.</CardDescription>
                    </div>
                    <Badge className="bg-background/80">Generated {formatDateTime(generatedAt)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Patient name" value={patientName} />
                    <Field label="Date of birth" value={formatDate(profile?.dateOfBirth)} />
                    <Field label="Sex" value={profile?.sex} />
                    <Field label="Blood type" value={profile?.bloodType} urgent={!profile?.bloodType} />
                    <Field label="Height" value={profile?.heightCm ? `${profile.heightCm} cm` : "—"} />
                    <Field label="Weight" value={profile?.weightKg ? `${profile.weightKg} kg` : "—"} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <DataCard className="border-destructive/25 bg-destructive/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <p className="text-sm font-semibold">Allergies</p>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{profile?.allergiesSummary || "No allergies documented yet."}</p>
                    </DataCard>
                    <DataCard>
                      <div className="flex items-center gap-2">
                        <HeartPulse className="h-4 w-4" />
                        <p className="text-sm font-semibold">Chronic conditions</p>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{profile?.chronicConditions || "No chronic conditions documented yet."}</p>
                    </DataCard>
                  </div>

                  <DataCard>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <p className="text-sm font-semibold">Emergency contact</p>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Field label="Contact name" value={profile?.emergencyContactName} urgent={!profile?.emergencyContactName} />
                      <Field label="Contact phone" value={profile?.emergencyContactPhone} urgent={!profile?.emergencyContactPhone} />
                    </div>
                  </DataCard>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <ModuleListCard title="Card readiness" description="Profile gaps that should be fixed before sharing this card.">
                  {criticalProfileItems.length ? (
                    <div className="space-y-3">
                      {criticalProfileItems.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/70 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                      Emergency essentials are filled in.
                    </div>
                  )}
                </ModuleListCard>

                <ModuleListCard title="Latest vitals snapshot" description="Most recent recorded vitals, if available.">
                  {latestVitals ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Recorded" value={formatDateTime(latestVitals.recordedAt)} />
                      <Field label="Blood pressure" value={bpLabel(latestVitals.systolic, latestVitals.diastolic)} />
                      <Field label="Heart rate" value={latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : "—"} />
                      <Field label="Oxygen" value={latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : "—"} />
                      <Field label="Blood sugar" value={latestVitals.bloodSugar ? `${latestVitals.bloodSugar}` : "—"} />
                      <Field label="Temperature" value={latestVitals.temperatureC ? `${latestVitals.temperatureC} °C` : "—"} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
                  )}
                </ModuleListCard>

                <Link
                  href="/emergency-card/print?autoprint=1"
                  className="flex items-center justify-center gap-2 rounded-[28px] border border-border/70 bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                >
                  <Printer className="h-4 w-4" />
                  Open print-ready emergency card
                </Link>
              </div>
            </StaggerItem>
          </div>
        </StaggerGroup>

        <div className="grid gap-6 xl:grid-cols-3">
          <ModuleListCard title="Active medications" description="Critical medication list for emergency responders and clinicians." className="xl:col-span-1">
            {medications.length ? (
              <div className="space-y-3">
                {medications.map((medication) => (
                  <DataCard key={medication.id}>
                    <div className="flex items-start gap-3">
                      <Pill className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{medication.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{medication.dosage} • {medication.frequency}</p>
                        {medication.instructions ? <p className="mt-1 text-xs text-muted-foreground">{medication.instructions}</p> : null}
                        {medication.doctor ? <p className="mt-1 text-xs text-muted-foreground">Prescriber: {medication.doctor.name}</p> : null}
                      </div>
                    </div>
                  </DataCard>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active medications documented.</p>
            )}
          </ModuleListCard>

          <ModuleListCard title="Care contacts" description="Doctors and providers to contact during handoffs." className="xl:col-span-1">
            {doctors.length ? (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <DataCard key={doctor.id}>
                    <div className="flex items-start gap-3">
                      <Stethoscope className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{doctor.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{doctor.specialty ?? "General care"}{doctor.clinic ? ` • ${doctor.clinic}` : ""}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{doctor.phone ?? doctor.email ?? "No contact listed"}</p>
                      </div>
                    </div>
                  </DataCard>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No doctors documented.</p>
            )}
          </ModuleListCard>

          <ModuleListCard title="Urgent symptom context" description="Open severe symptoms that may affect triage." className="xl:col-span-1">
            {severeSymptoms.length ? (
              <div className="space-y-3">
                {severeSymptoms.map((symptom) => (
                  <DataCard key={symptom.id} className="border-destructive/25 bg-destructive/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{symptom.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Started {formatDate(symptom.startedAt)}{symptom.bodyArea ? ` • ${symptom.bodyArea}` : ""}</p>
                      </div>
                      <StatusPill tone="danger">{symptom.severity}</StatusPill>
                    </div>
                  </DataCard>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" />
                No unresolved severe symptoms found.
              </div>
            )}
          </ModuleListCard>
        </div>
      </div>
    </AppShell>
  );
}
