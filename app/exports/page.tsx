import Link from "next/link";
import { ArrowRight, ClipboardCheck, Download, FileSpreadsheet, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ModuleHero, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { exportDefinitions } from "@/lib/export-definitions";
import { getExportCenterData, type ExportActionItem, type ExportPacket } from "@/lib/export-center";

const groups = ["Core", "Monitoring", "Coordination"] as const;

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

function readinessTone(readiness: ExportPacket["readiness"]): Tone {
  if (readiness === "Ready") return "success";
  if (readiness === "Review first") return "warning";
  return "danger";
}

function priorityTone(priority: ExportActionItem["priority"]): Tone {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "success";
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function PacketCard({ packet }: { packet: ExportPacket }) {
  return (
    <DataCard className="flex h-full flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {packet.format === "Print / PDF" ? <FileText className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
          </div>
          <StatusPill tone={readinessTone(packet.readiness)}>{packet.readiness}</StatusPill>
        </div>
        <div>
          <p className="font-semibold">{packet.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{packet.description}</p>
        </div>
        <p className="rounded-2xl border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">{packet.reason}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge>{packet.format}</Badge>
        <Link href={packet.href} className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95">
          Open
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </DataCard>
  );
}

function ActionItemCard({ item }: { item: ExportActionItem }) {
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

export default async function ExportsPage() {
  const data = await getExportCenterData();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Export Center"
            description="Prepare CSV datasets, print-ready patient packets, and workflow handoff views from one reporting workspace."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{data.summary.csvExportTypes} CSV exports</Badge>
                <Badge className="bg-background/70">{data.summary.reportPackets} report packets</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Reporting and handoff"
            title="A stronger export workspace for patient records, clinical review, and operational reporting"
            description="CSV exports stay available for spreadsheet work, while report packet shortcuts make doctor visits, emergency handoffs, and care-plan reviews easier to prepare."
            stats={[
              { label: "Readiness", value: `${data.summary.readinessScore}%`, hint: "Profile, records, documents, and provider context" },
              { label: "Records covered", value: data.summary.totalRecords, hint: "Across exportable record families" },
              { label: "Open alerts", value: data.summary.openAlerts, hint: `${data.summary.highRiskAlerts} high-priority` },
              { label: "Document links", value: `${data.summary.documentLinkRate}%`, hint: "Documents connected to records" },
            ]}
          />
        </PageTransition>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Export readiness</CardTitle>
              <CardDescription className="mt-1">How ready this workspace is for clean handoff, reporting, and review packets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">{data.summary.readinessScore}%</p>
                  <p className="text-sm text-muted-foreground">Overall export readiness</p>
                </div>
                <StatusPill tone={data.summary.readinessScore >= 75 ? "success" : data.summary.readinessScore >= 50 ? "warning" : "danger"}>
                  {data.summary.readinessScore >= 75 ? "Ready" : "Needs review"}
                </StatusPill>
              </div>
              <ProgressBar value={data.summary.readinessScore} />
              <div className="grid gap-3 md:grid-cols-3">
                {data.csvCoverage.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended before exporting</CardTitle>
              <CardDescription className="mt-1">Fix the highest-impact gaps before sharing reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.actionItems.map((item) => <ActionItemCard key={item.title} item={item} />)}
            </CardContent>
          </Card>
        </div>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>CSV export library</CardTitle>
                      <CardDescription className="mt-1">Download structured datasets from the main health, monitoring, and coordination modules.</CardDescription>
                    </div>
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groups.map((group) => {
                    const items = exportDefinitions.filter((item) => item.group === group);
                    return (
                      <div key={group} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold tracking-wide text-foreground/90">{group}</p>
                          <Badge className="rounded-full bg-background/70">{items.length} exports</Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {items.map((item) => (
                            <DataCard key={item.href}>
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                  <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{item.title}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-between gap-3">
                                <Badge className="bg-background/70">{item.format}</Badge>
                                <Link href={item.href} className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Link>
                              </div>
                            </DataCard>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>Report packets and handoff views</CardTitle>
                        <CardDescription className="mt-1">Open print-friendly packets or review workspaces before sharing records.</CardDescription>
                      </div>
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {data.packets.map((packet) => <PacketCard key={packet.href} packet={packet} />)}
                  </CardContent>
                </Card>

                <Card className="bg-background/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Exports are scoped to the signed-in user. Print packets should be reviewed before sharing with providers, caregivers, or external recipients.
                      </p>
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
