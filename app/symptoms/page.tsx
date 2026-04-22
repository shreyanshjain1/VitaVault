import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { deleteSymptom, saveSymptom, toggleSymptomResolved, updateSymptom } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { getFocusedCardClass } from "@/lib/record-focus";
import { db } from "@/lib/db";
import { Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
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

export default async function SymptomsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const focus = typeof params.focus === "string" ? params.focus : undefined;

  const symptoms = await db.symptomEntry.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
  });

  const unresolved = symptoms.filter((s) => !s.resolved).length;
  const resolved = symptoms.filter((s) => s.resolved).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Symptoms"
            description="Keep a symptom timeline with severity, duration, triggers, and resolution status."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{symptoms.length} logged</Badge>
                <Badge className="bg-background/70">{unresolved} unresolved</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Symptom journal"
            title="Track what changed and when"
            description="This gives better visit prep, better patient summaries, and stronger future AI signal quality."
            stats={[
              { label: "Logged symptoms", value: symptoms.length },
              { label: "Unresolved", value: unresolved },
              { label: "Resolved", value: resolved },
              { label: "Latest entry", value: symptoms[0] ? formatDateTime(symptoms[0].startedAt) : "—" },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Log symptom"
                description="Capture symptom context clearly so it is useful later during review."
              >
                <form action={saveSymptom} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Title</Label>
                      <Input name="title" required placeholder="Chest discomfort" />
                    </div>

                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select name="severity" defaultValue="MILD">
                        <option value="MILD">Mild</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Body area</Label>
                      <Input name="bodyArea" placeholder="Chest" />
                    </div>

                    <div className="space-y-2">
                      <Label>Started at</Label>
                      <Input name="startedAt" type="datetime-local" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input name="duration" placeholder="30 minutes" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Trigger</Label>
                      <Input name="trigger" placeholder="After climbing stairs" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" name="resolved" />
                      Mark as resolved
                    </label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Resolution tracking helps timelines and future trend detection.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      className="min-h-[120px]"
                      placeholder="Describe the symptom, what it felt like, and anything that helped."
                    />
                  </div>

                  <Button type="submit" size="lg">
                    Add symptom
                  </Button>
                </form>
              </ModuleFormCard>
            </StaggerItem>

            <StaggerItem>
              <ModuleListCard
                title="Symptom timeline"
                description="A cleaner symptom history with severity and context."
              >
                <div className="space-y-4">
                  {symptoms.length ? (
                    symptoms.map((symptom) => (
                      <DataCard
                          key={symptom.id}
                          className={getFocusedCardClass(focus, symptom.id)}
                        >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold">{symptom.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Started: {formatDateTime(symptom.startedAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-background/70">{symptom.severity}</Badge>
                            <Badge className="bg-background/70">
                              {symptom.resolved ? "RESOLVED" : "ACTIVE"}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                          <p>Body area: {symptom.bodyArea ?? "—"}</p>
                          <p>Duration: {symptom.duration ?? "—"}</p>
                          <p className="md:col-span-2">Trigger: {symptom.trigger ?? "—"}</p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Notes</p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {symptom.notes ?? "No notes added."}
                          </p>
                        </div>

                        <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex flex-wrap gap-2">
                            <form action={toggleSymptomResolved}>
                              <input type="hidden" name="symptomId" value={symptom.id} />
                              <input type="hidden" name="resolved" value={symptom.resolved ? "false" : "true"} />
                              <Button size="sm" variant={symptom.resolved ? "outline" : "secondary"}>
                                {symptom.resolved ? "Mark as active" : "Mark as resolved"}
                              </Button>
                            </form>
                          </div>

                          <form action={updateSymptom} className="mt-4 grid gap-4">
                            <input type="hidden" name="symptomId" value={symptom.id} />

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label>Title</Label>
                                <Input name="title" defaultValue={symptom.title} required />
                              </div>

                              <div className="space-y-2">
                                <Label>Severity</Label>
                                <Select name="severity" defaultValue={symptom.severity}>
                                  <option value="MILD">Mild</option>
                                  <option value="MODERATE">Moderate</option>
                                  <option value="SEVERE">Severe</option>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Body area</Label>
                                <Input name="bodyArea" defaultValue={symptom.bodyArea ?? ""} />
                              </div>

                              <div className="space-y-2">
                                <Label>Started at</Label>
                                <Input
                                  name="startedAt"
                                  type="datetime-local"
                                  defaultValue={dateTimeLocalValue(symptom.startedAt)}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input name="duration" defaultValue={symptom.duration ?? ""} />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label>Trigger</Label>
                                <Input name="trigger" defaultValue={symptom.trigger ?? ""} />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                              <label className="flex items-center gap-2 text-sm font-medium">
                                <input type="checkbox" name="resolved" defaultChecked={symptom.resolved} />
                                Mark as resolved
                              </label>
                            </div>

                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea name="notes" className="min-h-[120px]" defaultValue={symptom.notes ?? ""} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button type="submit" size="sm">
                                Save changes
                              </Button>
                            </div>
                          </form>

                          <form action={deleteSymptom} className="mt-3">
                            <input type="hidden" name="symptomId" value={symptom.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Delete symptom
                            </Button>
                          </form>
                        </div>
                      </DataCard>
                    ))
                  ) : (
                    <EmptyState
                      title="No symptoms logged yet"
                      description="Add a symptom entry to begin building your journal."
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
