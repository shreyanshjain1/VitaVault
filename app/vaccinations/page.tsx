import { format } from "date-fns";
import { Syringe, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { deleteVaccination, saveVaccination, updateVaccination } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { getFocusedCardClass } from "@/lib/record-focus";
import { db } from "@/lib/db";
import { Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";
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

function dateInputValue(value: Date | null) {
  return value ? format(value, "yyyy-MM-dd") : "";
}

export default async function VaccinationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const focus = typeof params.focus === "string" ? params.focus : undefined;

  const records = await db.vaccinationRecord.findMany({
    where: { userId: user.id },
    orderBy: { dateTaken: "desc" },
  });

  const upcomingDueCount = records.filter(
    (record) => record.nextDueDate && record.nextDueDate >= new Date()
  ).length;

  const latestRecord = records[0] ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Vaccination History"
            description="Track vaccine doses, clinics, and upcoming due dates in one long-term preventive care record."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{records.length} records</Badge>
                <Badge className="bg-background/70">{upcomingDueCount} upcoming due</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Preventive care"
            title="Vaccination timeline"
            description="Keep your immunization history structured so it stays useful for exports, care-team sharing, and future reminders."
            stats={[
              { label: "Stored vaccines", value: records.length },
              { label: "Upcoming due", value: upcomingDueCount },
              {
                label: "Latest vaccine",
                value: latestRecord ? latestRecord.vaccineName : "—",
                hint: latestRecord ? formatDate(latestRecord.dateTaken) : "No record yet",
              },
              {
                label: "Latest location",
                value: latestRecord?.location ?? "—",
              },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Add vaccination"
                description="Log a vaccine dose, clinic, and next due date for future tracking."
              >
                <form action={saveVaccination} className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Vaccine name</Label>
                    <Input name="vaccineName" required placeholder="Influenza Vaccine" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Dose number</Label>
                      <Input name="doseNumber" type="number" min="1" required placeholder="1" />
                    </div>

                    <div className="space-y-2">
                      <Label>Date taken</Label>
                      <Input name="dateTaken" type="date" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Clinic / location</Label>
                    <Input name="location" placeholder="Mercury Drug Clinic" />
                  </div>

                  <div className="space-y-2">
                    <Label>Next due date</Label>
                    <Input name="nextDueDate" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      className="min-h-[120px]"
                      placeholder="Batch, side effects, booster plan, or any relevant notes."
                    />
                  </div>

                  <Button type="submit" size="lg">
                    Add vaccination
                  </Button>
                </form>
              </ModuleFormCard>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <ModuleListCard
                  title="Vaccination records"
                  description="A clearer immunization timeline with date, dose, location, and due-date context."
                >
                  <div className="space-y-4">
                    {records.length ? (
                      records.map((record) => (
                        <DataCard
                        key={record.id}
                        className={getFocusedCardClass(focus, record.id)}
                      >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{record.vaccineName}</h3>
                              <p className="text-sm text-muted-foreground">
                                Dose {record.doseNumber} • {record.location ?? "No location recorded"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-background/70">
                                Taken: {formatDate(record.dateTaken)}
                              </Badge>
                              {record.nextDueDate ? (
                                <Badge className="bg-background/70">
                                  Due: {formatDate(record.nextDueDate)}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="flex items-center gap-2">
                              <Syringe className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">Notes</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {record.notes ?? "No notes added."}
                            </p>
                          </div>

                          <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                            <p className="mb-3 text-sm font-medium">Manage vaccination record</p>
                            <form action={updateVaccination} className="grid gap-4">
                              <input type="hidden" name="vaccinationId" value={record.id} />

                              <div className="space-y-2">
                                <Label>Vaccine name</Label>
                                <Input name="vaccineName" defaultValue={record.vaccineName} required />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Dose number</Label>
                                  <Input name="doseNumber" type="number" min="1" defaultValue={record.doseNumber} required />
                                </div>

                                <div className="space-y-2">
                                  <Label>Date taken</Label>
                                  <Input
                                    name="dateTaken"
                                    type="date"
                                    defaultValue={dateInputValue(record.dateTaken)}
                                    required
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Clinic / location</Label>
                                <Input name="location" defaultValue={record.location ?? ""} />
                              </div>

                              <div className="space-y-2">
                                <Label>Next due date</Label>
                                <Input
                                  name="nextDueDate"
                                  type="date"
                                  defaultValue={dateInputValue(record.nextDueDate)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea name="notes" className="min-h-[120px]" defaultValue={record.notes ?? ""} />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button type="submit" size="sm">
                                  Save changes
                                </Button>
                              </div>
                            </form>

                            <form action={deleteVaccination} className="mt-3">
                              <input type="hidden" name="vaccinationId" value={record.id} />
                              <Button type="submit" size="sm" variant="destructive">
                                Delete record
                              </Button>
                            </form>
                          </div>
                        </DataCard>
                      ))
                    ) : (
                      <EmptyState
                        title="No vaccination records"
                        description="Store vaccines and next due dates for long-term health tracking."
                      />
                    )}
                  </div>
                </ModuleListCard>

                <div className="rounded-[28px] border border-border/60 bg-background/40 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Vaccination history becomes especially useful in printable summaries and future reminder workflows.
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          </div>
        </StaggerGroup>
      </div>
    </AppShell>
  );
}
