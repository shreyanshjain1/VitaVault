import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, FileText, Printer, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from "@/components/ui";
import { DataCard, ModuleHero } from "@/components/module-sections";
import { PageTransition, StaggerItem } from "@/components/page-transition";
import {
  buildReportBuilderHref,
  buildReportPrintHref,
  getReportBuilderData,
  isSectionSelected,
  sectionQuery,
  type ReportActionItem,
  type ReportHistoryItem,
  type ReportType,
} from "@/lib/report-builder";

const reportTypeOptions: Array<{ value: ReportType; label: string; description: string }> = [
  { value: "patient", label: "Patient summary", description: "Broad personal record packet" },
  { value: "doctor", label: "Doctor visit", description: "Provider-focused handoff" },
  { value: "emergency", label: "Emergency", description: "Critical care snapshot" },
  { value: "care", label: "Care-team", description: "Collaboration and follow-up" },
  { value: "custom", label: "Custom", description: "Manual section selection" },
];

function priorityTone(priority: ReportActionItem["priority"]) {
  if (priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "success" as const;
}

function historyTone(status: ReportHistoryItem["status"]) {
  if (status === "attention") return "danger" as const;
  if (status === "review") return "warning" as const;
  return "success" as const;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function ActionCard({ item }: { item: ReportActionItem }) {
  return (
    <Link href={item.href} className="block rounded-2xl border border-border/60 bg-background/50 p-4 transition hover:border-border hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        </div>
        <StatusPill tone={priorityTone(item.priority)}>{item.priority}</StatusPill>
      </div>
    </Link>
  );
}

export default async function ReportBuilderPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const preset = typeof params.preset === "string" ? params.preset : undefined;
  const reportType = typeof params.type === "string" ? params.type : "patient";
  const sections = Array.isArray(params.sections) ? params.sections.join(",") : typeof params.sections === "string" ? params.sections : undefined;
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const data = await getReportBuilderData({ preset, reportType, sections, from, to });
  const selectedSectionsQuery = sectionQuery(data.selectedSections);
  const printHref = buildReportPrintHref({ preset: data.selectedPreset?.id, reportType: data.reportType, sections: selectedSectionsQuery, from: data.range.from, to: data.range.to });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Report Builder"
            description="Assemble custom patient, doctor, emergency, and care-team report packets with presets, section controls, date ranges, readiness checks, and print previews."
            action={
              <div className="flex flex-wrap gap-2">
                <Link href={printHref} className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95">
                  <Printer className="mr-2 h-4 w-4" />
                  Preview packet
                </Link>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Custom reporting"
            title="Build a report packet from the records that matter for the situation"
            description="Start from a provider, emergency, care-team, medication, or lab preset, then fine-tune the sections and date range before opening a print-ready packet."
            stats={[
              { label: "Readiness", value: `${data.summary.readinessScore}%`, hint: "Section coverage, data coverage, documents, and adherence" },
              { label: "Sections", value: `${data.summary.selectedSectionCount}/${data.summary.availableSectionCount}`, hint: data.selectedPreset ? `${data.selectedPreset.label} preset` : "Selected for this packet" },
              { label: "Records", value: data.summary.totalRecords, hint: data.range.label },
              { label: "Document links", value: `${data.summary.documentLinkRate}%`, hint: "Linked to source records" },
            ]}
          />
        </PageTransition>

        <Card>
          <CardHeader>
            <CardTitle>Packet presets</CardTitle>
            <CardDescription className="mt-1">Use scenario-based shortcuts for common healthcare handoffs, then adjust the controls below.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {data.presets.map((presetItem) => {
              const href = buildReportBuilderHref({ preset: presetItem.id });
              const isActive = data.selectedPreset?.id === presetItem.id;
              return (
                <Link
                  key={presetItem.id}
                  href={href}
                  className={`rounded-2xl border p-4 transition hover:border-border hover:bg-muted/40 ${isActive ? "border-primary/50 bg-primary/5" : "border-border/60 bg-background/50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge>{presetItem.badge}</Badge>
                    {isActive ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                  </div>
                  <p className="mt-3 font-medium">{presetItem.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{presetItem.description}</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Packet controls</CardTitle>
                  <CardDescription className="mt-1">Change packet type, section selection, and date boundaries.</CardDescription>
                </div>
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="type">Report type</Label>
                    <Select id="type" name="type" defaultValue={data.reportType}>
                      {reportTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label} — {option.description}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <Input id="from" name="from" type="date" defaultValue={data.range.from} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Input id="to" name="to" type="date" defaultValue={data.range.to} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Sections</Label>
                    <Badge>{data.summary.selectedSectionCount} selected</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {data.sectionDefinitions.map((section) => (
                      <label key={section.key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 transition hover:border-border hover:bg-muted/40">
                        <input
                          type="checkbox"
                          name="sections"
                          value={section.key}
                          defaultChecked={isSectionSelected(data.selectedSections, section.key)}
                          className="mt-1 h-4 w-4 rounded border-border"
                        />
                        <span>
                          <span className="font-medium">{section.label}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{section.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit">Apply controls</Button>
                  <Link href="/report-builder" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition hover:bg-muted/60">Reset</Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness and pre-report actions</CardTitle>
              <CardDescription className="mt-1">Review these before printing or sharing a report packet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">{data.summary.readinessScore}%</p>
                  <p className="text-sm text-muted-foreground">Report readiness</p>
                </div>
                <StatusPill tone={data.summary.readinessScore >= 75 ? "success" : data.summary.readinessScore >= 50 ? "warning" : "danger"}>
                  {data.summary.readinessScore >= 75 ? "Ready" : "Review first"}
                </StatusPill>
              </div>
              <ProgressBar value={data.summary.readinessScore} />
              <div className="grid gap-3 sm:grid-cols-4">
                <DataCard className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">High-risk alerts</p><p className="mt-1 text-2xl font-semibold">{data.summary.highRiskAlerts}</p></DataCard>
                <DataCard className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">Abnormal labs</p><p className="mt-1 text-2xl font-semibold">{data.summary.abnormalLabs}</p></DataCard>
                <DataCard className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">Open symptoms</p><p className="mt-1 text-2xl font-semibold">{data.summary.unresolvedSymptoms}</p></DataCard>
                <DataCard className="rounded-2xl p-4"><p className="text-xs text-muted-foreground">Care notes</p><p className="mt-1 text-2xl font-semibold">{data.summary.careNotes}</p></DataCard>
              </div>
              <div className="space-y-3">
                {data.actionItems.map((item) => <ActionCard key={`${item.title}-${item.href}`} item={item} />)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Selected section preview</CardTitle>
                <CardDescription className="mt-1">A quick snapshot of what will be included in the generated packet.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {data.sectionDefinitions
                  .filter((section) => isSectionSelected(data.selectedSections, section.key))
                  .map((section) => (
                    <DataCard key={section.key} className="rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{section.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    </DataCard>
                  ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Recent report timeline</CardTitle>
                    <CardDescription className="mt-1">The highest-value events that can appear in the print packet.</CardDescription>
                  </div>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.timeline.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={item.risk === "urgent" ? "danger" : item.risk === "watch" ? "warning" : "neutral"}>{item.risk}</StatusPill>
                          <Badge>{item.type}</Badge>
                        </div>
                        <p className="mt-3 font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                {data.timeline.length === 0 ? <EmptyState title="No timeline events" description="Records in the selected range will appear here." /> : null}
              </CardContent>
            </Card>
          </StaggerItem>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent packet history</CardTitle>
            <CardDescription className="mt-1">A lightweight generated history of the current draft, latest source event, and pre-share checks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {data.reportHistory.map((item) => (
              <Link key={item.id} href={item.href} className="rounded-2xl border border-border/60 bg-background/50 p-4 transition hover:border-border hover:bg-muted/40">
                <div className="flex items-start justify-between gap-3">
                  <StatusPill tone={historyTone(item.status)}>{item.status}</StatusPill>
                  <Badge>{item.recordCount} item{item.recordCount === 1 ? "" : "s"}</Badge>
                </div>
                <p className="mt-3 font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description || "No additional checks required."}</p>
                <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(item.generatedAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-background/40">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Ready to review the packet?</p>
              <p className="text-sm text-muted-foreground">Open a print-friendly preview using the selected sections and date range.</p>
            </div>
            <Link href={printHref} className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95">
              <FileText className="mr-2 h-4 w-4" />
              Open print preview
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
