import Link from "next/link";
import { Activity, ArrowRight, Database, LockKeyhole, Smartphone, UsersRound } from "lucide-react";
import { DemoHeader, DemoSection, MetricGrid, ProgressBar, SimpleTable, StatCards, TimelineList } from "@/components/demo-primitives";
import { demoFeatureHighlights, demoNav, demoPersona, demoReadinessChecklist, demoShowcaseMetrics, demoTourSteps } from "@/lib/demo-data";

const productLayers = [
  { icon: Database, title: "Structured records", body: "Profile, medications, appointments, labs, vitals, symptoms, vaccinations, doctors, documents, timeline, and summary views." },
  { icon: Activity, title: "Action workflows", body: "Alerts, reminders, AI insights, review queue, patient handoff reports, and exports show care coordination beyond CRUD forms." },
  { icon: UsersRound, title: "Shared care", body: "Care-team invites, scoped access, shared patient views, and audit-aware care access foundations." },
  { icon: Smartphone, title: "Mobile/device ready", body: "Mobile sessions, device connections, reading ingestion, sync jobs, and API documentation for future connected health flows." },
  { icon: LockKeyhole, title: "Security and ops", body: "Protected documents, account recovery, verification, security center, jobs, ops, and admin visibility." },
];

export default function DemoOverviewPage() {
  return (
    <div className="space-y-6">
      <DemoHeader
        eyebrow="No login required"
        title="Explore VitaVault as a product walkthrough"
        description="This demo is designed for reviewers, recruiters, and stakeholders who want to understand the product surface without needing a configured production database. It uses one consistent patient persona and read-only sample workflows."
        actions={<><Link href="/demo/walkthrough" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Start guided tour</Link><Link href="/demo/dashboard" className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">Open dashboard</Link></>}
      />

      <MetricGrid items={demoShowcaseMetrics} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DemoSection title="Reviewer persona" description="The demo now gives reviewers a clear context before they inspect the modules.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Sample patient</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{demoPersona.patient}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{demoPersona.profile}</p>
            </div>
            <StatCards items={demoFeatureHighlights} />
          </div>
        </DemoSection>
        <DemoSection title="Demo readiness" description="This keeps the public demo honest while still making it useful for product review.">
          <div className="space-y-4">
            <ProgressBar value={92} label="Public showcase readiness" />
            <SimpleTable headers={["Check", "Status", "Detail"]} rows={demoReadinessChecklist.map((item) => ({ key: item.label, cells: [item.label, item.status, item.detail] }))} />
          </div>
        </DemoSection>
      </div>

      <DemoSection title="Recommended route through the product" description="This turns the demo from a list of pages into a guided product story.">
        <TimelineList items={demoTourSteps.map((step) => ({ title: `${step.step}. ${step.title}`, body: step.body, meta: step.route, status: step.status, href: step.route }))} />
      </DemoSection>

      <DemoSection title="What this demo covers" description="Every page below is read-only and safe to explore.">
        <SimpleTable headers={["Area", "What you can inspect in demo"]} rows={demoNav.slice(1).map((item) => [item.label, item.description ?? `Read-only mirror of the ${item.label.toLowerCase()} module`])} />
      </DemoSection>

      <DemoSection title="Product layers shown in the walkthrough">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {productLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div key={layer.title} className="rounded-[24px] border border-border/60 bg-background/70 p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold tracking-tight">{layer.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{layer.body}</p>
              </div>
            );
          })}
        </div>
      </DemoSection>

      <div className="rounded-[28px] border border-primary/20 bg-primary/5 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Best next click</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Open the guided walkthrough</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The walkthrough page explains the exact path a reviewer should follow and why each product area matters.</p>
          </div>
          <Link href="/demo/walkthrough" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Start walkthrough <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
