import Link from "next/link";
import { AlertRuleCategory, AlertSeverity, AlertSourceType, SymptomSeverity, ThresholdOperator } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { createAlertRule, deleteAlertRule, updateAlertRule } from "@/app/alerts/actions";
import { getAlertRules } from "@/lib/alerts/queries";
import { requireUser } from "@/lib/session";

function RuleFields({ prefix = "" }: { prefix?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${prefix}name`}>Rule name</Label>
        <Input id={`${prefix}name`} name="name" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${prefix}description`}>Description</Label>
        <Textarea id={`${prefix}description`} name="description" rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}category`}>Category</Label>
        <Select id={`${prefix}category`} name="category" defaultValue={AlertRuleCategory.VITAL_THRESHOLD}>
          {Object.values(AlertRuleCategory).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}severity`}>Severity</Label>
        <Select id={`${prefix}severity`} name="severity" defaultValue={AlertSeverity.MEDIUM}>
          {Object.values(AlertSeverity).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}sourceType`}>Source type</Label>
        <Select id={`${prefix}sourceType`} name="sourceType" defaultValue="">
          <option value="">Any source</option>
          {Object.values(AlertSourceType).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}metricKey`}>Metric key</Label>
        <Input id={`${prefix}metricKey`} name="metricKey" placeholder="bloodPressure, heartRate, etc." />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}thresholdOperator`}>Threshold operator</Label>
        <Select id={`${prefix}thresholdOperator`} name="thresholdOperator" defaultValue="">
          <option value="">Not set</option>
          {Object.values(ThresholdOperator).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}thresholdValue`}>Threshold value</Label>
        <Input id={`${prefix}thresholdValue`} name="thresholdValue" type="number" step="0.01" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}thresholdValueSecondary`}>Secondary threshold value</Label>
        <Input id={`${prefix}thresholdValueSecondary`} name="thresholdValueSecondary" type="number" step="0.01" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}symptomSeverity`}>Symptom severity</Label>
        <Select id={`${prefix}symptomSeverity`} name="symptomSeverity" defaultValue="">
          <option value="">Not set</option>
          {Object.values(SymptomSeverity).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}medicationMissedCount`}>Missed medication count</Label>
        <Input id={`${prefix}medicationMissedCount`} name="medicationMissedCount" type="number" min="1" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}syncStaleHours`}>Sync stale hours</Label>
        <Input id={`${prefix}syncStaleHours`} name="syncStaleHours" type="number" min="1" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}cooldownMinutes`}>Cooldown minutes</Label>
        <Input id={`${prefix}cooldownMinutes`} name="cooldownMinutes" type="number" min="1" defaultValue="180" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}lookbackHours`}>Lookback hours</Label>
        <Input id={`${prefix}lookbackHours`} name="lookbackHours" type="number" min="1" defaultValue="24" />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="enabled" defaultChecked /> Enabled</label>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="visibleToCareTeam" defaultChecked /> Visible to care team</label>
    </div>
  );
}

export default async function AlertRulesPage() {
  const currentUser = await requireUser();
  const rules = await getAlertRules({ userId: currentUser.id! });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Alert rules"
          description="Create and maintain rule thresholds that drive the alert center."
          action={<Link href="/alerts" className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50">Back to alerts</Link>}
        />

        <Card>
          <CardHeader>
            <CardTitle>Create rule</CardTitle>
            <CardDescription>Add a new threshold or workflow rule.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAlertRule} className="space-y-4">
              <RuleFields />
              <Button type="submit">Create rule</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription className="mt-1">{rule.description ?? "No description provided."}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={rule.enabled ? "success" : "neutral"}>{rule.enabled ? "Enabled" : "Disabled"}</StatusPill>
                    <StatusPill tone="info">{rule.severity}</StatusPill>
                    <StatusPill tone="neutral">Events: {rule._count.events}</StatusPill>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={updateAlertRule} className="space-y-4">
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Rule name</Label>
                      <Input name="name" defaultValue={rule.name} required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea name="description" rows={3} defaultValue={rule.description ?? ""} />
                    </div>
                    <div className="space-y-2"><Label>Category</Label><Select name="category" defaultValue={rule.category}>{Object.values(AlertRuleCategory).map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
                    <div className="space-y-2"><Label>Severity</Label><Select name="severity" defaultValue={rule.severity}>{Object.values(AlertSeverity).map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
                    <div className="space-y-2"><Label>Source type</Label><Select name="sourceType" defaultValue={rule.sourceType ?? ""}><option value="">Any source</option>{Object.values(AlertSourceType).map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
                    <div className="space-y-2"><Label>Metric key</Label><Input name="metricKey" defaultValue={rule.metricKey ?? ""} /></div>
                    <div className="space-y-2"><Label>Threshold operator</Label><Select name="thresholdOperator" defaultValue={rule.thresholdOperator ?? ""}><option value="">Not set</option>{Object.values(ThresholdOperator).map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
                    <div className="space-y-2"><Label>Threshold value</Label><Input name="thresholdValue" type="number" step="0.01" defaultValue={rule.thresholdValue ?? ""} /></div>
                    <div className="space-y-2"><Label>Secondary threshold value</Label><Input name="thresholdValueSecondary" type="number" step="0.01" defaultValue={rule.thresholdValueSecondary ?? ""} /></div>
                    <div className="space-y-2"><Label>Symptom severity</Label><Select name="symptomSeverity" defaultValue={rule.symptomSeverity ?? ""}><option value="">Not set</option>{Object.values(SymptomSeverity).map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
                    <div className="space-y-2"><Label>Missed medication count</Label><Input name="medicationMissedCount" type="number" min="1" defaultValue={rule.medicationMissedCount ?? ""} /></div>
                    <div className="space-y-2"><Label>Sync stale hours</Label><Input name="syncStaleHours" type="number" min="1" defaultValue={rule.syncStaleHours ?? ""} /></div>
                    <div className="space-y-2"><Label>Cooldown minutes</Label><Input name="cooldownMinutes" type="number" min="1" defaultValue={rule.cooldownMinutes} /></div>
                    <div className="space-y-2"><Label>Lookback hours</Label><Input name="lookbackHours" type="number" min="1" defaultValue={rule.lookbackHours} /></div>
                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="enabled" defaultChecked={rule.enabled} /> Enabled</label>
                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="visibleToCareTeam" defaultChecked={rule.visibleToCareTeam} /> Visible to care team</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit">Save rule</Button>
                  </div>
                </form>
                <form action={deleteAlertRule}>
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <Button type="submit" variant="destructive">Delete rule</Button>
                </form>
              </CardContent>
            </Card>
          ))}
          {!rules.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No alert rules yet.</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
