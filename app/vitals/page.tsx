import { format } from "date-fns";
import { HeartPulse, Activity } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { deleteVital, saveVital, updateVital } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { getFocusedCardClass } from "@/lib/record-focus";
import { db } from "@/lib/db";
import { Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
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

function dateTimeLocalValue(value: Date) {
  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export default async function VitalsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string[] | string | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const focus = typeof params.focus === "string" ? params.focus : undefined;

  const vitals = await db.vitalRecord.findMany({
    where: { userId: user.id },
    orderBy: { recordedAt: "desc" },
  });

  const latest = vitals[0] ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Vitals"
            description="Capture blood pressure, heart rate, sugar, oxygen, temperature, and weight in one consistent record."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{vitals.length} entries</Badge>
                <Badge className="bg-background/70">
                  {latest ? `Latest: ${formatDateTime(latest.recordedAt)}` : "No entries yet"}
                </Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Vital signs"
            title="Structured vital sign tracking"
            description="This page is intentionally ready for future Android Health Connect and device-fed readings later."
            stats={[
              { label: "Total entries", value: vitals.length },
              {
                label: "Latest BP",
                value:
                  latest?.systolic && latest?.diastolic
                    ? `${latest.systolic}/${latest.diastolic}`
                    : "—",
              },
              { label: "Latest heart rate", value: latest?.heartRate ?? "—" },
              {
                label: "Latest oxygen",
                value: latest?.oxygenSaturation ? `${latest.oxygenSaturation}%` : "—",
              },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Add vital reading"
                description="Log a manual vital entry now. These same fields can later accept mobile or device-linked readings."
              >
                <form action={saveVital} className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Recorded at</Label>
                    <Input name="recordedAt" type="datetime-local" required />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Systolic</Label>
                      <Input name="systolic" type="number" placeholder="120" />
                    </div>

                    <div className="space-y-2">
                      <Label>Diastolic</Label>
                      <Input name="diastolic" type="number" placeholder="80" />
                    </div>

                    <div className="space-y-2">
                      <Label>Heart rate</Label>
                      <Input name="heartRate" type="number" placeholder="72" />
                    </div>

                    <div className="space-y-2">
                      <Label>Blood sugar</Label>
                      <Input name="bloodSugar" type="number" step="0.01" placeholder="95" />
                    </div>

                    <div className="space-y-2">
                      <Label>Oxygen saturation</Label>
                      <Input name="oxygenSaturation" type="number" placeholder="98" />
                    </div>

                    <div className="space-y-2">
                      <Label>Temperature (°C)</Label>
                      <Input name="temperatureC" type="number" step="0.01" placeholder="36.8" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Weight (kg)</Label>
                      <Input name="weightKg" type="number" step="0.01" placeholder="81" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      className="min-h-[110px]"
                      placeholder="Context, symptoms, activity, or medication timing around this reading."
                    />
                  </div>

                  <Button type="submit" size="lg">
                    Add vital entry
                  </Button>
                </form>
              </ModuleFormCard>
            </StaggerItem>

            <StaggerItem>
              <ModuleListCard
                title="Vital history"
                description="A cleaner view of each reading so trends are easier to review later."
              >
                <div className="space-y-4">
                  {vitals.length ? (
                    vitals.map((vital) => (
                      <DataCard
                        key={vital.id}
                        className={getFocusedCardClass(focus, vital.id)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold">{formatDateTime(vital.recordedAt)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {vital.readingSource === "MANUAL" ? "Manual vital record entry" : vital.readingSource}
                            </p>
                          </div>
                          <Badge className="bg-background/70">Vital record</Badge>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                          <p>
                            Blood pressure: {vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : "—"}
                          </p>
                          <p>Heart rate: {vital.heartRate ?? "—"}</p>
                          <p>Blood sugar: {vital.bloodSugar ?? "—"}</p>
                          <p>Oxygen saturation: {vital.oxygenSaturation ?? "—"}</p>
                          <p>Temperature: {vital.temperatureC ?? "—"}</p>
                          <p>Weight: {vital.weightKg ?? "—"}</p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Notes</p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {vital.notes ?? "No notes added."}
                          </p>
                        </div>

                        <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                          <p className="mb-3 text-sm font-medium">Manage vital entry</p>
                          <form action={updateVital} className="grid gap-4">
                            <input type="hidden" name="vitalId" value={vital.id} />

                            <div className="space-y-2">
                              <Label>Recorded at</Label>
                              <Input
                                name="recordedAt"
                                type="datetime-local"
                                defaultValue={dateTimeLocalValue(vital.recordedAt)}
                                required
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Systolic</Label>
                                <Input name="systolic" type="number" defaultValue={vital.systolic ?? ""} />
                              </div>

                              <div className="space-y-2">
                                <Label>Diastolic</Label>
                                <Input name="diastolic" type="number" defaultValue={vital.diastolic ?? ""} />
                              </div>

                              <div className="space-y-2">
                                <Label>Heart rate</Label>
                                <Input name="heartRate" type="number" defaultValue={vital.heartRate ?? ""} />
                              </div>

                              <div className="space-y-2">
                                <Label>Blood sugar</Label>
                                <Input name="bloodSugar" type="number" step="0.01" defaultValue={vital.bloodSugar ?? ""} />
                              </div>

                              <div className="space-y-2">
                                <Label>Oxygen saturation</Label>
                                <Input
                                  name="oxygenSaturation"
                                  type="number"
                                  defaultValue={vital.oxygenSaturation ?? ""}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Temperature (°C)</Label>
                                <Input
                                  name="temperatureC"
                                  type="number"
                                  step="0.01"
                                  defaultValue={vital.temperatureC ?? ""}
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label>Weight (kg)</Label>
                                <Input name="weightKg" type="number" step="0.01" defaultValue={vital.weightKg ?? ""} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea name="notes" className="min-h-[110px]" defaultValue={vital.notes ?? ""} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button type="submit" size="sm">
                                Save changes
                              </Button>
                            </div>
                          </form>

                          <form action={deleteVital} className="mt-3">
                            <input type="hidden" name="vitalId" value={vital.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Delete entry
                            </Button>
                          </form>
                        </div>
                      </DataCard>
                    ))
                  ) : (
                    <EmptyState
                      title="No vital records yet"
                      description="Add manual readings to begin building your timeline."
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
