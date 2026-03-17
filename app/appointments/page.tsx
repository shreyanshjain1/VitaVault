import { CalendarClock, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { saveAppointment } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { ModuleFormCard, ModuleHero, ModuleListCard, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";

export default async function AppointmentsPage() {
  const user = await requireUser();

  const [appointments, doctors] = await Promise.all([
    db.appointment.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: "asc" },
    }),
    db.doctor.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const upcomingCount = appointments.filter((a) => a.status === "UPCOMING").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;
  const nextAppointment = appointments.find((a) => a.status === "UPCOMING") ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Appointments"
            description="Store upcoming consultations, visit notes, and follow-up outcomes in one clinical timeline."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{upcomingCount} upcoming</Badge>
                <Badge className="bg-background/70">{completedCount} completed</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Visit planning"
            title="Consultations and follow-ups"
            description="This module should help you prepare for the next visit and retain what happened after it."
            stats={[
              { label: "Upcoming", value: upcomingCount },
              { label: "Completed", value: completedCount },
              { label: "Cancelled", value: cancelledCount },
              {
                label: "Next visit",
                value: nextAppointment ? formatDateTime(nextAppointment.scheduledAt) : "—",
              },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Add appointment"
                description="Create a visit entry with linked doctor, date, purpose, and follow-up notes."
              >
                <form action={saveAppointment} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Clinic / hospital</Label>
                      <Input name="clinic" required placeholder="St. Luke's Medical Center" />
                    </div>

                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Input name="specialty" placeholder="Cardiology" />
                    </div>

                    <div className="space-y-2">
                      <Label>Doctor name</Label>
                      <Input name="doctorName" required placeholder="Dr. Reyes" />
                    </div>

                    <div className="space-y-2">
                      <Label>Linked doctor</Label>
                      <Select name="doctorId" defaultValue="">
                        <option value="">Select doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date & time</Label>
                      <Input name="scheduledAt" type="datetime-local" required />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Purpose</Label>
                      <Input name="purpose" required placeholder="Follow-up blood pressure review" />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select name="status" defaultValue="UPCOMING">
                        <option value="UPCOMING">Upcoming</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      className="min-h-[110px]"
                      placeholder="Pre-visit notes, questions, documents to bring."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Follow-up notes</Label>
                    <Textarea
                      name="followUpNotes"
                      className="min-h-[110px]"
                      placeholder="What happened after the consultation, recommendations, next steps."
                    />
                  </div>

                  <Button type="submit" size="lg">
                    Add appointment
                  </Button>
                </form>
              </ModuleFormCard>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <ModuleListCard
                  title="Appointment timeline"
                  description="A cleaner visit history with purpose, doctor, and follow-up context."
                >
                  <div className="space-y-4">
                    {appointments.length ? (
                      appointments.map((appointment) => (
                        <DataCard key={appointment.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{appointment.purpose}</h3>
                              <p className="text-sm text-muted-foreground">
                                {appointment.doctorName} • {appointment.clinic}
                              </p>
                            </div>
                            <Badge className="bg-background/70">{appointment.status}</Badge>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                            <p>Specialty: {appointment.specialty ?? "—"}</p>
                            <p>When: {formatDateTime(appointment.scheduledAt)}</p>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                              <div className="flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">Visit notes</p>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {appointment.notes ?? "No notes added."}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                              <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">Follow-up</p>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {appointment.followUpNotes ?? "No follow-up notes added."}
                              </p>
                            </div>
                          </div>
                        </DataCard>
                      ))
                    ) : (
                      <EmptyState
                        title="No appointments yet"
                        description="Add upcoming consultations and store follow-up notes after each visit."
                      />
                    )}
                  </div>
                </ModuleListCard>
              </div>
            </StaggerItem>
          </div>
        </StaggerGroup>
      </div>
    </AppShell>
  );
}