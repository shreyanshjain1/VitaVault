import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { DemoHeader, DemoSection, ProgressBar, StatCards, TimelineList } from "@/components/demo-primitives";
import { demoFeatureHighlights, demoPersona, demoProductHubs, demoTourSteps } from "@/lib/demo-data";

const routeGroups = [
  {
    title: "1. Product command center",
    body: "Start here to see the patient snapshot, active risks, upcoming care, and recent record activity.",
    links: [
      { label: "Dashboard", href: "/demo/dashboard" },
      { label: "Health Profile", href: "/demo/health-profile" },
      { label: "Timeline", href: "/demo/timeline" },
    ],
  },
  {
    title: "2. Care workflow hubs",
    body: "These authenticated app routes show how VitaVault turns health records into prioritized care actions.",
    links: [
      { label: "Notification Center", href: "/notifications" },
      { label: "Care Plan", href: "/care-plan" },
      { label: "Visit Prep", href: "/visit-prep" },
      { label: "Emergency Card", href: "/emergency-card" },
    ],
  },
  {
    title: "3. Clinical review hubs",
    body: "These review pages add signals, readiness scoring, and handoff context on top of structured records.",
    links: [
      { label: "Health Trends", href: "/trends" },
      { label: "Medication Safety", href: "/medication-safety" },
      { label: "Lab Review", href: "/lab-review" },
      { label: "Vitals Monitor", href: "/vitals-monitor" },
      { label: "Symptom Review", href: "/symptom-review" },
    ],
  },
  {
    title: "4. Clinical record depth",
    body: "Review the breadth of structured record modules that make the app more than a dashboard mockup.",
    links: [
      { label: "Medications", href: "/demo/medications" },
      { label: "Labs", href: "/demo/labs" },
      { label: "Vitals", href: "/demo/vitals" },
      { label: "Symptoms", href: "/demo/symptoms" },
      { label: "Documents", href: "/demo/documents" },
    ],
  },
  {
    title: "5. Action and care workflows",
    body: "These pages show reminders, alerts, review queues, AI insights, and patient handoff outputs.",
    links: [
      { label: "Alerts", href: "/demo/alerts" },
      { label: "Reminders", href: "/demo/reminders" },
      { label: "AI Insights", href: "/demo/ai-insights" },
      { label: "Review Queue", href: "/demo/review-queue" },
      { label: "Summary", href: "/demo/summary" },
      { label: "Exports", href: "/demo/exports" },
    ],
  },
  {
    title: "6. Business and operations layer",
    body: "Finish with the product surfaces that show security, team access, background jobs, device readiness, and admin control.",
    links: [
      { label: "Care Team", href: "/demo/care-team" },
      { label: "Device Connections", href: "/demo/device-connection" },
      { label: "Audit Log", href: "/audit-log" },
      { label: "Security", href: "/demo/security" },
      { label: "Jobs", href: "/demo/jobs" },
      { label: "Ops", href: "/demo/ops" },
      { label: "Admin", href: "/demo/admin" },
      { label: "API Docs", href: "/api-docs" },
    ],
  },
];

export default function DemoWalkthroughPage() {
  return (
    <div className="space-y-6">
      <DemoHeader
        eyebrow="Guided reviewer path"
        title="VitaVault product walkthrough"
        description={`Follow this route to review VitaVault through ${demoPersona.patient}'s sample care-management story. The goal is to show product depth, workflow thinking, and operational readiness without requiring login.`}
        actions={
          <>
            <Link href="/demo/dashboard" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Begin with dashboard</Link>
            <Link href="/login" className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">Open real app</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DemoSection title="Walkthrough progress model" description="The demo shell explains the recommended route across records, workflow hubs, review hubs, reports, and operations.">
          <div className="space-y-4">
            <ProgressBar value={100} label="Recommended route coverage" />
            <TimelineList items={demoTourSteps.map((step) => ({ title: `${step.step}. ${step.title}`, body: step.body, meta: step.route, status: step.status, href: step.route }))} />
          </div>
        </DemoSection>
        <DemoSection title="What to look for while reviewing">
          <StatCards items={demoFeatureHighlights} />
        </DemoSection>
      </div>

      <DemoSection title="Newest Patch 12–19 modules" description="These newer authenticated feature hubs are now represented in the showcase so reviewers can understand the expanded product layer.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demoProductHubs.map((hub) => (
            <Link key={hub.href} href={hub.href} className="rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:bg-muted/60">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{hub.layer}</p>
              <p className="mt-2 font-semibold tracking-tight">{hub.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{hub.body}</p>
            </Link>
          ))}
        </div>
      </DemoSection>

      <div className="grid gap-6 md:grid-cols-2">
        {routeGroups.map((group) => (
          <DemoSection key={group.title} title={group.title} description={group.body}>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-medium transition hover:bg-muted/60">
                  <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </DemoSection>
        ))}
      </div>
    </div>
  );
}
