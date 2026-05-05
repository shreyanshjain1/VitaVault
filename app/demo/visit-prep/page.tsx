import { DemoHeader, DemoSection, ProgressBar, SimpleTable, StatCards, ToneBadge } from "@/components/demo-primitives";
import { demoVisitPrepHub } from "@/lib/demo-data";

export default function DemoVisitPrepPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Care workflow" title="Visit Prep demo" description={`Provider-ready prep for ${demoVisitPrepHub.nextVisit}.`} />
      <DemoSection title="Visit readiness"><ProgressBar value={demoVisitPrepHub.readiness} label="Visit prep readiness" /></DemoSection>
      <DemoSection title="Readiness checklist"><SimpleTable headers={["Item", "Status"]} rows={demoVisitPrepHub.checklist.map((item) => [item.item, <ToneBadge key={item.item} value={item.status} />])} /></DemoSection>
      <DemoSection title="Prep task queue"><StatCards items={demoVisitPrepHub.tasks.map((item) => ({ title: item.title, body: item.detail, status: item.priority }))} /></DemoSection>
    </div>
  );
}
