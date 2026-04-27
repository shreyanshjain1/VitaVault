import Link from "next/link";
import { DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoNav, demoDashboardStats, demoSummary, demoOps } from "@/lib/demo-data";

export default function DemoOverviewPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="No login required" title="Explore VitaVault Demo" description="This public demo is a deeper mirror of VitaVault’s real authenticated product: patient records, reminders, alerts, exports, security, operations, and admin oversight, all shown with safe sample data." actions={<><Link href="/demo/dashboard" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open dashboard</Link><Link href="/demo/admin" className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">See admin view</Link></>} />
      <MetricGrid items={demoDashboardStats} />
      <DemoSection title="What this demo covers" description="The goal here is parity with the real VitaVault product surface, not just a landing-page teaser.">
        <SimpleTable headers={["Area", "What you can inspect in demo"]} rows={demoNav.slice(1).map((item) => [item.label, item.description ?? `Read-only mirror of the ${item.label.toLowerCase()} module`])} />
      </DemoSection>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DemoSection title="Why VitaVault matters">
          <StatCards items={[
            { title: "Patient-centric records", body: "Track medications, labs, symptoms, vitals, vaccines, appointments, documents, and provider relationships in one place.", status: "Core" },
            { title: "Actionable follow-up", body: "Reminder center, review queue, AI insights, and alerts help teams move from records to actual care action.", status: "Workflow" },
            { title: "Operational confidence", body: "Security, exports, jobs, ops, and admin layers make the product feel business-ready instead of just visually polished.", status: "Ops" },
          ]} />
        </DemoSection>
        <DemoSection title="Demo snapshot">
          <StatCards items={[
            { title: "Clinical summary", body: demoSummary.snapshot, status: "Healthy" },
            { title: "Ops readiness", body: demoOps.readiness.map((item) => `${item.label}: ${item.status}`).join(" • "), status: "Configured" },
            { title: "Best route through the demo", body: "Dashboard → Medications → Alerts → Summary → Security → Admin", status: "Recommended" },
          ]} />
        </DemoSection>
      </div>
    </div>
  );
}
