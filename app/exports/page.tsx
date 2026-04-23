import Link from "next/link";
import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ModuleHero, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { exportDefinitions } from "@/lib/export-definitions";

const groups = ["Core", "Monitoring", "Coordination"] as const;

export default function ExportsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Exports"
            description="Download structured CSV exports of your records for offline review, spreadsheet analysis, handoff, or internal reporting."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{exportDefinitions.length} export types</Badge>
                <Badge className="bg-background/70">CSV only</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Data portability"
            title="Operational exports across the patient workspace"
            description="Export coverage now extends beyond the original core modules so patient handoffs, admin review, and spreadsheet-based workflows are easier to support."
            stats={[
              { label: "Available exports", value: exportDefinitions.length },
              { label: "Format", value: "CSV" },
              { label: "Coverage", value: "Core + coordination" },
              { label: "Use case", value: "Offline reporting" },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle>Export options</CardTitle>
                  <CardDescription className="mt-1">
                    Download structured datasets from the main health, monitoring, and coordination modules.
                  </CardDescription>
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
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{item.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <Badge className="bg-background/70">{item.format}</Badge>
                                <Link
                                  href={item.href}
                                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
                                >
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
                    <CardTitle>Export guidance</CardTitle>
                    <CardDescription className="mt-1">
                      Keep exports useful, readable, and operational.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataCard>
                      <p className="text-sm font-medium">Best use cases</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li>Spreadsheet review</li>
                        <li>Clinical handoff support</li>
                        <li>Operational reporting</li>
                        <li>Record backup and audit prep</li>
                      </ul>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Current format</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        CSV keeps the export simple, widely compatible, and easy to open in Excel, Google Sheets, or internal reporting tools.
                      </p>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Also available</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        For print-ready handoffs, the patient summary page provides a separate PDF-friendly browser print workflow.
                      </p>
                    </DataCard>
                  </CardContent>
                </Card>

                <Card className="bg-background/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        These exports are scoped to the signed-in user’s records and intended for controlled operational use only.
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
