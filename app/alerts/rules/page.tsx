import Link from "next/link";
import { ShieldAlert, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getAlertRules } from "@/lib/alerts/queries";
import { createAlertRule, deleteAlertRule, updateAlertRule } from "@/app/alerts/actions";

function categoryHint(category: string) {
  switch (category) {
    case "VITAL_THRESHOLD":
      return "Use metric + threshold fields.";
    case "MEDICATION_ADHERENCE":
      return "Set missed count threshold.";
    case "SYMPTOM_SEVERITY":
      return "Choose the symptom severity trigger.";
    case "SYNC_HEALTH":
      return "Use stale sync hours.";
    default:
      return "Configure the rule inputs below.";
  }
}

export default async function AlertRulesPage() {
  const user = await requireUser();
  const rules = await getAlertRules(user.id!);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Alert rules"
          description="Create and tune threshold rules that drive the alert center. This is the control layer behind triage and monitoring."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/alerts"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Back to alerts
              </Link>
              <Badge className="bg-background/70">{rules.length} rules</Badge>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create rule</CardTitle>
              <CardDescription>
                Start with one clean rule at a time. Keep the first batch focused and clinically obvious.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createAlertRule} className="grid gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" required placeholder="High blood pressure threshold" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Explain when this should trigger." />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select name="category" defaultValue="VITAL_THRESHOLD">
                      <option value="VITAL_THRESHOLD">Vital threshold</option>
                      <option value="MEDICATION_ADHERENCE">Medication adherence</option>
                      <option value="SYMPTOM_SEVERITY">Symptom severity</option>
                      <option value="SYNC_HEALTH">Sync health</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select name="severity" defaultValue="MEDIUM">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Metric key</Label>
                    <Input name="metricKey" placeholder="systolic" />
                  </div>
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select name="thresholdOperator" defaultValue="">
                      <option value="">Not used</option>
                      <option value="GT">Greater than</option>
                      <option value="GTE">Greater than or equal</option>
                      <option value="LT">Less than</option>
                      <option value="LTE">Less than or equal</option>
                      <option value="BETWEEN">Between</option>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary threshold</Label>
                    <Input name="thresholdValue" type="number" step="0.01" placeholder="140" />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary threshold</Label>
                    <Input name="thresholdValueSecondary" type="number" step="0.01" placeholder="180" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Missed count</Label>
                    <Input name="medicationMissedCount" type="number" min="1" placeholder="2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Symptom severity</Label>
                    <Select name="symptomSeverity" defaultValue="">
                      <option value="">Not used</option>
                      <option value="MILD">Mild</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="SEVERE">Severe</option>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Stale sync hours</Label>
                    <Input name="syncStaleHours" type="number" min="1" placeholder="24" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cooldown minutes</Label>
                    <Input name="cooldownMinutes" type="number" min="0" defaultValue="180" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lookback hours</Label>
                    <Input name="lookbackHours" type="number" min="1" defaultValue="24" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="enabled" defaultChecked />
                    Enabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="visibleToCareTeam" defaultChecked />
                    Visible to care team
                  </label>
                </div>

                <Button type="submit" size="lg">
                  <ShieldAlert className="h-4 w-4" />
                  Create alert rule
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {rules.length ? (
              rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle>{rule.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {rule.description || categoryHint(rule.category)}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-background/70">{rule.category}</Badge>
                        <Badge className="bg-background/70">{rule.severity}</Badge>
                        <Badge className="bg-background/70">{rule.enabled ? "Enabled" : "Disabled"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-sm">
                        <div className="text-muted-foreground">Cooldown</div>
                        <div className="font-medium">{rule.cooldownMinutes} min</div>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-sm">
                        <div className="text-muted-foreground">Lookback</div>
                        <div className="font-medium">{rule.lookbackHours} hr</div>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-sm">
                        <div className="text-muted-foreground">Care team</div>
                        <div className="font-medium">{rule.visibleToCareTeam ? "Visible" : "Private"}</div>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-sm">
                        <div className="text-muted-foreground">Triggered events</div>
                        <div className="font-medium">{rule._count.events}</div>
                      </div>
                    </div>

                    <form action={updateAlertRule} className="grid gap-4 rounded-2xl border border-border/60 bg-background/30 p-4">
                      <input type="hidden" name="ruleId" value={rule.id} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input name="name" required defaultValue={rule.name} />
                        </div>
                        <div className="space-y-2">
                          <Label>Metric key</Label>
                          <Input name="metricKey" defaultValue={rule.metricKey ?? ""} placeholder="systolic" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea name="description" defaultValue={rule.description ?? ""} />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select name="category" defaultValue={rule.category}>
                            <option value="VITAL_THRESHOLD">Vital threshold</option>
                            <option value="MEDICATION_ADHERENCE">Medication adherence</option>
                            <option value="SYMPTOM_SEVERITY">Symptom severity</option>
                            <option value="SYNC_HEALTH">Sync health</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Severity</Label>
                          <Select name="severity" defaultValue={rule.severity}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Operator</Label>
                          <Select name="thresholdOperator" defaultValue={rule.thresholdOperator ?? ""}>
                            <option value="">Not used</option>
                            <option value="GT">Greater than</option>
                            <option value="GTE">Greater than or equal</option>
                            <option value="LT">Less than</option>
                            <option value="LTE">Less than or equal</option>
                            <option value="BETWEEN">Between</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Symptom severity</Label>
                          <Select name="symptomSeverity" defaultValue={rule.symptomSeverity ?? ""}>
                            <option value="">Not used</option>
                            <option value="MILD">Mild</option>
                            <option value="MODERATE">Moderate</option>
                            <option value="SEVERE">Severe</option>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                        <div className="space-y-2">
                          <Label>Primary threshold</Label>
                          <Input name="thresholdValue" type="number" step="0.01" defaultValue={rule.thresholdValue ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary threshold</Label>
                          <Input name="thresholdValueSecondary" type="number" step="0.01" defaultValue={rule.thresholdValueSecondary ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label>Missed count</Label>
                          <Input name="medicationMissedCount" type="number" min="1" defaultValue={rule.medicationMissedCount ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label>Stale sync hours</Label>
                          <Input name="syncStaleHours" type="number" min="1" defaultValue={rule.syncStaleHours ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label>Lookback hours</Label>
                          <Input name="lookbackHours" type="number" min="1" defaultValue={rule.lookbackHours} />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Cooldown minutes</Label>
                          <Input name="cooldownMinutes" type="number" min="0" defaultValue={rule.cooldownMinutes} />
                        </div>
                        <div className="grid gap-3 pt-8 md:grid-cols-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="enabled" defaultChecked={rule.enabled} />
                            Enabled
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="visibleToCareTeam" defaultChecked={rule.visibleToCareTeam} />
                            Visible to care team
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button type="submit">
                          <Workflow className="h-4 w-4" />
                          Save changes
                        </Button>
                      </div>
                    </form>

                    <form action={deleteAlertRule}>
                      <input type="hidden" name="ruleId" value={rule.id} />
                      <Button type="submit" variant="destructive">Delete rule</Button>
                    </form>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                title="No alert rules yet"
                description="Create your first rule so the alert center has real monitoring logic behind it."
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
