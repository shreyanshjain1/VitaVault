import Link from "next/link";
import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ModuleHero, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";

const exportsList = [
  {
    href: "/exports/appointments",
    title: "Appointments CSV",
    description: "Visit history, doctors, clinics, and statuses.",
  },
  {
    href: "/exports/medications",
    title: "Medications CSV",
    description: "Medication plans, schedules, and current tracking data.",
  },
  {
    href: "/exports/labs",
    title: "Lab Results CSV",
    description: "Lab history with dates, summaries, and flags.",
  },
  {
    href: "/exports/vitals",
    title: "Vitals CSV",
    description: "Structured vital history for spreadsheet review.",
  },
];

export default function ExportsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Exports"
            description="Download structured CSV exports of your records for offline review, analysis, or handoff."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{exportsList.length} export types</Badge>
                <Badge className="bg-background/70">CSV only</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Data portability"
            title="Structured record exports"
            description="Exports are intentionally simple and operational so your data can move easily into Excel, reports, or client workflows."
            stats={[
              { label: "Available exports", value: exportsList.length },
              { label: "Format", value: "CSV" },
              { label: "Scope", value: "Your records only" },
              { label: "Use case", value: "Offline analysis" },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle>Export options</CardTitle>
                  <CardDescription className="mt-1">
                    Download structured datasets from the main health modules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {exportsList.map((item) => (
                      <DataCard key={item.href}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
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
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Export guidance</CardTitle>
                    <CardDescription className="mt-1">
                      Keep exports useful and controlled.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataCard>
                      <p className="text-sm font-medium">Best use cases</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li>Spreadsheet review</li>
                        <li>Admin reporting</li>
                        <li>Record backup</li>
                        <li>Manual data analysis</li>
                      </ul>
                    </DataCard>

                    <DataCard>
                      <p className="text-sm font-medium">Current format</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        CSV keeps the export simple, widely compatible, and easy to inspect.
                      </p>
                    </DataCard>
                  </CardContent>
                </Card>

                <Card className="bg-background/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        These exports are scoped to the signed-in user’s records and meant for controlled operational use.
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