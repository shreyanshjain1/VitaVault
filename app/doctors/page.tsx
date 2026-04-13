import { Building2, PencilLine, Stethoscope, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { addDoctor, deleteDoctor, updateDoctor } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import {
  ModuleFormCard,
  ModuleHero,
  ModuleListCard,
  DataCard,
} from "@/components/module-sections";
import {
  PageTransition,
  StaggerGroup,
  StaggerItem,
} from "@/components/page-transition";

export default async function DoctorsPage() {
  const user = await requireUser();

  const [doctors, linkedUsage] = await Promise.all([
    db.doctor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      db.medication.groupBy({ by: ["doctorId"], where: { userId: user.id, doctorId: { not: null } }, _count: { _all: true } }),
      db.appointment.groupBy({ by: ["doctorId"], where: { userId: user.id, doctorId: { not: null } }, _count: { _all: true } }),
    ]),
  ]);

  const specialtyCount = new Set(
    doctors.map((doctor) => doctor.specialty).filter(Boolean)
  ).size;

  const clinicCount = new Set(
    doctors.map((doctor) => doctor.clinic).filter(Boolean)
  ).size;

  const [medicationUsage, appointmentUsage] = linkedUsage;
  const usageMap = new Map<string, { medications: number; appointments: number }>();

  for (const item of medicationUsage) {
    if (!item.doctorId) continue;
    const existing = usageMap.get(item.doctorId) ?? { medications: 0, appointments: 0 };
    existing.medications = item._count._all;
    usageMap.set(item.doctorId, existing);
  }

  for (const item of appointmentUsage) {
    if (!item.doctorId) continue;
    const existing = usageMap.get(item.doctorId) ?? { medications: 0, appointments: 0 };
    existing.appointments = item._count._all;
    usageMap.set(item.doctorId, existing);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Doctors"
            description="Maintain your doctor and clinic directory so medications, appointments, and summaries stay connected."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{doctors.length} doctors</Badge>
                <Badge className="bg-background/70">{clinicCount} clinics</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Care directory"
            title="Doctors and clinics"
            description="This is your reusable reference layer for appointment planning, prescriptions, and care-team context."
            stats={[
              { label: "Doctors", value: doctors.length },
              { label: "Specialties", value: specialtyCount },
              { label: "Clinics", value: clinicCount },
              {
                label: "Latest doctor",
                value: doctors[0]?.name ?? "—",
                hint: doctors[0]?.specialty ?? "No doctor yet",
              },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Add doctor"
                description="Store a clinician, specialty, clinic, and contact details for future use."
              >
                <form action={addDoctor} className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input name="name" required placeholder="Dr. Maria Santos" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Input name="specialty" placeholder="Cardiology" />
                    </div>

                    <div className="space-y-2">
                      <Label>Clinic</Label>
                      <Input name="clinic" placeholder="HeartCare Clinic" />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input name="phone" placeholder="+63..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input name="email" type="email" placeholder="doctor@clinic.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input name="address" placeholder="Clinic address" />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      className="min-h-[120px]"
                      placeholder="Consultation habits, schedule notes, referral context, or clinic reminders."
                    />
                  </div>

                  <Button type="submit" size="lg">
                    Add doctor
                  </Button>
                </form>
              </ModuleFormCard>
            </StaggerItem>

            <StaggerItem>
              <ModuleListCard
                title="Doctor directory"
                description="A more polished directory for your clinicians and clinic contacts."
              >
                <div className="space-y-4">
                  {doctors.length ? (
                    doctors.map((doctor) => {
                      const usage = usageMap.get(doctor.id) ?? { medications: 0, appointments: 0 };

                      return (
                        <DataCard key={doctor.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{doctor.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {doctor.specialty ?? "General"} • {doctor.clinic ?? "No clinic set"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-background/70">
                                {doctor.specialty ?? "General"}
                              </Badge>
                              <Badge className="bg-background/70">
                                {usage.medications} meds • {usage.appointments} appointments
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">Contact</p>
                              </div>
                              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                                <p>Phone: {doctor.phone ?? "—"}</p>
                                <p>Email: {doctor.email ?? "—"}</p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">Clinic</p>
                              </div>
                              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                                <p>{doctor.clinic ?? "No clinic set"}</p>
                                <p>{doctor.address ?? "No address recorded"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                            <p className="text-sm font-medium">Notes</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {doctor.notes ?? "No notes added."}
                            </p>
                          </div>

                          <details className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground">
                              <PencilLine className="h-4 w-4 text-primary" />
                              Manage doctor
                            </summary>

                            <div className="mt-4 grid gap-4">
                              <form action={updateDoctor} className="grid gap-4">
                                <input type="hidden" name="doctorId" value={doctor.id} />

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Name</Label>
                                    <Input name="name" required defaultValue={doctor.name} />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Specialty</Label>
                                    <Input name="specialty" defaultValue={doctor.specialty ?? ""} />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Clinic</Label>
                                    <Input name="clinic" defaultValue={doctor.clinic ?? ""} />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input name="phone" defaultValue={doctor.phone ?? ""} />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input name="email" type="email" defaultValue={doctor.email ?? ""} />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Address</Label>
                                  <Input name="address" defaultValue={doctor.address ?? ""} />
                                </div>

                                <div className="space-y-2">
                                  <Label>Notes</Label>
                                  <Textarea name="notes" className="min-h-[110px]" defaultValue={doctor.notes ?? ""} />
                                </div>

                                <div className="flex flex-wrap gap-3">
                                  <Button type="submit" variant="outline">
                                    Save changes
                                  </Button>
                                </div>
                              </form>

                              <form action={deleteDoctor}>
                                <input type="hidden" name="doctorId" value={doctor.id} />
                                <Button type="submit" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                  Delete doctor
                                </Button>
                              </form>

                              {usage.medications > 0 || usage.appointments > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  Delete is blocked while this doctor is linked to medications or appointments.
                                </p>
                              ) : null}
                            </div>
                          </details>
                        </DataCard>
                      );
                    })
                  ) : (
                    <EmptyState
                      title="No doctors yet"
                      description="Add your doctors and clinics so appointments and medications can reference them."
                    />
                  )}
                </div>
              </ModuleListCard>
            </StaggerItem>
          </div>
        </StaggerGroup>
      </div>
    </AppShell>
  );
}
