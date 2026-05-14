import Link from "next/link";
import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoNav, demoDashboardStats, demoSummary, demoOps, demoProductHubs, demoFeatureMatrix, demoNavGroups, demoQaChecklist } from "@/lib/demo-data";

export default function DemoOverviewPage() {
  return (
    <div className="space-y-6">
      <DemoHeader
        eyebrow="No login required"
        title="Explore VitaVault Demo"
        description="Walk through the main VitaVault modules with sample patient data. Everything here is read-only, but the routes show the current product story across records, care workflows, reports, device readiness, security, and operations."
        actions={
          <>
            <Link href="/demo/walkthrough" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Start guided walkthrough</Link>
            <Link href="/demo/admin" className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">Open admin preview</Link>
          </>
        }
      />

      <MetricGrid items={demoDashboardStats} />

      <DemoSection title="What this demo covers" description="The goal here is to give reviewers a reliable map of the real VitaVault product surface, not just a landing-page teaser.">
        <SimpleTable headers={["Area", "What you can inspect in demo"]} rows={demoNav.slice(1).map((item) => [item.label, item.description ?? `Read-only mirror of the ${item.label.toLowerCase()} module`])} />
      </DemoSection>

      <DemoSection title="Demo route QA" description="A quick confidence check showing that the public demo is discoverable, read-only, and ready for reviewers.">
        <StatCards items={demoQaChecklist.map((item) => ({ title: item.label, body: item.detail, status: item.status }))} />
      </DemoSection>

      <DemoSection title="Grouped reviewer map" description="The left navigation is grouped by reviewer task so the demo feels intentional instead of being one long route list.">
        <SimpleTable headers={["Group", "Routes included", "Why it matters"]} rows={demoNavGroups.map((group) => [group.label, group.items.map((item) => item.label).join(" • "), group.description])} />
      </DemoSection>

      <DemoSection title="Newest product hubs" description="These cards highlight the current workflow and clinical-review hubs so reviewers can understand the expanded product layer even when the public demo route is read-only.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoProductHubs.map((hub) => (
            <Link key={hub.href} href={hub.href} className="rounded-[24px] border border-border/60 bg-background/70 p-5 shadow-sm transition hover:bg-muted/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{hub.layer}</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">{hub.label}</h3>
                </div>
                <span className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">App route</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{hub.body}</p>
            </Link>
          ))}
        </div>
      </DemoSection>

      <DemoSection title="Feature matrix" description="A quick reviewer map showing how the modules fit together as one product instead of isolated pages.">
        <SimpleTable headers={["Layer", "Modules", "Value"]} rows={demoFeatureMatrix.map((item) => [item.layer, item.modules, item.value])} />
      </DemoSection>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DemoSection title="Why VitaVault matters">
          <StatCards items={[
            { title: "Patient-centric records", body: "Track medications, labs, symptoms, vitals, vaccines, appointments, documents, and provider relationships in one place.", status: "Core" },
            { title: "Actionable follow-up", body: "Notification Center, Care Plan, Visit Prep, reminders, review queue, AI insights, and alerts help teams move from records to care action.", status: "Workflow" },
            { title: "Operational confidence", body: "Security, audit log, exports, jobs, ops, and admin layers make the product feel business-ready instead of just visually polished.", status: "Ops" },
          ]} />
        </DemoSection>
        <DemoSection title="Demo snapshot">
          <StatCards items={[
            { title: "Clinical summary", body: demoSummary.snapshot, status: "Healthy" },
            { title: "Ops readiness", body: demoOps.readiness.map((item) => `${item.label}: ${item.status}`).join(" • "), status: "Configured" },
            { title: "Best route through the demo", body: "Dashboard → Notifications → Care Plan → Data Quality → Device Connections → Exports → Security → Admin", status: "Recommended" },
          ]} />
        </DemoSection>
      </div>
    </div>
  );
}
